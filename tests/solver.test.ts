import { describe, expect, it } from "vitest";
import { freshRobotics } from "../src/data/robotics";
import {
  analyzeInterventions,
  applyIntervention,
} from "../src/engine/interventions";
import { resourceDemand, solve } from "../src/engine/solver";
import { slotsFor, type Assignment, type Project } from "../src/engine/model";
import { verifyAssignment } from "../src/engine/verify";

function repaired() {
  const p = freshRobotics(),
    fix = analyzeInterventions(p).find((i) => i.resolves)!;
  return applyIntervention(p, fix);
}
function tiny(): Project {
  return {
    id: "tiny",
    name: "Tiny test",
    brief: "",
    date: "2026-11-21",
    timezone: "America/New_York",
    audience: 1,
    budgetCents: 1000,
    tasks: [
      {
        id: "a",
        name: "A",
        start: 0,
        end: 60,
        dependencies: [],
        roles: [
          { id: "r", name: "R", skills: ["s"], qualifications: [], count: 1 },
        ],
        resources: [],
        costCents: 0,
      },
    ],
    resources: [],
    volunteers: [
      {
        id: "v",
        name: "V",
        skills: ["s"],
        qualifications: [],
        availability: [{ start: 0, end: 180 }],
        maxMinutes: 180,
      },
    ],
  };
}

describe("robotics critical path", () => {
  it("starts infeasible with exactly one instructor role unfilled", () => {
    const r = solve(freshRobotics());
    expect(r.status).toBe("infeasible");
    expect(r.filledSlots).toBe(7);
    expect(r.totalSlots).toBe(8);
    expect(r.exhaustive).toBe(true);
    expect(r.issues).toHaveLength(1);
    expect(r.issues[0].message).toContain("instructor");
    expect(verifyAssignment(freshRobotics(), r.assignments).valid).toBe(false);
  });
  it("adding one qualified instructor produces a verifiable feasible assignment", () => {
    const p = repaired(),
      r = solve(p);
    expect(r.status).toBe("feasible");
    expect(r.filledSlots).toBe(8);
    expect(verifyAssignment(p, r.assignments)).toEqual({
      valid: true,
      errors: [],
    });
  });
  it("withdrawal identifies a new bottleneck and verifies its repair", () => {
    const p = repaired();
    p.volunteers = p.volunteers.filter((v) => v.id !== "jordan");
    const r = solve(p);
    expect(r.status).toBe("infeasible");
    expect(r.issues[0].message).toContain("assistant");
    const fixes = analyzeInterventions(p, r),
      fix = fixes.find((f) => f.resolves)!;
    expect(fix.volunteer?.skills).toEqual(["assembly"]);
    expect(
      verifyAssignment(applyIntervention(p, fix), fix.result.assignments).valid,
    ).toBe(true);
  });
  it("withdrawal of every volunteer never yields assignments or feasible results", () => {
    const p = freshRobotics();
    p.volunteers = [];
    const r = solve(p);
    expect(r.status).toBe("infeasible");
    expect(r.filledSlots).toBe(0);
    expect(r.issues).toHaveLength(8);
  });
});

describe("mandatory staffing constraints", () => {
  it("requires every skill", () => {
    const p = tiny();
    p.tasks[0].roles[0].skills.push("missing");
    expect(solve(p).status).toBe("infeasible");
  });
  it("requires qualifications even when skills match", () => {
    const p = tiny();
    p.tasks[0].roles[0].qualifications = ["certificate"];
    expect(solve(p).issues[0].message).toContain("qualifications");
  });
  it("requires one availability window to cover the full task", () => {
    const p = tiny();
    p.volunteers[0].availability = [{ start: 1, end: 60 }];
    expect(solve(p).issues[0].message).toContain("unavailable");
  });
  it("does not double book a volunteer in simultaneous roles", () => {
    const p = tiny();
    p.tasks[0].roles[0].count = 2;
    const r = solve(p);
    expect(r.status).toBe("infeasible");
    expect(r.filledSlots).toBe(1);
  });
  it("does not double book a volunteer across overlapping tasks", () => {
    const p = tiny();
    p.tasks.push({
      ...structuredClone(p.tasks[0]),
      id: "b",
      start: 30,
      end: 90,
    });
    expect(solve(p).filledSlots).toBe(1);
  });
  it("permits adjacent tasks but enforces the total workload", () => {
    const p = tiny();
    p.tasks.push({
      ...structuredClone(p.tasks[0]),
      id: "b",
      start: 60,
      end: 120,
    });
    expect(solve(p).status).toBe("feasible");
    p.volunteers[0].maxMinutes = 119;
    expect(solve(p).status).toBe("infeasible");
    expect(solve(p).filledSlots).toBe(1);
  });
  it("rejects a workload shorter than one role", () => {
    const p = tiny();
    p.volunteers[0].maxMinutes = 59;
    expect(solve(p).issues[0].message).toContain("capacity");
  });
  it("backtracks past a tempting assignment to retain the specialist", () => {
    const p = tiny();
    p.tasks[0].roles.push({
      id: "special",
      name: "Special",
      skills: ["special"],
      qualifications: [],
      count: 1,
    });
    p.volunteers[0].skills.push("special");
    p.volunteers.push({
      ...structuredClone(p.volunteers[0]),
      id: "w",
      skills: ["s"],
    });
    expect(solve(p).status).toBe("feasible");
    expect(verifyAssignment(p, solve(p).assignments).valid).toBe(true);
  });
});

describe("resources, costs, and dependencies", () => {
  it("accounts for peak concurrent reusable inventory", () => {
    const p = repaired();
    expect(resourceDemand(p, "kits")).toBe(20);
    p.resources[0].quantity = 19;
    const r = solve(p);
    expect(r.status).toBe("infeasible");
    expect(r.issues[0].shortfall).toBe(1);
  });
  it("allows reuse after a task finishes", () => {
    const p = tiny();
    p.resources = [{ id: "tool", name: "Tool", quantity: 1, kind: "reusable" }];
    p.tasks[0].resources = [{ resourceId: "tool", quantity: 1 }];
    p.tasks.push({
      ...structuredClone(p.tasks[0]),
      id: "b",
      start: 60,
      end: 120,
    });
    expect(resourceDemand(p, "tool")).toBe(1);
    expect(solve(p).status).toBe("feasible");
  });
  it("sums consumables across non-overlapping tasks", () => {
    const p = tiny();
    p.resources = [
      { id: "paper", name: "Paper", quantity: 1, kind: "consumable" },
    ];
    p.tasks[0].resources = [{ resourceId: "paper", quantity: 1 }];
    p.tasks.push({
      ...structuredClone(p.tasks[0]),
      id: "b",
      start: 60,
      end: 120,
    });
    expect(resourceDemand(p, "paper")).toBe(2);
    expect(solve(p).status).toBe("infeasible");
  });
  it("enforces budget in integer cents including a one-cent deficit", () => {
    const p = repaired();
    p.budgetCents = 35999;
    expect(solve(p).status).toBe("infeasible");
    expect(solve(p).issues[0].shortfall).toBe(1);
    p.budgetCents = 36000;
    expect(solve(p).status).toBe("feasible");
  });
  it("verifies an inventory-only counterfactual", () => {
    const p = repaired();
    p.resources[0].quantity = 18;
    const fix = analyzeInterventions(p).find((i) => i.kind === "resource")!;
    expect(fix.quantity).toBe(20);
    expect(fix.resolves).toBe(true);
  });
  it("verifies a budget-only counterfactual", () => {
    const p = repaired();
    p.budgetCents = 30000;
    const fix = analyzeInterventions(p).find((i) => i.kind === "budget")!;
    expect(fix.budgetCents).toBe(36000);
    expect(fix.resolves).toBe(true);
  });
  it("does not claim a single change fixes multiple independent deficits", () => {
    const p = freshRobotics();
    p.resources[0].quantity = 0;
    expect(analyzeInterventions(p).every((i) => !i.resolves)).toBe(true);
  });
  it("rejects a task starting before its predecessor finishes", () => {
    const p = repaired();
    p.tasks[1].start = 590;
    expect(solve(p).issues.some((i) => i.kind === "dependency")).toBe(true);
    expect(verifyAssignment(p, solve(p).assignments).valid).toBe(false);
  });
  it("rejects dependency cycles", () => {
    const p = repaired();
    p.tasks[0].dependencies = ["pack"];
    expect(solve(p).issues.some((i) => i.message.includes("cycle"))).toBe(true);
  });
});

describe("validation, reproducibility, and proof limits", () => {
  it.each([
    "negative inventory",
    "unknown dependency",
    "duplicate volunteer",
    "unknown resource",
    "zero duration",
    "ambiguous ID",
    "duplicate resource use",
  ])("rejects invalid models: %s", (name) => {
    const p = freshRobotics();
    if (name === "negative inventory") p.resources[0].quantity = -1;
    if (name === "unknown dependency") p.tasks[0].dependencies = ["missing"];
    if (name === "duplicate volunteer") p.volunteers.push(p.volunteers[0]);
    if (name === "unknown resource")
      p.tasks[0].resources = [{ resourceId: "missing", quantity: 1 }];
    if (name === "zero duration") p.tasks[0].end = p.tasks[0].start;
    if (name === "ambiguous ID") p.tasks[0].id = "a/b";
    if (name === "duplicate resource use")
      p.tasks[2].resources.push(p.tasks[2].resources[0]);
    expect(solve(p).status).toBe("invalid");
  });
  it("returns unknown if staffing search is interrupted", () => {
    const r = solve(freshRobotics(), { maxNodes: 1 });
    expect(r.status).toBe("unknown");
    expect(r.exhaustive).toBe(false);
  });
  it("still proves a static budget violation with interrupted staffing search", () => {
    const p = repaired();
    p.budgetCents = 0;
    expect(solve(p, { maxNodes: 0 }).status).toBe("infeasible");
  });
  it("is reproducible, order-invariant for assignment identities, and never mutates input", () => {
    const p = repaired(),
      snapshot = JSON.stringify(p),
      a = solve(p),
      b = solve(p);
    expect(a).toEqual(b);
    expect(JSON.stringify(p)).toBe(snapshot);
    const reordered = structuredClone(p);
    reordered.volunteers.reverse();
    reordered.tasks.reverse();
    expect(solve(reordered).assignments).toEqual(a.assignments);
  });
  it("does not collide with existing simulated volunteer IDs", () => {
    const p = repaired();
    p.volunteers = p.volunteers.filter((v) => v.id !== "maya");
    const next = analyzeInterventions(p)[0];
    expect(p.volunteers.some((v) => v.id === next.volunteer?.id)).toBe(false);
    expect(solve(applyIntervention(p, next)).status).toBe("feasible");
  });
  it("rejects tampered assignment certificates", () => {
    const p = repaired(),
      a = solve(p).assignments;
    expect(verifyAssignment(p, [...a, a[0]]).valid).toBe(false);
    expect(
      verifyAssignment(
        p,
        a.map((x, i) => (i === 0 ? { ...x, volunteerId: "missing" } : x)),
      ).valid,
    ).toBe(false);
    expect(
      verifyAssignment(
        p,
        a.map((x) => ({ ...x, volunteerId: "maya" })),
      ).valid,
    ).toBe(false);
  });
  it("handles 32 mandatory slots with a bounded proof and rejects larger models", () => {
    const p = tiny();
    p.tasks[0].roles[0].count = 8;
    p.tasks = Array.from({ length: 4 }, (_, i) => ({
      ...structuredClone(p.tasks[0]),
      id: `task-${i}`,
    }));
    expect(solve(p).status).toBe("infeasible");
    p.tasks.push({ ...p.tasks[0], id: "too-many" });
    expect(solve(p).status).toBe("invalid");
  });
});

// Slow exhaustive oracle uses only the independent full-certificate checker,
// enumerating every volunteer assignment on small generated instances.
function bruteFeasible(p: Project): boolean {
  const slots = slotsFor(p),
    candidate: Assignment[] = [];
  function enumerate(i: number): boolean {
    if (i === slots.length) return verifyAssignment(p, candidate).valid;
    for (const v of p.volunteers) {
      candidate.push({ slotId: slots[i].id, volunteerId: v.id });
      if (enumerate(i + 1)) return true;
      candidate.pop();
    }
    return false;
  }
  return enumerate(0);
}
it("matches an independent exhaustive oracle on 100 seeded small CSPs", () => {
  let seed = 12345;
  const rand = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let sample = 0; sample < 100; sample++) {
    const p = tiny();
    p.tasks = Array.from({ length: 1 + rand(4) }, (_, i) => {
      const start = rand(3) * 30;
      return {
        ...structuredClone(p.tasks[0]),
        id: `t${i}`,
        start,
        end: start + 30 + rand(2) * 30,
        roles: [
          {
            id: "r",
            name: "R",
            skills: [rand(2) ? "s" : "x"],
            qualifications: [],
            count: 1,
          },
        ],
      };
    });
    p.volunteers = Array.from({ length: 1 + rand(3) }, (_, i) => ({
      id: `v${i}`,
      name: `V${i}`,
      skills: rand(2) ? ["s", "x"] : ["s"],
      qualifications: [],
      availability: [{ start: rand(2) * 30, end: 150 }],
      maxMinutes: 30 + rand(4) * 30,
    }));
    const r = solve(p);
    expect(r.status === "feasible", `sample ${sample}`).toBe(bruteFeasible(p));
    if (r.status === "feasible")
      expect(verifyAssignment(p, r.assignments).valid).toBe(true);
  }
});
