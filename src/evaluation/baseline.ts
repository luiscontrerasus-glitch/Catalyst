import {
  available,
  overlaps,
  qualified,
  slotsFor,
  type Assignment,
  type Project,
} from "@/engine/model";
import { verifyAssignment } from "@/engine/verify";
/** Deliberately simple first-fit baseline, not an infeasibility oracle. */
export function greedyBaseline(p: Project) {
  const assignments: Assignment[] = [],
    slots = slotsFor(p);
  for (const slot of slots) {
    const person = p.volunteers.find((v) => {
      const work = assignments
        .filter((a) => a.volunteerId === v.id)
        .map((a) => slots.find((s) => s.id === a.slotId)!);
      return (
        qualified(v, slot.role) &&
        available(v, slot.task) &&
        !work.some((s) => overlaps(s.task, slot.task)) &&
        work.reduce((n, s) => n + s.task.end - s.task.start, 0) +
          slot.task.end -
          slot.task.start <=
          v.maxMinutes
      );
    });
    if (person) assignments.push({ slotId: slot.id, volunteerId: person.id });
  }
  const verification = verifyAssignment(p, assignments);
  return {
    assignments,
    verification,
    status: verification.valid ? "feasible" : "no_solution_found",
  };
}
/** Enumerates complete witnesses using only the independent certificate checker. */
export function exhaustiveOracle(p: Project): boolean {
  const slots = slotsFor(p),
    assignments: Assignment[] = [];
  function search(i: number): boolean {
    if (i === slots.length) return verifyAssignment(p, assignments).valid;
    for (const v of p.volunteers) {
      assignments.push({ slotId: slots[i].id, volunteerId: v.id });
      if (search(i + 1)) return true;
      assignments.pop();
    }
    return false;
  }
  return search(0);
}
