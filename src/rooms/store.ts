import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Client, Transaction } from "@libsql/client";
import { projectSchema } from "@/engine/model";
import {
  createRoomSchema,
  joinRoomSchema,
  mutationSchema,
  RoomError,
  type Member,
  type RoomView,
} from "./model";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const secret = () => randomBytes(32).toString("hex");
const now = () => new Date().toISOString();
const expiry = () => Date.now() + 30 * 86400000;
const schemas = [
  "CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, project TEXT NOT NULL, revision INTEGER NOT NULL, invite_hash TEXT NOT NULL UNIQUE, invite_expires INTEGER NOT NULL, created_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS room_sessions (id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id), secret_hash TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','contributor')), expires INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS room_sessions_room ON room_sessions(room_id)",
  "CREATE TABLE IF NOT EXISTS room_activity (id TEXT PRIMARY KEY, room_id TEXT NOT NULL REFERENCES rooms(id), revision INTEGER NOT NULL, actor TEXT NOT NULL, summary TEXT NOT NULL, at TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS room_activity_room ON room_activity(room_id,revision)",
  "CREATE TABLE IF NOT EXISTS room_requests (room_id TEXT NOT NULL, member_id TEXT NOT NULL, request_id TEXT NOT NULL, fingerprint TEXT NOT NULL, PRIMARY KEY(room_id,member_id,request_id))",
];
export function createRoomStore(
  db: Client,
  storage: "local" | "managed" = "local",
) {
  let initializing: Promise<unknown> | undefined;
  const ready = () =>
    (initializing ??= db.batch(schemas, "write").catch((error) => {
      initializing = undefined;
      throw error;
    }));
  async function event(
    tx: Transaction,
    room: string,
    revision: number,
    actor: string,
    summary: string,
  ) {
    await tx.execute({
      sql: "INSERT INTO room_activity VALUES (?,?,?,?,?,?)",
      args: [randomUUID(), room, revision, actor, summary, now()],
    });
  }
  async function authorized(tx: Transaction, id: string, token?: string) {
    if (!token || !/^[a-f0-9]{64}$/.test(token))
      throw new RoomError(
        401,
        "session_required",
        "Join this room with an invitation, or use the browser that created it.",
      );
    const result = await tx.execute({
      sql: "SELECT s.id member_id,s.name,s.role,r.project,r.revision FROM room_sessions s JOIN rooms r ON r.id=s.room_id WHERE r.id=? AND s.secret_hash=? AND s.expires>?",
      args: [id, digest(token), Date.now()],
    });
    if (!result.rows.length)
      throw new RoomError(
        401,
        "session_required",
        "This room session is missing or expired. Use a current invitation to join.",
      );
    return result.rows[0];
  }
  async function view(
    tx: Transaction,
    id: string,
    token: string,
  ): Promise<RoomView> {
    const row = await authorized(tx, id, token);
    const members = await tx.execute({
      sql: "SELECT id,name,role FROM room_sessions WHERE room_id=? AND expires>? ORDER BY role DESC,name,id",
      args: [id, Date.now()],
    });
    const activity = await tx.execute({
      sql: "SELECT id,actor,summary,revision,at FROM room_activity WHERE room_id=? ORDER BY revision DESC,at DESC LIMIT 50",
      args: [id],
    });
    return {
      id,
      project: projectSchema.parse(JSON.parse(String(row.project))),
      revision: Number(row.revision),
      self: {
        id: String(row.member_id),
        name: String(row.name),
        role: row.role as Member["role"],
        volunteerId: `member-${row.member_id}`,
      },
      members: members.rows.map((m) => ({
        id: String(m.id),
        name: String(m.name),
        role: m.role as Member["role"],
      })),
      activity: activity.rows.map((a) => ({
        id: String(a.id),
        actor: String(a.actor),
        summary: String(a.summary),
        revision: Number(a.revision),
        at: String(a.at),
      })),
      storage,
    };
  }
  async function transaction<T>(
    mode: "read" | "write",
    operation: (tx: Transaction) => Promise<T>,
  ): Promise<T> {
    await ready();
    let tx: Transaction | undefined;
    try {
      tx = await db.transaction(mode);
      const result = await operation(tx);
      await tx.commit();
      return result;
    } catch (error) {
      if (tx) await tx.rollback().catch(() => {});
      if (error instanceof RoomError) throw error;
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        /BUSY|LOCKED/.test(String(error.code))
      )
        throw new RoomError(
          409,
          "conflict",
          "Another update is being committed. Refresh and try again; nothing was overwritten.",
        );
      throw error;
    } finally {
      tx?.close();
    }
  }
  return {
    ready,
    async create(input: unknown) {
      const { name, project } = createRoomSchema.parse(input),
        id = randomBytes(12).toString("hex"),
        token = secret(),
        invite = secret();
      return transaction("write", async (tx) => {
        await tx.execute({
          sql: "INSERT INTO rooms VALUES (?,?,?,?,?,?)",
          args: [
            id,
            JSON.stringify(project),
            1,
            digest(invite),
            Date.now() + 7 * 86400000,
            now(),
          ],
        });
        await tx.execute({
          sql: "INSERT INTO room_sessions VALUES (?,?,?,?,?,?)",
          args: [randomUUID(), id, digest(token), name, "owner", expiry()],
        });
        await event(tx, id, 1, name, "Created this project room");
        return { room: await view(tx, id, token), token, invite };
      });
    },
    async join(id: string, input: unknown, currentToken?: string) {
      const { name, invite } = joinRoomSchema.parse(input),
        token = secret();
      return transaction("write", async (tx) => {
        if (currentToken) {
          try {
            const room = await view(tx, id, currentToken);
            return { room, token: currentToken };
          } catch (error) {
            if (!(error instanceof RoomError) || error.status !== 401)
              throw error;
          }
        }
        const check = await tx.execute({
          sql: "SELECT revision FROM rooms WHERE id=? AND invite_hash=? AND invite_expires>?",
          args: [id, digest(invite), Date.now()],
        });
        if (!check.rows.length)
          throw new RoomError(
            403,
            "invalid_invite",
            "This invitation is invalid, expired, or was replaced. Ask the organizer for a new link.",
          );
        const members = await tx.execute({
          sql: "SELECT COUNT(*) AS count FROM room_sessions WHERE room_id=? AND expires>?",
          args: [id, Date.now()],
        });
        if (Number(members.rows[0].count) >= 30)
          throw new RoomError(
            409,
            "room_full",
            "This prototype supports 30 room participants.",
          );
        const revision = Number(check.rows[0].revision) + 1;
        await tx.execute({
          sql: "INSERT INTO room_sessions VALUES (?,?,?,?,?,?)",
          args: [
            randomUUID(),
            id,
            digest(token),
            name,
            "contributor",
            expiry(),
          ],
        });
        await tx.execute({
          sql: "UPDATE rooms SET revision=? WHERE id=?",
          args: [revision, id],
        });
        await event(tx, id, revision, name, "Joined the room");
        return { room: await view(tx, id, token), token };
      });
    },
    async read(id: string, token?: string, knownRevision?: number) {
      return transaction("read", async (tx) => {
        const row = await authorized(tx, id, token);
        return Number(row.revision) === knownRevision
          ? null
          : view(tx, id, token!);
      });
    },
    async mutate(id: string, token: string | undefined, input: unknown) {
      const request = mutationSchema.parse(input);
      return transaction("write", async (tx) => {
        const row = await authorized(tx, id, token),
          memberId = String(row.member_id),
          fingerprint = digest(JSON.stringify(request.action));
        const duplicate = await tx.execute({
          sql: "SELECT fingerprint FROM room_requests WHERE room_id=? AND member_id=? AND request_id=?",
          args: [id, memberId, request.requestId],
        });
        if (duplicate.rows.length) {
          if (duplicate.rows[0].fingerprint !== fingerprint)
            throw new RoomError(
              409,
              "request_reused",
              "This request identifier was already used for a different change.",
            );
          return { room: await view(tx, id, token!), replayed: true };
        }
        if (Number(row.revision) !== request.baseRevision)
          throw new RoomError(
            409,
            "stale_revision",
            "The room changed while you were editing. Your draft was not applied. Close this draft, reopen it from the latest room, and review before saving.",
          );
        const action = request.action,
          memberName = String(row.name),
          memberVolunteerId = `member-${memberId}`;
        let project = projectSchema.parse(JSON.parse(String(row.project))),
          summary = "",
          invite: string | undefined;
        if (action.kind === "replace") {
          if (row.role !== "owner")
            throw new RoomError(
              403,
              "owner_required",
              "Only the room organizer can replace requirements or apply plan-wide interventions.",
            );
          if (action.project.id !== project.id)
            throw new RoomError(
              400,
              "project_identity",
              "A room update must preserve its project identity.",
            );
          project = action.project;
          summary = "Updated the approved project requirements";
        }
        if (action.kind === "volunteer") {
          const volunteer = {
            ...action.profile,
            id: memberVolunteerId,
            name: memberName,
          };
          project.volunteers = [
            ...project.volunteers.filter((v) => v.id !== memberVolunteerId),
            volunteer,
          ];
          summary =
            "Contributed their skills, qualifications, and availability";
        }
        if (action.kind === "withdraw") {
          project.volunteers = project.volunteers.filter(
            (v) => v.id !== memberVolunteerId,
          );
          summary = "Withdrew their own volunteer contribution";
        }
        if (action.kind === "stock") {
          const resource = project.resources.find(
            (r) => r.id === action.resourceId,
          );
          if (!resource)
            throw new RoomError(
              400,
              "unknown_resource",
              "The organizer must add this supply type before you contribute it.",
            );
          resource.quantity += action.quantity;
          summary = `Contributed ${action.quantity} ${resource.name}`;
        }
        if (action.kind === "rotate-invite") {
          if (row.role !== "owner")
            throw new RoomError(
              403,
              "owner_required",
              "Only the organizer can replace the invitation.",
            );
          invite = secret();
          summary = "Replaced the invitation; older links can no longer join";
        }
        project = projectSchema.parse(project);
        const revision = request.baseRevision + 1;
        const update = await tx.execute({
          sql: invite
            ? "UPDATE rooms SET project=?,revision=?,invite_hash=?,invite_expires=? WHERE id=? AND revision=?"
            : "UPDATE rooms SET project=?,revision=? WHERE id=? AND revision=?",
          args: invite
            ? [
                JSON.stringify(project),
                revision,
                digest(invite),
                Date.now() + 7 * 86400000,
                id,
                request.baseRevision,
              ]
            : [JSON.stringify(project), revision, id, request.baseRevision],
        });
        if (update.rowsAffected !== 1)
          throw new RoomError(
            409,
            "stale_revision",
            "A newer revision won. Your change was not applied. Close this draft, reopen it from the latest project, and review before saving.",
          );
        await tx.execute({
          sql: "INSERT INTO room_requests VALUES (?,?,?,?)",
          args: [id, memberId, request.requestId, fingerprint],
        });
        await event(tx, id, revision, memberName, summary);
        return {
          room: await view(tx, id, token!),
          ...(invite ? { invite } : {}),
          replayed: false,
        };
      });
    },
  };
}
