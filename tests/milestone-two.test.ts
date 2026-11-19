import { describe, expect, it } from "vitest";
import { freshRobotics } from "@/data/robotics";
import { cleanup, donation, freshScenario, scenarios } from "@/data/scenarios";
import { projectSchema, type Project } from "@/engine/model";
import { solve } from "@/engine/solver";
import { verifyAssignment } from "@/engine/verify";
import {
  analyzeInterventions,
  applyIntervention,
  type Intervention,
} from "@/engine/interventions";
import {
  approveProjectDraft,
  blankProject,
  nextId,
  removeResource,
  removeTask,
  tokens,
} from "@/lib/projects";
import {
  freshWorkspace,
  reduceWorkspace,
  restoreWorkspace,
  STORAGE_KEY,
  workspaceSchema,
  writeWorkspace,
} from "@/lib/persistence";
import { layoutTasks } from "@/components/project-graph";

function custom(): Project {
  return {
    ...blankProject("custom-test"),
    name: "Neighborhood reading circle",
    date: "2026-11-21",
    timezone: "America/New_York",
    budgetCents: 5000,
    tasks: [
      {
        id: "read",
        name: "Read together",
        start: 600,
        end: 660,
        dependencies: [],
        roles: [
          {
            id: "reader",
            name: "Reading facilitator",
            count: 1,
            skills: ["reading"],
            qualifications: [],
          },
        ],
        resources: [],
        costCents: 1000,
      },
    ],
  };
}
function memory() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => {
      items.set(k, v);
    },
  };
}
const advanced = (p: Project) =>
  analyzeInterventions(p, solve(p), { combinations: true });

describe("custom approved projects", () => {
  it("requires human approval and structural validation", () => {
    expect(() => approveProjectDraft(custom(), false)).toThrow("Review");
    expect(() => approveProjectDraft(blankProject("empty"), true)).toThrow();
    expect(approveProjectDraft(custom(), true).name).toContain("reading");
  });
  it("runs custom requirements and edits through the real solver and verifier", () => {
    const p = approveProjectDraft(custom(), true);
    expect(solve(p).status).toBe("infeasible");
    p.volunteers.push({
      id: "jo",
      name: "Jo",
      skills: ["reading"],
      qualifications: [],
      availability: [{ start: 600, end: 660 }],
      maxMinutes: 60,
    });
    expect(solve(p).status).toBe("feasible");
    expect(verifyAssignment(p, solve(p).assignments).valid).toBe(true);
    p.volunteers[0].maxMinutes = 59;
    expect(solve(p).status).toBe("infeasible");
  });
  it.each([
    "empty title",
    "invalid date",
    "invalid zone",
    "negative funding",
    "missing dependency",
    "negative inventory",
    "empty roles",
    "unknown supply",
  ])("rejects %s with schema validation", (name) => {
    const p = custom();
    if (name === "empty title") p.name = " ";
    if (name === "invalid date") p.date = "2026-02-31";
    if (name === "invalid zone") p.timezone = "not-a-zone";
    if (name === "negative funding") p.budgetCents = -1;
    if (name === "missing dependency") p.tasks[0].dependencies = ["absent"];
    if (name === "negative inventory")
      p.resources = [{ id: "a", name: "A", quantity: -1, kind: "reusable" }];
    if (name === "empty roles") p.tasks[0].roles = [];
    if (name === "unknown supply")
      p.tasks[0].resources = [{ resourceId: "absent", quantity: 1 }];
    expect(projectSchema.safeParse(p).success).toBe(false);
  });
  it("removing a task unlinks its dependencies without mutating the original", () => {
    const p = freshRobotics(),
      q = removeTask(p, "welcome");
    expect(q.tasks.some((t) => t.id === "welcome")).toBe(false);
    expect(q.tasks.find((t) => t.id === "lab-a")!.dependencies).toEqual([]);
    expect(p.tasks).toHaveLength(6);
    expect(projectSchema.safeParse(q).success).toBe(true);
  });
  it("removing inventory also removes its task requirements", () => {
    const p = freshRobotics(),
      q = removeResource(p, "kits");
    expect(
      q.tasks.every((t) => !t.resources.some((r) => r.resourceId === "kits")),
    ).toBe(true);
    expect(p.resources).toHaveLength(3);
  });
  it("normalizes skill input consistently and allocates collision-free IDs", () => {
    expect(tokens("First Aid, first aid, assembly")).toEqual([
      "first_aid",
      "assembly",
    ]);
    expect(nextId("task", [{ id: "task-1" }, { id: "task-2" }])).toBe("task-3");
  });
  it("lays out arbitrary IDs and dependencies without overlapping nodes", () => {
    const p = custom();
    p.tasks.push({
      ...structuredClone(p.tasks[0]),
      id: "second",
      start: 660,
      end: 720,
      dependencies: ["read"],
    });
    const layout = layoutTasks(p);
    expect(layout.second.x).toBeGreaterThan(layout.read.x);
    expect(
      new Set(Object.values(layout).map((v) => `${v.x}:${v.y}`)).size,
    ).toBe(2);
  });
});

describe("three scenarios, one solver", () => {
  it("keeps robotics instructor repair verified", () => {
    const p = freshScenario("robotics-workshop"),
      fix = advanced(p).find((i) => i.resolves)!;
    expect(fix.volunteer?.skills).toContain("robotics");
    expect(fix.verification?.valid).toBe(true);
  });
  it("cleanup exposes staffing and supply constraints; a combined repair succeeds", () => {
    const p = structuredClone(cleanup),
      r = solve(p),
      changes = advanced(p);
    expect(r.status).toBe("infeasible");
    expect(r.issues.some((i) => i.kind === "resource")).toBe(true);
    expect(r.issues.some((i) => i.kind === "staffing")).toBe(true);
    const fix = changes.find((i) => i.resolves)!;
    expect(fix.metrics!.changes).toBeGreaterThan(1);
    expect(fix.verification?.valid).toBe(true);
    expect(solve(applyIntervention(p, fix)).status).toBe("feasible");
  });
  it("cleanup availability extension alone remains promising, not feasible", () => {
    const change = advanced(cleanup).find((i) => i.kind === "availability")!;
    expect(change.outcome).toBe("promising");
    expect(change.resolves).toBe(false);
    expect(change.result.issues.some((i) => i.kind === "resource")).toBe(true);
  });
  it("donation drive starts feasible; withdrawal reveals a qualified-driver deficit", () => {
    const p = structuredClone(donation);
    expect(verifyAssignment(p, solve(p).assignments).valid).toBe(true);
    p.volunteers = p.volunteers.filter((v) => v.id !== "taylor");
    expect(solve(p).issues[0].message).toContain("driver");
    const fix = advanced(p).find((i) => i.resolves)!;
    expect(fix.verification?.valid).toBe(true);
  });
  it("scenario factories return isolated fictional data", () => {
    expect(scenarios).toHaveLength(3);
    const a = freshScenario(cleanup.id),
      b = freshScenario(cleanup.id);
    a.volunteers.pop();
    expect(b.volunteers).toHaveLength(4);
  });
});

describe("verified counterfactuals and transparent ranking", () => {
  it("does not count interchangeable slots within the same task and role as disrupted commitments", () => {
    const p = custom();
    p.tasks[0].roles[0].count = 2;
    p.volunteers = [
      {
        id: "z-last",
        name: "Jo",
        skills: ["reading"],
        qualifications: [],
        availability: [{ start: 600, end: 660 }],
        maxMinutes: 60,
      },
    ];
    const fix = advanced(p).find((i) => i.resolves)!;
    expect(fix.metrics!.disruptedAssignments).toBe(0);
  });
  it("clones inputs for every intervention", () => {
    const p = structuredClone(cleanup),
      snapshot = JSON.stringify(p);
    const fix = advanced(p).find((i) => i.resolves)!;
    const q = applyIntervention(p, fix);
    q.tasks[0].name = "Changed";
    expect(JSON.stringify(p)).toBe(snapshot);
  });
  it("checks known procurement cost and proposes funding when needed", () => {
    const p = custom();
    p.volunteers = [
      {
        id: "jo",
        name: "Jo",
        skills: ["reading"],
        qualifications: [],
        availability: [{ start: 600, end: 660 }],
        maxMinutes: 60,
      },
    ];
    p.budgetCents = 1000;
    p.resources = [
      {
        id: "chairs",
        name: "Chairs",
        quantity: 0,
        kind: "reusable",
        unitCostCents: 500,
      },
    ];
    p.tasks[0].resources = [{ resourceId: "chairs", quantity: 2 }];
    const results = advanced(p);
    const supply = results.find((i) => i.kind === "resource")!;
    expect(supply.result.costCents).toBe(2000);
    expect(supply.resolves).toBe(false);
    const fix = results.find((i) => i.resolves)!;
    expect(fix.metrics!.addedCostCents).toBe(1000);
    expect(fix.changes?.some((c) => c.kind === "budget")).toBe(true);
  });
  it("labels unpriced supplies rather than pretending purchase cost is known", () => {
    const p = freshRobotics();
    p.resources[0].quantity = 0;
    const i = advanced(p).find((i) => i.kind === "resource")!;
    expect(i.metrics!.unpriced).toBe(true);
  });
  it("only drops optional leaf tasks and verifies the reduced scope", () => {
    const p = custom();
    p.tasks.push({
      ...structuredClone(p.tasks[0]),
      id: "extra",
      name: "Optional extra",
      start: 660,
      end: 720,
      optional: true,
      roles: [
        {
          id: "special",
          name: "Specialist",
          count: 1,
          skills: ["rare"],
          qualifications: [],
        },
      ],
    });
    p.volunteers = [
      {
        id: "jo",
        name: "Jo",
        skills: ["reading"],
        qualifications: [],
        availability: [{ start: 600, end: 660 }],
        maxMinutes: 60,
      },
    ];
    const scope = advanced(p).find((i) => i.kind === "scope")!;
    expect(scope.resolves).toBe(true);
    expect(applyIntervention(p, scope).tasks).toHaveLength(1);
    p.tasks[0].dependencies = ["extra"];
    expect(advanced(p).some((i) => i.kind === "scope")).toBe(false);
  });
  it("cannot drop a mandatory task even with a crafted scope change", () => {
    const p = custom(),
      i: Intervention = {
        id: "crafted",
        kind: "scope",
        label: "",
        explanation: "",
        result: solve(p),
        resolves: false,
        changes: [{ kind: "scope", taskId: "read" }],
      };
    expect(applyIntervention(p, i).tasks).toHaveLength(1);
  });
  it("never labels an intervention verified without a valid independent certificate", () => {
    for (const p of scenarios.map((s) => s.project))
      for (const i of advanced(p))
        if (i.resolves)
          expect(
            verifyAssignment(applyIntervention(p, i), i.result.assignments)
              .valid,
          ).toBe(true);
  });
  it("ranks deterministically with published metric weights", () => {
    const a = advanced(cleanup),
      b = advanced(cleanup);
    expect(a).toEqual(b);
    expect(a[0].outcome).toBe("verified");
    const m = a[0].metrics!;
    expect(m.score).toBe(
      m.changes * 100 +
        (m.addedCostCents / 100) * 2 +
        m.addedMinutes / 10 +
        m.disruptedAssignments * 5 +
        (m.unpriced ? 50 : 0),
    );
  });
});

describe("workspace persistence, switching, edits, and reset", () => {
  it("keeps each scenario’s experiments isolated on switching", () => {
    let w = freshWorkspace();
    const p = structuredClone(w.projects[0]);
    p.budgetCents = 1;
    w = reduceWorkspace(w, { type: "update", project: p });
    w = reduceWorkspace(w, { type: "select", id: donation.id });
    expect(solve(w.projects.find((p) => p.id === w.activeId)!).status).toBe(
      "feasible",
    );
    w = reduceWorkspace(w, { type: "select", id: p.id });
    expect(w.projects[0].budgetCents).toBe(1);
  });
  it("adds approved custom projects, persists, and restores the active model", () => {
    const storage = memory();
    let w = reduceWorkspace(freshWorkspace(), {
      type: "approve",
      project: custom(),
    });
    expect(writeWorkspace(storage, w)).toBe(true);
    expect(restoreWorkspace(storage).workspace).toEqual(w);
    const changed = { ...custom(), budgetCents: 0 };
    w = reduceWorkspace(w, { type: "update", project: changed });
    w = reduceWorkspace(w, { type: "reset" });
    expect(w.projects.find((p) => p.id === "custom-test")!.budgetCents).toBe(
      5000,
    );
  });
  it("edits become the new approved reset baseline", () => {
    let w = reduceWorkspace(freshWorkspace(), {
      type: "approve",
      project: custom(),
    });
    const edited = { ...custom(), name: "Edited circle" };
    w = reduceWorkspace(w, { type: "approve", project: edited });
    w = reduceWorkspace(w, {
      type: "update",
      project: { ...edited, budgetCents: 0 },
    });
    w = reduceWorkspace(w, { type: "reset" });
    expect(w.baselines[edited.id].name).toBe("Edited circle");
    expect(w.projects.find((p) => p.id === edited.id)).toEqual(edited);
  });
  it("migrates a valid milestone-one scenario without losing experiments", () => {
    const storage = memory(),
      p = freshRobotics();
    p.budgetCents = 12;
    storage.setItem("catalyst:robotics:v1", JSON.stringify(p));
    const restored = restoreWorkspace(storage);
    expect(restored.workspace.projects).toHaveLength(3);
    expect(restored.workspace.projects[0].budgetCents).toBe(12);
  });
  it("recovers gracefully from corrupt storage and rejects inconsistent IDs", () => {
    const storage = memory();
    storage.setItem(STORAGE_KEY, "{invalid");
    expect(restoreWorkspace(storage).error).toBeTruthy();
    const w = freshWorkspace();
    w.activeId = "absent";
    expect(workspaceSchema.safeParse(w).success).toBe(false);
    expect(() =>
      reduceWorkspace(freshWorkspace(), { type: "select", id: "absent" }),
    ).toThrow();
  });
  it("handles blocked storage honestly", () => {
    const denied = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(restoreWorkspace(denied).error).toBeTruthy();
    expect(writeWorkspace(denied, freshWorkspace())).toBe(false);
  });
  it("cannot add an unapproved custom project through an update", () => {
    expect(() =>
      reduceWorkspace(freshWorkspace(), { type: "update", project: custom() }),
    ).toThrow("Approve");
  });
});
