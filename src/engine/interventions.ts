import {
  available,
  qualified,
  slotsFor,
  type Project,
  type SolveResult,
  type Volunteer,
} from "./model";
import { solve } from "./solver";
import { verifyAssignment } from "./verify";

export type Change =
  | { kind: "add-volunteer"; volunteer: Volunteer }
  | { kind: "availability"; volunteerId: string; start: number; end: number }
  | { kind: "resource"; resourceId: string; quantity: number }
  | { kind: "budget"; budgetCents: number }
  | { kind: "scope"; taskId: string };
export type Intervention = {
  id: string;
  label: string;
  explanation: string;
  kind:
    "volunteer" | "resource" | "budget" | "availability" | "scope" | "bundle";
  volunteer?: Volunteer;
  resourceId?: string;
  quantity?: number;
  budgetCents?: number;
  changes?: Change[];
  result: SolveResult;
  resolves: boolean;
  verification?: ReturnType<typeof verifyAssignment>;
  outcome?: "verified" | "promising" | "blocked" | "unknown";
  metrics?: {
    changes: number;
    addedCostCents: number;
    unpriced: boolean;
    addedMinutes: number;
    disruptedAssignments: number;
    score: number;
  };
};
export function applyIntervention(project: Project, i: Intervention): Project {
  let p = structuredClone(project);
  const changes: Change[] =
    i.changes ??
    (i.volunteer
      ? [{ kind: "add-volunteer", volunteer: i.volunteer }]
      : i.resourceId
        ? [
            {
              kind: "resource",
              resourceId: i.resourceId,
              quantity: i.quantity!,
            },
          ]
        : i.budgetCents !== undefined
          ? [{ kind: "budget", budgetCents: i.budgetCents }]
          : []);
  for (const c of changes) {
    if (c.kind === "add-volunteer")
      p.volunteers.push(structuredClone(c.volunteer));
    if (c.kind === "availability")
      p.volunteers = p.volunteers.map((v) =>
        v.id === c.volunteerId
          ? {
              ...v,
              simulated: true,
              availability: [...v.availability, { start: c.start, end: c.end }],
            }
          : v,
      );
    if (c.kind === "resource") {
      const r = p.resources.find((r) => r.id === c.resourceId)!;
      const delta = Math.max(0, c.quantity - r.quantity);
      if (r.unitCostCents !== undefined)
        p.tasks[0].costCents += delta * r.unitCostCents;
      r.quantity = c.quantity;
    }
    if (c.kind === "budget") p.budgetCents = c.budgetCents;
    // Only optional leaves may be dropped: no silently erased downstream dependency.
    if (
      c.kind === "scope" &&
      p.tasks.length > 1 &&
      p.tasks.some((t) => t.id === c.taskId && t.optional) &&
      !p.tasks.some((t) => t.dependencies.includes(c.taskId))
    )
      p = { ...p, tasks: p.tasks.filter((t) => t.id !== c.taskId) };
  }
  return p;
}
type Draft = Omit<
  Intervention,
  "result" | "resolves" | "verification" | "outcome" | "metrics"
> & { changes: Change[] };
export const rankingExplanation =
  "Verified feasibility first, then promising, search-incomplete, and blocked. Within each group, lower score wins: 100 × changes + 2 × known added dollars + added workload minutes ÷ 10 + 5 × disrupted assignments + 50 if supply cost is unknown. Funding is a limit change, not an acquisition expense. Proposed people are uncosted volunteer commitments. Candidate search is bounded; no global minimum is claimed.";
export function analyzeInterventions(
  p: Project,
  baseline = solve(p),
  options: { combinations?: boolean } = {},
): Intervention[] {
  if (baseline.status === "feasible" || baseline.status === "invalid")
    return [];
  const drafts: Draft[] = [],
    seen = new Set<string>();
  for (const issue of baseline.issues) {
    if (issue.kind === "staffing") {
      const slot = slotsFor(p).find((s) => s.id === issue.slotId)!;
      const signature = JSON.stringify([
        [...slot.role.skills].sort(),
        [...slot.role.qualifications].sort(),
      ]);
      if (!seen.has(signature) && p.volunteers.length < 24) {
        seen.add(signature);
        let candidateId = `sim-${slot.role.id}`,
          suffix = 1;
        while (p.volunteers.some((v) => v.id === candidateId))
          candidateId = `sim-${slot.role.id}-${suffix++}`;
        const start = Math.min(...p.tasks.map((t) => t.start)),
          end = Math.max(...p.tasks.map((t) => t.end));
        const volunteer: Volunteer = {
          id: candidateId,
          name:
            slot.role.id === "instructor"
              ? "Avery Chen"
              : `New ${slot.role.name.toLowerCase()}`,
          skills: slot.role.skills,
          qualifications: slot.role.qualifications,
          availability: [{ start, end }],
          maxMinutes: end - start,
          simulated: true,
        };
        drafts.push({
          id: candidateId,
          kind: "volunteer",
          label: `Add 1 ${slot.role.name.toLowerCase()}`,
          explanation: `Assumes one new volunteer with ${[...volunteer.skills, ...volunteer.qualifications].join(", ").replaceAll("_", " ") || "general support skills"}, full event availability, and ${end - start} minutes of workload capacity. This is a hypothetical commitment, not a recruited person.`,
          volunteer,
          changes: [{ kind: "add-volunteer", volunteer }],
        });
      }
      for (const v of p.volunteers
        .filter((v) => qualified(v, slot.role) && !available(v, slot.task))
        .slice(0, 3)) {
        const id = `availability-${v.id}-${slot.task.id}`;
        if (seen.has(id) || v.availability.length >= 10) continue;
        seen.add(id);
        drafts.push({
          id,
          kind: "availability",
          label: `Extend ${v.name}'s availability`,
          explanation: `Hypothetically covers ${slot.task.name} from ${slot.task.start} to ${slot.task.end} minutes after midnight. Workload limits and qualifications remain unchanged. Confirm this with the volunteer before relying on it.`,
          changes: [
            {
              kind: "availability",
              volunteerId: v.id,
              start: slot.task.start,
              end: slot.task.end,
            },
          ],
        });
      }
    }
    if (issue.kind === "resource") {
      const r = p.resources.find((r) => r.id === issue.resourceId)!;
      if (r.quantity + issue.shortfall! <= 10000)
        drafts.push({
          id: `supply-${r.id}`,
          kind: "resource",
          resourceId: r.id,
          quantity: r.quantity + issue.shortfall!,
          label: `Increase ${r.name.toLowerCase()} by ${issue.shortfall}`,
          explanation:
            r.unitCostCents === undefined
              ? "Supply acquisition cost is unknown; confirm on-hand stock or enter a unit cost in the editor. Unknown costs are penalized in ranking."
              : "Adds the entered acquisition cost to the first task’s planned expenses, then checks the budget again.",
          changes: [
            {
              kind: "resource",
              resourceId: r.id,
              quantity: r.quantity + issue.shortfall!,
            },
          ],
        });
    }
    if (issue.kind === "budget")
      drafts.push({
        id: "raise-budget",
        kind: "budget",
        budgetCents: baseline.costCents,
        label: "Fund the budget shortfall",
        explanation:
          "Assumes additional committed funding. No real funds are raised by this simulation.",
        changes: [{ kind: "budget", budgetCents: baseline.costCents }],
      });
  }
  for (const t of p.tasks.filter(
    (t) =>
      t.optional && !p.tasks.some((other) => other.dependencies.includes(t.id)),
  ))
    drafts.push({
      id: `scope-${t.id}`,
      kind: "scope",
      label: `Drop optional task: ${t.name}`,
      explanation:
        "Explicitly reduces the approved scope, removing this task’s roles, expenses, and supplies. Remaining requirements are checked again. Only an optional leaf task may be dropped.",
      changes: [{ kind: "scope", taskId: t.id }],
    });
  function evaluate(d: Draft): Intervention {
    const next = applyIntervention(p, {
        ...d,
        result: baseline,
        resolves: false,
      }),
      result = solve(next),
      verification = verifyAssignment(next, result.assignments);
    const resolves = result.status === "feasible" && verification.valid;
    const disruptedAssignments = baseline.assignments.filter(
      (a) =>
        !result.assignments.some(
          (b) => a.slotId === b.slotId && a.volunteerId === b.volunteerId,
        ),
    ).length;
    const workload = (r: SolveResult, model: Project) =>
      r.assignments.reduce((n, a) => {
        const s = slotsFor(model).find((s) => s.id === a.slotId)!;
        return n + s.task.end - s.task.start;
      }, 0);
    const addedMinutes = Math.max(
      0,
      workload(result, next) - workload(baseline, p),
    );
    const addedCostCents = Math.max(0, result.costCents - baseline.costCents);
    const unpriced = d.changes.some(
      (c) =>
        c.kind === "resource" &&
        p.resources.find((r) => r.id === c.resourceId)?.unitCostCents ===
          undefined,
    );
    const metrics = {
      changes: d.changes.length,
      addedCostCents,
      unpriced,
      addedMinutes,
      disruptedAssignments,
      score:
        d.changes.length * 100 +
        (addedCostCents / 100) * 2 +
        addedMinutes / 10 +
        disruptedAssignments * 5 +
        (unpriced ? 50 : 0),
    };
    const improving =
      result.issues.length < baseline.issues.length ||
      result.filledSlots > baseline.filledSlots;
    const outcome = resolves
      ? "verified"
      : result.status === "unknown"
        ? "unknown"
        : result.status !== "invalid" && improving
          ? "promising"
          : "blocked";
    return { ...d, result, verification, resolves, outcome, metrics };
  }
  // Bounded, transparent candidate space: first 12 singles, pairs among first 6,
  // plus each candidate paired with the funding shortfall its purchase creates.
  const singles = drafts.slice(0, 12),
    results = singles.map(evaluate);
  for (let a = 0; options.combinations && a < Math.min(singles.length, 6); a++)
    for (let b = a + 1; b < Math.min(singles.length, 6); b++) {
      if (
        singles[a].changes.some((c) =>
          singles[b].changes.some(
            (d) =>
              c.kind === d.kind &&
              (c.kind === "budget" ||
                (c.kind === "resource" &&
                  d.kind === "resource" &&
                  c.resourceId === d.resourceId)),
          ),
        )
      )
        continue;
      results.push(
        evaluate({
          id: `${singles[a].id}+${singles[b].id}`,
          label: `${singles[a].label} + ${singles[b].label.toLowerCase()}`,
          kind: "bundle",
          explanation: `${singles[a].explanation} ${singles[b].explanation}`,
          changes: [...singles[a].changes, ...singles[b].changes],
        }),
      );
    }
  for (const candidate of options.combinations
    ? [...results].slice(0, 27)
    : []) {
    if (
      !candidate.resolves &&
      candidate.result.costCents > p.budgetCents &&
      !candidate.changes?.some((c) => c.kind === "budget")
    )
      results.push(
        evaluate({
          id: `${candidate.id}+funding`,
          kind: "bundle",
          label: `${candidate.label} + fund added costs`,
          explanation: `${candidate.explanation} Also assumes funding for the resulting budget deficit.`,
          changes: [
            ...candidate.changes!,
            { kind: "budget", budgetCents: candidate.result.costCents },
          ],
        }),
      );
  }
  const ranks = { verified: 0, promising: 1, unknown: 2, blocked: 3 };
  return results.sort(
    (a, b) =>
      ranks[a.outcome!] - ranks[b.outcome!] ||
      a.metrics!.score - b.metrics!.score ||
      a.id.localeCompare(b.id, "en"),
  );
}
