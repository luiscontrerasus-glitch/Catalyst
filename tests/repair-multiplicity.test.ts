import { expect, it } from "vitest";
import { smallProject } from "@/evaluation/fixtures";
import {
  analyzeInterventions,
  applyIntervention,
} from "@/engine/interventions";
import { solve } from "@/engine/solver";
import { verifyAssignment } from "@/engine/verify";
it("finds a verified bundle of two distinct volunteers for identical simultaneous vacancies", () => {
  const p = smallProject();
  p.volunteers = [];
  p.tasks[0].roles[0].count = 2;
  const before = structuredClone(p);
  const candidates = analyzeInterventions(p, solve(p), { combinations: true });
  const best = candidates.find((i) => i.resolves)!;
  expect(best).toBeDefined();
  const repaired = applyIntervention(p, best);
  expect(new Set(repaired.volunteers.map((v) => v.id)).size).toBe(2);
  expect(new Set(repaired.volunteers.map((v) => v.name)).size).toBe(2);
  expect(repaired.volunteers.every((v) => v.simulated)).toBe(true);
  expect(verifyAssignment(repaired, best.result.assignments).valid).toBe(true);
  expect(p).toEqual(before);
});
it("does not exceed the volunteer cap when combining candidates", () => {
  const p = smallProject();
  p.tasks[0].roles[0].count = 2;
  p.volunteers = Array.from({ length: 23 }, (_, i) => ({
    ...p.volunteers[0],
    id: `v-${i}`,
    skills: ["different"],
  }));
  const candidates = analyzeInterventions(p, solve(p), { combinations: true });
  expect(
    candidates.every((i) => applyIntervention(p, i).volunteers.length <= 24),
  ).toBe(true);
  expect(candidates.some((i) => i.resolves)).toBe(false);
});
it("keeps repeated-contribution search bounded without claiming every repair is found", () => {
  const p = smallProject();
  p.volunteers = [];
  p.tasks[0].roles[0].count = 3;
  expect(
    analyzeInterventions(p, solve(p), { combinations: true }).some(
      (i) => i.resolves,
    ),
  ).toBe(false);
});
