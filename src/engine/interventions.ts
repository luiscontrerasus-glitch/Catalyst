import {
  slotsFor,
  type Project,
  type SolveResult,
  type Volunteer,
} from "./model";
import { solve } from "./solver";

export type Intervention = {
  id: string;
  label: string;
  explanation: string;
  kind: "volunteer" | "resource" | "budget";
  volunteer?: Volunteer;
  resourceId?: string;
  quantity?: number;
  budgetCents?: number;
  result: SolveResult;
  resolves: boolean;
};
export function applyIntervention(p: Project, i: Intervention): Project {
  if (i.volunteer) return { ...p, volunteers: [...p.volunteers, i.volunteer] };
  if (i.resourceId)
    return {
      ...p,
      resources: p.resources.map((r) =>
        r.id === i.resourceId ? { ...r, quantity: i.quantity! } : r,
      ),
    };
  if (i.budgetCents !== undefined) return { ...p, budgetCents: i.budgetCents };
  return p;
}

/** Candidate interventions are explicit assumptions, verified by re-solving.
 * No claim of globally minimal repair across all possible model changes. */
export function analyzeInterventions(
  p: Project,
  baseline = solve(p),
): Intervention[] {
  if (baseline.status === "feasible" || baseline.status === "invalid")
    return [];
  const drafts: Omit<Intervention, "result" | "resolves">[] = [];
  const profiles = new Set<string>();
  for (const issue of baseline.issues) {
    if (issue.kind === "staffing") {
      const slot = slotsFor(p).find((s) => s.id === issue.slotId)!;
      const signature = JSON.stringify([
        [...slot.role.skills].sort(),
        [...slot.role.qualifications].sort(),
      ]);
      if (profiles.has(signature)) continue;
      profiles.add(signature);
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
        explanation: `Simulates one person with ${[...volunteer.skills, ...volunteer.qualifications].join(", ").replaceAll("_", " ")} and full event availability. No real commitment is implied.`,
        volunteer,
      });
    }
    if (issue.kind === "resource") {
      const r = p.resources.find((r) => r.id === issue.resourceId)!;
      drafts.push({
        id: `supply-${r.id}`,
        kind: "resource",
        resourceId: r.id,
        quantity: r.quantity + issue.shortfall!,
        label: `Increase ${r.name.toLowerCase()} by ${issue.shortfall}`,
        explanation:
          "Changes inventory only. Any purchase cost must be added to planned expenses separately.",
      });
    }
    if (issue.kind === "budget")
      drafts.push({
        id: "raise-budget",
        kind: "budget",
        budgetCents: baseline.costCents,
        label: "Fund the budget shortfall",
        explanation:
          "Simulates committed funding sufficient for the currently modeled expenses.",
      });
  }
  return drafts
    .map((d) => {
      const result = solve(
        applyIntervention(p, { ...d, result: baseline, resolves: false }),
      );
      return { ...d, result, resolves: result.status === "feasible" };
    })
    .sort(
      (a, b) =>
        Number(b.resolves) - Number(a.resolves) ||
        b.result.filledSlots - a.result.filledSlots ||
        a.id.localeCompare(b.id, "en"),
    );
}
