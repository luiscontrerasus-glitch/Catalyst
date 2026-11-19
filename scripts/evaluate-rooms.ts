import { mkdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { freshRobotics } from "../src/data/robotics";
import { solve } from "../src/engine/solver";
import { verifyAssignment } from "../src/engine/verify";
import type { RoomView } from "../src/rooms/model";
const origin = process.env.ROOM_EVALUATION_ORIGIN || "http://127.0.0.1:3100";
if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(origin).hostname))
  throw new Error(
    "This fictional-data evaluation only targets a local server.",
  );
const checks: { name: string; passed: boolean }[] = [];
function check(name: string, condition: boolean) {
  checks.push({ name, passed: condition });
  if (!condition) throw new Error("A room evaluation check failed.");
}
async function call(
  path: string,
  method = "GET",
  body?: unknown,
  cookie?: string,
  headers?: Record<string, string>,
) {
  return fetch(`${origin}${path}`, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      origin,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
async function main() {
  let status = "passed";
  try {
    check("Database health", (await call("/api/health")).ok);
    const created = await call("/api/rooms", "POST", {
      name: "Fictional evaluation organizer",
      project: freshRobotics(),
    });
    check("Create a persisted room", created.status === 201);
    const ownerCookie = created.headers.get("set-cookie")!.split(";")[0];
    const { room, invite }: { room: RoomView; invite: string } =
      await created.json();
    const path = `/api/rooms/${room.id}`;
    check(
      "Room-scoped HttpOnly cookie",
      created.headers.get("set-cookie")!.includes("HttpOnly; SameSite=Strict"),
    );
    check(
      "Private data denied without a session",
      (await call(path)).status === 401,
    );
    check(
      "Cross-origin write denied",
      (
        await call("/api/rooms", "POST", {}, undefined, {
          origin: "https://attacker.example",
        })
      ).status === 403,
    );
    const joined = await call(`${path}/join`, "POST", {
      name: "Fictional evaluation Avery",
      invite,
    });
    check("Independent contributor joins", joined.status === 200);
    const guestCookie = joined.headers.get("set-cookie")!.split(";")[0];
    let guest: RoomView = (await joined.json()).room;
    check(
      "Separate owner and contributor sessions",
      guestCookie !== ownerCookie && guest.self.role === "contributor",
    );
    const add = await call(
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
    );
    check("Contributor saves availability and skills", add.ok);
    const ownerRead = await call(path, "GET", undefined, ownerCookie);
    const owner: RoomView = (await ownerRead.json()).room;
    guest = (await (await call(path, "GET", undefined, guestCookie)).json())
      .room;
    check(
      "Both independent HTTP sessions receive identical project and revision",
      JSON.stringify(owner.project) === JSON.stringify(guest.project) &&
        owner.revision === guest.revision,
    );
    const solved = solve(owner.project);
    check(
      "Contribution changes robotics from 7/8 to verified 8/8",
      solved.status === "feasible" &&
        solved.filledSlots === 8 &&
        verifyAssignment(owner.project, solved.assignments).valid,
    );
    check(
      "Unchanged authorized poll returns 304",
      (
        await call(path, "GET", undefined, ownerCookie, {
          "If-None-Match": ownerRead.headers.get("etag")!,
        })
      ).status === 304,
    );
    const stock = {
      baseRevision: guest.revision,
      requestId: randomUUID(),
      action: { kind: "stock", resourceId: "kits", quantity: 1 },
    };
    check(
      "Supply contribution commits",
      (await call(path, "PATCH", stock, guestCookie)).ok,
    );
    check(
      "Retry confirms original write without duplication",
      (await (await call(path, "PATCH", stock, guestCookie)).json())
        .replayed === true,
    );
    check(
      "Stale organizer replacement rejected",
      (
        await call(
          path,
          "PATCH",
          {
            baseRevision: owner.revision,
            requestId: randomUUID(),
            action: { kind: "replace", project: owner.project },
          },
          ownerCookie,
        )
      ).status === 409,
    );
    guest = (await (await call(path, "GET", undefined, guestCookie)).json())
      .room;
    check(
      "Contributor cannot replace whole plan",
      (
        await call(
          path,
          "PATCH",
          {
            baseRevision: guest.revision,
            requestId: randomUUID(),
            action: { kind: "replace", project: guest.project },
          },
          guestCookie,
        )
      ).status === 403,
    );
    check(
      "Activity and inventory survive fresh reads",
      guest.activity.length === 4 && guest.project.resources[0].quantity === 21,
    );
    const rotated = await call(
      path,
      "PATCH",
      {
        baseRevision: guest.revision,
        requestId: randomUUID(),
        action: { kind: "rotate-invite" },
      },
      ownerCookie,
    );
    check("Organizer can replace invitation", rotated.ok);
    check(
      "Replaced invitation cannot join",
      (
        await call(`${path}/join`, "POST", {
          name: "Fictional late guest",
          invite,
        })
      ).status === 403,
    );
    check(
      "Existing sessions survive invitation replacement",
      (await call(path, "GET", undefined, guestCookie)).ok,
    );
  } catch {
    status = "failed";
    if (!checks.some((c) => !c.passed))
      checks.push({
        name: "Evaluation interrupted; no raw server error or secret recorded",
        passed: false,
      });
  }
  const report = {
    generatedAt: new Date().toISOString(),
    status,
    kind: "real local HTTP API with independent cookie sessions; not a browser UI test",
    serverMode: process.env.ROOM_EVALUATION_MODE || "unspecified",
    checks,
    passed: checks.filter((c) => c.passed).length,
    total: checks.length,
  };
  mkdirSync("docs/evaluations", { recursive: true });
  writeFileSync(
    "docs/evaluations/rooms-latest.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({ status, passed: report.passed, total: report.total }),
  );
  if (status !== "passed") process.exitCode = 1;
}
void main();
