import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { createRoomStore } from "@/rooms/store";
import { freshRobotics } from "@/data/robotics";
import { solve } from "@/engine/solver";
import { verifyAssignment } from "@/engine/verify";
import type { RoomMutation } from "@/rooms/model";
let db: Client, store: ReturnType<typeof createRoomStore>;
beforeEach(() => {
  db = createClient({ url: ":memory:" });
  store = createRoomStore(db);
});
afterEach(() => db.close());
const mutation = (
  revision: number,
  action: RoomMutation["action"],
): RoomMutation => ({
  baseRevision: revision,
  requestId: randomUUID(),
  action,
});
const profile = {
  skills: ["robotics"],
  qualifications: ["robotics_instruction"],
  availability: [{ start: 630, end: 720 }],
  maxMinutes: 90,
};
describe("real libSQL shared-room service (no mocked persistence)", () => {
  it("creates a private durable model; secrets are absent from room views", async () => {
    const owner = await store.create({
      name: "Fictional organizer",
      project: freshRobotics(),
    });
    expect(owner.room.self.role).toBe("owner");
    expect(owner.room.revision).toBe(1);
    expect(JSON.stringify(owner.room)).not.toContain(owner.token);
    expect(JSON.stringify(owner.room)).not.toContain(owner.invite);
    await expect(store.read(owner.room.id)).rejects.toMatchObject({
      status: 401,
    });
  });
  it("joins independent sessions and recomputes the same project after a contribution", async () => {
    const owner = await store.create({
      name: "Organizer",
      project: freshRobotics(),
    });
    const guest = await store.join(owner.room.id, {
      name: "Fictional Avery",
      invite: owner.invite,
    });
    expect(guest.token).not.toBe(owner.token);
    expect(guest.room.self.role).toBe("contributor");
    expect(solve(guest.room.project).status).toBe("infeasible");
    await store.mutate(
      owner.room.id,
      guest.token,
      mutation(guest.room.revision, { kind: "volunteer", profile }),
    );
    const a = await store.read(owner.room.id, owner.token),
      b = await store.read(owner.room.id, guest.token);
    expect(a!.project).toEqual(b!.project);
    expect(solve(a!.project).status).toBe("feasible");
    expect(
      verifyAssignment(a!.project, solve(a!.project).assignments).valid,
    ).toBe(true);
    expect(a!.activity.some((e) => e.summary.includes("availability"))).toBe(
      true,
    );
  });
  it("restricts plan-wide replacement and invitation rotation to the organizer", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() }),
      g = await store.join(o.room.id, { name: "Guest", invite: o.invite });
    await expect(
      store.mutate(
        o.room.id,
        g.token,
        mutation(g.room.revision, { kind: "replace", project: g.room.project }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      store.mutate(
        o.room.id,
        g.token,
        mutation(g.room.revision, { kind: "rotate-invite" }),
      ),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("rejects stale owner drafts without erasing a newer guest contribution", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() }),
      g = await store.join(o.room.id, { name: "Guest", invite: o.invite });
    const r = await store.mutate(
      o.room.id,
      g.token,
      mutation(g.room.revision, {
        kind: "stock",
        resourceId: "kits",
        quantity: 2,
      }),
    );
    await expect(
      store.mutate(
        o.room.id,
        o.token,
        mutation(g.room.revision, { kind: "replace", project: o.room.project }),
      ),
    ).rejects.toMatchObject({ status: 409, code: "stale_revision" });
    expect(
      (await store.read(o.room.id, o.token))!.project.resources[0].quantity,
    ).toBe(22);
    expect(r.room.revision).toBe(g.room.revision + 1);
  });
  it("makes retries idempotent and rejects reusing a request ID for another action", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() });
    const m = mutation(1, { kind: "stock", resourceId: "kits", quantity: 2 });
    const a = await store.mutate(o.room.id, o.token, m),
      b = await store.mutate(o.room.id, o.token, m);
    expect(b.replayed).toBe(true);
    expect(b.room.revision).toBe(a.room.revision);
    expect(b.room.project.resources[0].quantity).toBe(22);
    await expect(
      store.mutate(o.room.id, o.token, {
        ...m,
        action: { kind: "stock", resourceId: "kits", quantity: 3 },
      }),
    ).rejects.toMatchObject({ status: 409, code: "request_reused" });
  });
  it("allows withdrawal of only the current participant profile", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() }),
      g = await store.join(o.room.id, { name: "Guest", invite: o.invite });
    const add = await store.mutate(
      o.room.id,
      g.token,
      mutation(g.room.revision, { kind: "volunteer", profile }),
    );
    expect(add.room.project.volunteers).toHaveLength(6);
    const withdrawn = await store.mutate(
      o.room.id,
      g.token,
      mutation(add.room.revision, { kind: "withdraw" }),
    );
    expect(withdrawn.room.project.volunteers).toHaveLength(5);
    expect(withdrawn.room.project.volunteers.some((v) => v.id === "maya")).toBe(
      true,
    );
  });
  it("rotates invitations without revoking existing sessions", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() });
    const r = await store.mutate(
      o.room.id,
      o.token,
      mutation(1, { kind: "rotate-invite" }),
    );
    await expect(
      store.join(o.room.id, { name: "Guest", invite: o.invite }),
    ).rejects.toMatchObject({ status: 403 });
    const g = await store.join(o.room.id, { name: "Guest", invite: r.invite! });
    expect(g.room.members).toHaveLength(2);
    expect((await store.read(o.room.id, o.token))!.self.role).toBe("owner");
  });
  it("does not authorize one room with another room’s session", async () => {
    const a = await store.create({ name: "A", project: freshRobotics() }),
      b = await store.create({ name: "B", project: freshRobotics() });
    await expect(store.read(a.room.id, b.token)).rejects.toMatchObject({
      status: 401,
    });
  });
  it("returns no data for an authenticated unchanged revision", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() });
    expect(await store.read(o.room.id, o.token, o.room.revision)).toBeNull();
  });
  it("validates contributions and rejects unknown inventory types", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() });
    await expect(
      store.mutate(
        o.room.id,
        o.token,
        mutation(1, { kind: "stock", resourceId: "missing", quantity: 1 }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      store.mutate(
        o.room.id,
        o.token,
        mutation(1, {
          kind: "volunteer",
          profile: { ...profile, maxMinutes: -1 },
        }),
      ),
    ).rejects.toBeTruthy();
    expect((await store.read(o.room.id, o.token))!.revision).toBe(1);
  });
  it("keeps exactly one concurrent winner for a shared base revision", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() });
    const results = await Promise.allSettled([
      store.mutate(
        o.room.id,
        o.token,
        mutation(1, { kind: "stock", resourceId: "kits", quantity: 1 }),
      ),
      store.mutate(
        o.room.id,
        o.token,
        mutation(1, { kind: "stock", resourceId: "kits", quantity: 2 }),
      ),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const final = await store.read(o.room.id, o.token);
    expect(final!.revision).toBe(2);
    expect([21, 22]).toContain(final!.project.resources[0].quantity);
  });
  it("stores only token digests in the database", async () => {
    const o = await store.create({ name: "Owner", project: freshRobotics() });
    const sessions = await db.execute("SELECT secret_hash FROM room_sessions"),
      rooms = await db.execute("SELECT invite_hash FROM rooms");
    expect(JSON.stringify(sessions.rows)).not.toContain(o.token);
    expect(JSON.stringify(rooms.rows)).not.toContain(o.invite);
  });
});
