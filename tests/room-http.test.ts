import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient, type Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { createRoomStore } from "@/rooms/store";
import { freshRobotics } from "@/data/robotics";
import { solve } from "@/engine/solver";
import { verifyAssignment } from "@/engine/verify";
const shared = vi.hoisted(() => ({
  store: undefined as ReturnType<typeof createRoomStore> | undefined,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/rooms/runtime.server", () => ({ roomStore: () => shared.store! }));
import { POST as create } from "@/app/api/rooms/route";
import { POST as join } from "@/app/api/rooms/[id]/join/route";
import { GET, PATCH } from "@/app/api/rooms/[id]/route";
import { roomBody, sessionCookie, roomFailure } from "@/rooms/http.server";
let db: Client;
beforeEach(() => {
  vi.stubEnv("APP_ORIGIN", "");
  db = createClient({ url: ":memory:" });
  shared.store = createRoomStore(db);
});
afterEach(() => {
  db.close();
  vi.unstubAllEnvs();
});
const origin = "http://127.0.0.1:3100";
function request(
  path: string,
  method: string,
  body?: unknown,
  cookie?: string,
  headers?: Record<string, string>,
) {
  return new Request(`http://localhost:3100${path}`, {
    method,
    headers: {
      host: "127.0.0.1:3100",
      origin,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const context = (id: string) => ({ params: Promise.resolve({ id }) });
function cookieOf(response: Response) {
  return response.headers.get("set-cookie")!.split(";")[0];
}
async function room() {
  const response = await create(
    request("/api/rooms", "POST", {
      name: "Fictional owner",
      project: freshRobotics(),
    }),
  );
  expect(response.status).toBe(201);
  return { response, cookie: cookieOf(response), data: await response.json() };
}
describe("room HTTP boundary with real SQLite persistence", () => {
  it("accepts a same-origin browser when Next's internal URL uses localhost", async () => {
    const r = await room();
    expect(r.response.headers.get("cache-control")).toContain("no-store");
    expect(r.response.headers.get("set-cookie")).toContain(
      "HttpOnly; SameSite=Strict",
    );
    expect(r.response.headers.get("set-cookie")).toContain(
      `Path=/api/rooms/${r.data.room.id}`,
    );
    expect(r.data.token).toBeUndefined();
    expect(JSON.stringify(r.data)).not.toContain(r.cookie.split("=")[1]);
  });
  it("rejects foreign and missing origins before any write", async () => {
    for (const supplied of ["https://attacker.example", "null", ""]) {
      const r = await create(
        request(
          "/api/rooms",
          "POST",
          { name: "Owner", project: freshRobotics() },
          undefined,
          { origin: supplied },
        ),
      );
      expect(r.status).toBe(403);
    }
    await shared.store!.ready();
    expect((await db.execute("SELECT count(*) n FROM rooms")).rows[0].n).toBe(
      0,
    );
  });
  it("uses a pinned production origin and ignores forged forwarded headers", async () => {
    vi.stubEnv("APP_ORIGIN", "https://catalyst.example");
    await expect(
      roomBody(
        request("/api/rooms", "POST", {}, undefined, {
          "x-forwarded-host": "127.0.0.1:3100",
        }),
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      await roomBody(
        request("/api/rooms", "POST", { ok: true }, undefined, {
          origin: "https://catalyst.example",
        }),
      ),
    ).toEqual({ ok: true });
    expect(
      sessionCookie(
        request("/api/rooms", "GET"),
        "a".repeat(24),
        "b".repeat(64),
      ),
    ).toContain("; Secure");
  });
  it("keeps two separate cookie sessions synchronized through join, contribution, polling, and reload reads", async () => {
    const o = await room(),
      id = o.data.room.id,
      path = `/api/rooms/${id}`;
    const entered = await join(
      request(`${path}/join`, "POST", {
        name: "Fictional Avery",
        invite: o.data.invite,
      }),
      context(id),
    );
    expect(entered.status).toBe(200);
    const guestCookie = cookieOf(entered),
      guest = (await entered.json()).room;
    expect(guestCookie).not.toBe(o.cookie);
    expect(guest.self.role).toBe("contributor");
    const update = await PATCH(
      request(
        path,
        "PATCH",
        {
          baseRevision: guest.revision,
          requestId: randomUUID(),
          action: {
            kind: "volunteer",
            profile: {
              skills: ["robotics"],
              qualifications: ["robotics_instruction"],
              availability: [{ start: 630, end: 720 }],
              maxMinutes: 90,
            },
          },
        },
        guestCookie,
      ),
      context(id),
    );
    expect(update.status).toBe(200);
    const a = await GET(request(path, "GET", undefined, o.cookie), context(id));
    const b = await GET(
      request(path, "GET", undefined, guestCookie),
      context(id),
    );
    const av = (await a.json()).room,
      bv = (await b.json()).room;
    expect(av.project).toEqual(bv.project);
    expect(av.revision).toBe(3);
    expect(av.self.role).toBe("owner");
    expect(bv.self.role).toBe("contributor");
    const result = solve(av.project);
    expect(result.status).toBe("feasible");
    expect(verifyAssignment(av.project, result.assignments).valid).toBe(true);
    expect(av.activity).toHaveLength(3);
    const unchanged = await GET(
      request(path, "GET", undefined, o.cookie, {
        "if-none-match": a.headers.get("etag")!,
      }),
      context(id),
    );
    expect(unchanged.status).toBe(304);
    expect(await unchanged.text()).toBe("");
    // An ETag never bypasses authorization.
    expect(
      (
        await GET(
          request(path, "GET", undefined, undefined, {
            "if-none-match": a.headers.get("etag")!,
          }),
          context(id),
        )
      ).status,
    ).toBe(401);
  });
  it("enforces permissions, stale revisions, and idempotent retries over HTTP", async () => {
    const o = await room(),
      id = o.data.room.id,
      path = `/api/rooms/${id}`;
    const entered = await join(
      request(`${path}/join`, "POST", { name: "Guest", invite: o.data.invite }),
      context(id),
    );
    const cookie = cookieOf(entered),
      g = (await entered.json()).room;
    const mutation = {
      baseRevision: g.revision,
      requestId: randomUUID(),
      action: { kind: "stock", resourceId: "kits", quantity: 1 },
    };
    const first = await PATCH(
      request(path, "PATCH", mutation, cookie),
      context(id),
    );
    expect(first.status).toBe(200);
    const retry = await PATCH(
      request(path, "PATCH", mutation, cookie),
      context(id),
    );
    expect((await retry.json()).replayed).toBe(true);
    const stale = await PATCH(
      request(
        path,
        "PATCH",
        {
          baseRevision: g.revision,
          requestId: randomUUID(),
          action: { kind: "replace", project: g.project },
        },
        o.cookie,
      ),
      context(id),
    );
    expect(stale.status).toBe(409);
    expect((await stale.json()).code).toBe("stale_revision");
    const forbidden = await PATCH(
      request(
        path,
        "PATCH",
        {
          baseRevision: g.revision + 1,
          requestId: randomUUID(),
          action: { kind: "replace", project: g.project },
        },
        cookie,
      ),
      context(id),
    );
    expect(forbidden.status).toBe(403);
    const actual = (
      await (
        await GET(request(path, "GET", undefined, o.cookie), context(id))
      ).json()
    ).room;
    expect(actual.project.resources[0].quantity).toBe(21);
  });
  it("rejects malformed JSON, large bodies, and non-JSON input", async () => {
    const invalid = new Request(`${origin}/api/rooms`, {
      method: "POST",
      headers: { origin, "content-type": "application/json" },
      body: "{",
    });
    await expect(roomBody(invalid)).rejects.toMatchObject({ status: 400 });
    await expect(
      roomBody(
        request("/api/rooms", "POST", {}, undefined, {
          "content-length": "256001",
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      roomBody(
        request("/api/rooms", "POST", {}, undefined, {
          "content-type": "text/plain",
        }),
      ),
    ).rejects.toMatchObject({ status: 415 });
  });
  it("hides raw storage errors and rejects malformed room IDs", async () => {
    const secret = "synthetic-secret-do-not-return";
    const response = roomFailure(new Error(secret));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain(secret);
    expect(
      (await GET(request("/api/rooms/invalid", "GET"), context("invalid")))
        .status,
    ).toBe(404);
  });
});
