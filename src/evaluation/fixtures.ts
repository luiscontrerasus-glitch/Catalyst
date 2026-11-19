import type { Project } from "@/engine/model";
import { freshRobotics } from "@/data/robotics";
import { cleanup, donation } from "@/data/scenarios";
import {
  analyzeInterventions,
  applyIntervention,
} from "@/engine/interventions";
export type EvaluationFixture = {
  id: string;
  category: string;
  project: Project;
  expectedFeasible: boolean;
  repairable?: boolean;
};
export function smallProject(): Project {
  return {
    id: "evaluation-small",
    name: "Fictional evaluation project",
    brief: "Synthetic fixture, not real community activity.",
    date: "2026-11-21",
    timezone: "America/New_York",
    audience: 1,
    budgetCents: 1000,
    tasks: [
      {
        id: "a",
        name: "Task A",
        start: 0,
        end: 60,
        dependencies: [],
        roles: [
          {
            id: "support",
            name: "Support volunteer",
            skills: ["support"],
            qualifications: [],
            count: 1,
          },
        ],
        resources: [],
        costCents: 0,
      },
    ],
    volunteers: [
      {
        id: "a-specialist",
        name: "Fictional volunteer A",
        skills: ["support"],
        qualifications: [],
        availability: [{ start: 0, end: 240 }],
        maxMinutes: 240,
      },
    ],
    resources: [],
  };
}
export function evaluationFixtures(): EvaluationFixture[] {
  const fixtures: EvaluationFixture[] = [];
  const add = (
    id: string,
    category: string,
    project: Project,
    expectedFeasible: boolean,
    repairable?: boolean,
  ) => fixtures.push({ id, category, project, expectedFeasible, repairable });
  const robotics = freshRobotics(),
    fixed = applyIntervention(
      robotics,
      analyzeInterventions(robotics).find((i) => i.resolves)!,
    );
  add("robotics-shortage", "qualification + overlap", robotics, false, true);
  add("robotics-repaired", "complete certificate", fixed, true);
  const withdrawn = structuredClone(fixed);
  withdrawn.volunteers = withdrawn.volunteers.filter((v) => v.id !== "jordan");
  add("robotics-withdrawal", "volunteer withdrawal", withdrawn, false, true);
  add(
    "cleanup-shortages",
    "schedule + inventory",
    structuredClone(cleanup),
    false,
    true,
  );
  add(
    "donation-feasible",
    "dependencies + multiple roles",
    structuredClone(donation),
    true,
  );
  const drive = structuredClone(donation);
  drive.volunteers = drive.volunteers.filter((v) => v.id !== "taylor");
  add("donation-withdrawal", "qualification shortage", drive, false, true);
  const overlap = smallProject();
  overlap.tasks.push({
    ...structuredClone(overlap.tasks[0]),
    id: "b",
    start: 30,
    end: 90,
  });
  add("overlapping-tasks", "no double booking", overlap, false, true);
  const qualified = smallProject();
  qualified.tasks[0].roles[0].qualifications = ["certificate"];
  add(
    "missing-qualification",
    "all qualifications required",
    qualified,
    false,
    true,
  );
  const budget = smallProject();
  budget.tasks[0].costCents = 1001;
  add(
    "budget-shortage",
    "integer-cent funding constraint",
    budget,
    false,
    true,
  );
  const dependency = smallProject();
  dependency.tasks.push({
    ...structuredClone(dependency.tasks[0]),
    id: "b",
    start: 30,
    end: 90,
    dependencies: ["a"],
  });
  add(
    "dependency-conflict",
    "finish-to-start timing",
    dependency,
    false,
    false,
  );
  const competing = smallProject();
  competing.tasks[0].roles.push({
    id: "specialist",
    name: "Specialist",
    skills: ["special"],
    qualifications: [],
    count: 1,
  });
  competing.volunteers[0].skills.push("special");
  competing.volunteers.push({
    ...structuredClone(competing.volunteers[0]),
    id: "z-generalist",
    name: "Fictional volunteer B",
    skills: ["support"],
  });
  add(
    "greedy-specialist-trap",
    "competing feasible assignments",
    competing,
    true,
  );
  const alternatives = smallProject();
  alternatives.volunteers.push({
    ...structuredClone(alternatives.volunteers[0]),
    id: "b-alternative",
    name: "Fictional alternative",
  });
  add("multiple-alternatives", "multiple valid witnesses", alternatives, true);
  const workload = smallProject();
  workload.tasks.push({
    ...structuredClone(workload.tasks[0]),
    id: "b",
    start: 60,
    end: 120,
  });
  workload.volunteers[0].maxMinutes = 90;
  add("workload-cap", "aggregate capacity", workload, false, true);
  const supply = smallProject();
  supply.resources = [
    {
      id: "tools",
      name: "Tools",
      quantity: 0,
      kind: "reusable",
      unitCostCents: 600,
    },
  ];
  supply.tasks[0].resources = [{ resourceId: "tools", quantity: 2 }];
  add(
    "repair-creates-budget-deficit",
    "procurement repair requires funding",
    supply,
    false,
    true,
  );
  const cycle = smallProject();
  cycle.tasks.push({
    ...structuredClone(cycle.tasks[0]),
    id: "b",
    start: 60,
    end: 120,
    dependencies: ["a"],
  });
  cycle.tasks[0].dependencies = ["b"];
  add("impossible-cycle", "cyclic requirements", cycle, false, false);
  const windows = smallProject();
  windows.volunteers[0].availability = [
    { start: 0, end: 30 },
    { start: 30, end: 60 },
  ];
  add(
    "fragmented-availability",
    "whole-window requirement",
    windows,
    false,
    true,
  );
  const reuse = smallProject();
  reuse.resources = [
    { id: "tool", name: "Tool", quantity: 1, kind: "reusable" },
  ];
  reuse.tasks[0].resources = [{ resourceId: "tool", quantity: 1 }];
  reuse.tasks.push({
    ...structuredClone(reuse.tasks[0]),
    id: "b",
    start: 60,
    end: 120,
  });
  add("reusable-boundary", "half-open inventory intervals", reuse, true);
  const consume = structuredClone(reuse);
  consume.resources[0].kind = "consumable";
  add("consumable-total", "total inventory consumption", consume, false, true);
  const identical = smallProject();
  identical.volunteers = [];
  identical.tasks[0].roles[0].count = 2;
  add(
    "two-identical-vacancies",
    "candidate multiplicity limit",
    identical,
    false,
    true,
  );
  return fixtures;
}
export const aiEvaluationSet = [
  {
    id: "robotics-detailed",
    goal: "Fictional evaluation: plan a free robotics workshop for 60 students on November 21, 2026 with a $400 budget. Use two parallel build labs from 10:30 to 12:00, one qualified robotics instructor and one assistant per lab. No volunteer roster or inventory has been confirmed.",
    expectsQuestions: true,
  },
  {
    id: "cleanup-partial",
    goal: "Fictional evaluation: our neighbors want to clean up the park next weekend. We may have a few volunteers, but their skills, availability, supplies, and budget are not known yet.",
    expectsQuestions: true,
  },
  {
    id: "donation-ambiguous",
    goal: "Fictional evaluation: help our group do something useful with donations. We have not decided the scope, location, date, budget, or participants.",
    expectsQuestions: true,
  },
];
