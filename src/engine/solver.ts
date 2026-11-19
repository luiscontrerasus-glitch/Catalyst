import {
  available,
  money,
  overlaps,
  projectSchema,
  qualified,
  slotsFor,
  type Assignment,
  type Issue,
  type Project,
  type SolveResult,
  type Slot,
} from "./model";

/** Reusable supplies are reserved on half-open [start,end) intervals; consumables are used once. */
export function resourceDemand(p: Project, resourceId: string): number {
  const resource = p.resources.find((r) => r.id === resourceId);
  const uses = p.tasks.flatMap((t) =>
    t.resources
      .filter((r) => r.resourceId === resourceId)
      .map((r) => ({ start: t.start, end: t.end, quantity: r.quantity })),
  );
  if (resource?.kind === "consumable")
    return uses.reduce((n, u) => n + u.quantity, 0);
  return Math.max(
    0,
    ...uses.map((u) =>
      uses
        .filter((v) => v.start <= u.start && u.start < v.end)
        .reduce((n, v) => n + v.quantity, 0),
    ),
  );
}

export function staticIssues(p: Project): Issue[] {
  const issues: Issue[] = [];
  const cost = p.tasks.reduce((n, t) => n + t.costCents, 0);
  if (cost > p.budgetCents)
    issues.push({
      kind: "budget",
      message: `Planned expenses exceed the budget by ${money(cost - p.budgetCents)}.`,
      taskIds: [],
      shortfall: cost - p.budgetCents,
    });
  for (const r of p.resources) {
    const demand = resourceDemand(p, r.id);
    if (demand > r.quantity)
      issues.push({
        kind: "resource",
        message: `${r.name}: ${demand} required, ${r.quantity} available. Add ${demand - r.quantity}.`,
        resourceId: r.id,
        shortfall: demand - r.quantity,
        taskIds: p.tasks
          .filter((t) => t.resources.some((x) => x.resourceId === r.id))
          .map((t) => t.id),
      });
  }
  const visiting = new Set<string>(),
    visited = new Set<string>();
  let cyclic = false;
  function visit(id: string) {
    if (visiting.has(id)) {
      cyclic = true;
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    p.tasks.find((t) => t.id === id)?.dependencies.forEach(visit);
    visiting.delete(id);
    visited.add(id);
  }
  p.tasks.forEach((t) => visit(t.id));
  if (cyclic)
    issues.push({
      kind: "dependency",
      message: "Task dependencies contain a cycle.",
      taskIds: p.tasks.map((t) => t.id),
    });
  for (const t of p.tasks)
    for (const dep of t.dependencies) {
      const parent = p.tasks.find((x) => x.id === dep)!;
      if (parent.end > t.start)
        issues.push({
          kind: "dependency",
          message: `${t.name} starts before ${parent.name} finishes.`,
          taskIds: [dep, t.id],
        });
    }
  return issues;
}

/** Exact bounded CSP with deterministic minimum-domain ordering and branch-and-bound.
 * Searches assignment/skip branches to maximize filled roles for diagnostics. A node
 * limit yields UNKNOWN, never an infeasibility claim without an exhausted search.
 */
export function solve(
  input: unknown,
  options: { maxNodes?: number } = {},
): SolveResult {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success)
    return {
      status: "invalid",
      assignments: [],
      issues: [
        {
          kind: "model",
          message: parsed.error.issues.map((x) => x.message).join("; "),
          taskIds: [],
        },
      ],
      totalSlots: 0,
      filledSlots: 0,
      exploredNodes: 0,
      exhaustive: false,
      costCents: 0,
    };
  const p = parsed.data,
    slots = slotsFor(p),
    volunteers = [...p.volunteers].sort((a, b) =>
      a.id.localeCompare(b.id, "en"),
    );
  const issues = staticIssues(p);
  const domains = new Map(
    slots.map((s) => [
      s.id,
      volunteers.filter(
        (v) =>
          qualified(v, s.role) &&
          available(v, s.task) &&
          v.maxMinutes >= s.task.end - s.task.start,
      ),
    ]),
  );
  const ordered = [...slots].sort(
    (a, b) =>
      domains.get(a.id)!.length - domains.get(b.id)!.length ||
      a.id.localeCompare(b.id, "en"),
  );
  let best: Assignment[] = [],
    exploredNodes = 0,
    limited = false;
  const current: Assignment[] = [],
    occupied = new Map<string, Slot[]>();
  const maxNodes = options.maxNodes ?? 200000;
  function search(index: number) {
    if (best.length === slots.length || limited) return;
    if (exploredNodes >= maxNodes) {
      limited = true;
      return;
    }
    exploredNodes++;
    if (current.length > best.length) best = [...current];
    if (
      index === ordered.length ||
      current.length + ordered.length - index <= best.length
    )
      return;
    const slot = ordered[index],
      duration = slot.task.end - slot.task.start;
    for (const v of domains.get(slot.id)!) {
      const busy = occupied.get(v.id) ?? [];
      if (
        busy.some((s) => overlaps(s.task, slot.task)) ||
        busy.reduce((n, s) => n + s.task.end - s.task.start, 0) + duration >
          v.maxMinutes
      )
        continue;
      occupied.set(v.id, [...busy, slot]);
      current.push({ slotId: slot.id, volunteerId: v.id });
      search(index + 1);
      current.pop();
      occupied.set(v.id, busy);
      if (best.length === slots.length || limited) return;
    }
    search(index + 1);
  }
  search(0);
  const assignedIds = new Set(best.map((a) => a.slotId));
  for (const s of slots.filter((s) => !assignedIds.has(s.id))) {
    const skilled = volunteers.filter((v) => qualified(v, s.role));
    const present = skilled.filter((v) => available(v, s.task));
    const reason = !skilled.length
      ? "No volunteer has all required skills and qualifications."
      : !present.length
        ? "Qualified volunteers are unavailable for the full task window."
        : !domains.get(s.id)!.length
          ? "Qualified volunteers lack the required workload capacity."
          : "Qualified volunteers cannot cover every role without a schedule or workload conflict.";
    issues.push({
      kind: "staffing",
      taskIds: [s.task.id],
      slotId: s.id,
      message: `${s.task.name} needs a ${s.role.name.toLowerCase()}. ${reason}`,
    });
  }
  const full = best.length === slots.length;
  const status =
    issues.length === 0 && full
      ? "feasible"
      : staticIssues(p).length > 0 || (!limited && !full)
        ? "infeasible"
        : "unknown";
  return {
    status,
    assignments: best.sort((a, b) => a.slotId.localeCompare(b.slotId, "en")),
    issues,
    totalSlots: slots.length,
    filledSlots: best.length,
    exploredNodes,
    exhaustive: !limited,
    costCents: p.tasks.reduce((n, t) => n + t.costCents, 0),
  };
}
