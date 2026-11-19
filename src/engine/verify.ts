import { projectSchema, slotsFor, type Assignment } from "./model";

/** Independent certificate checker: no search and no solver constraint helpers. */
export function verifyAssignment(
  input: unknown,
  assignments: Assignment[],
): { valid: boolean; errors: string[] } {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success)
    return { valid: false, errors: ["Invalid project model"] };
  const p = parsed.data,
    slots = slotsFor(p),
    errors: string[] = [],
    seen = new Set<string>();
  const work = new Map<string, { start: number; end: number }[]>();
  for (const a of assignments) {
    const s = slots.find((s) => s.id === a.slotId),
      v = p.volunteers.find((v) => v.id === a.volunteerId);
    if (!s || !v) {
      errors.push("Unknown slot or volunteer");
      continue;
    }
    if (seen.has(s.id)) errors.push(`Duplicate slot ${s.id}`);
    seen.add(s.id);
    if (
      s.role.skills.some((k) => !v.skills.includes(k)) ||
      s.role.qualifications.some((k) => !v.qualifications.includes(k))
    )
      errors.push(`Missing qualification ${s.id}`);
    if (
      !v.availability.some(
        (w) => w.start <= s.task.start && w.end >= s.task.end,
      )
    )
      errors.push(`Unavailable ${v.id}`);
    const busy = work.get(v.id) ?? [];
    if (busy.some((b) => b.start < s.task.end && s.task.start < b.end))
      errors.push(`Overlap ${v.id}`);
    busy.push({ start: s.task.start, end: s.task.end });
    work.set(v.id, busy);
    if (busy.reduce((n, t) => n + t.end - t.start, 0) > v.maxMinutes)
      errors.push(`Capacity ${v.id}`);
  }
  for (const s of slots) if (!seen.has(s.id)) errors.push(`Unfilled ${s.id}`);
  if (p.tasks.reduce((n, t) => n + t.costCents, 0) > p.budgetCents)
    errors.push("Budget exceeded");
  for (const t of p.tasks)
    for (const d of t.dependencies)
      if (p.tasks.find((x) => x.id === d)!.end > t.start)
        errors.push("Dependency violation");
  // Strictly positive task durations make every directed cycle violate an edge's timing.
  for (const r of p.resources) {
    const uses = p.tasks.flatMap((t) =>
      t.resources
        .filter((x) => x.resourceId === r.id)
        .map((x) => ({ ...x, start: t.start, end: t.end })),
    );
    const points = [...new Set(uses.flatMap((x) => [x.start, x.end]))].sort(
      (a, b) => a - b,
    );
    const demand =
      r.kind === "consumable"
        ? uses.reduce((n, x) => n + x.quantity, 0)
        : Math.max(
            0,
            ...points.map((t) =>
              uses.reduce(
                (n, x) => n + (x.start <= t && t < x.end ? x.quantity : 0),
                0,
              ),
            ),
          );
    if (demand > r.quantity) errors.push(`Insufficient ${r.id}`);
  }
  return { valid: !errors.length, errors };
}
