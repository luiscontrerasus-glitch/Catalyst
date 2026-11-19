import { mkdirSync, writeFileSync } from "node:fs";
import { cpus, platform, arch } from "node:os";
import { performance } from "node:perf_hooks";
import { evaluationFixtures, smallProject } from "../src/evaluation/fixtures";
import { greedyBaseline, exhaustiveOracle } from "../src/evaluation/baseline";
import { solve } from "../src/engine/solver";
import { verifyAssignment } from "../src/engine/verify";
import {
  analyzeInterventions,
  applyIntervention,
} from "../src/engine/interventions";
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const records = evaluationFixtures().map((f) => {
  const times: number[] = [];
  solve(f.project);
  for (let run = 0; run < 25; run++) {
    const start = performance.now();
    solve(f.project);
    times.push(performance.now() - start);
  }
  const result = solve(f.project),
    baseline = greedyBaseline(f.project);
  const start = performance.now(),
    candidates = analyzeInterventions(f.project, result, {
      combinations: true,
    }),
    interventionMs = performance.now() - start;
  const repairs = candidates.filter((i) => i.resolves);
  return {
    id: f.id,
    category: f.category,
    expectedFeasible: f.expectedFeasible,
    actualStatus: result.status,
    correct:
      (result.status === "feasible") === f.expectedFeasible &&
      result.status !== "unknown" &&
      result.status !== "invalid",
    certificateValid: verifyAssignment(f.project, result.assignments).valid,
    filledSlots: result.filledSlots,
    totalSlots: result.totalSlots,
    exploredNodes: result.exploredNodes,
    baselineStatus: baseline.status,
    baselineFilledSlots: baseline.assignments.length,
    repairable: f.repairable ?? null,
    candidates: candidates.length,
    verifiedRepairs: repairs.length,
    allRepairsVerified: repairs.every(
      (i) =>
        verifyAssignment(applyIntervention(f.project, i), i.result.assignments)
          .valid,
    ),
    medianSolveMs: median(times),
    p95SolveMs: [...times].sort((a, b) => a - b)[23],
    interventionMs,
  };
});
let seed = 42023,
  oracleMatches = 0;
const random = (n: number) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return (seed >>> 8) % n;
};
for (let sample = 0; sample < 200; sample++) {
  const p = smallProject();
  p.tasks = Array.from({ length: 1 + random(4) }, (_, i) => {
    const start = random(3) * 30;
    return {
      ...structuredClone(p.tasks[0]),
      id: `t-${i}`,
      start,
      end: start + 30 + random(2) * 30,
      roles: [
        {
          id: "r",
          name: "R",
          count: 1,
          skills: [random(2) ? "support" : "special"],
          qualifications: random(4) ? [] : ["certificate"],
        },
      ],
    };
  });
  p.volunteers = Array.from({ length: 1 + random(3) }, (_, i) => ({
    id: `v-${i}`,
    name: `Fictional ${i}`,
    skills: random(2) ? ["support", "special"] : ["support"],
    qualifications: random(2) ? ["certificate"] : [],
    availability: [{ start: random(2) * 30, end: 180 }],
    maxMinutes: 30 + random(4) * 30,
  }));
  if ((solve(p).status === "feasible") === exhaustiveOracle(p)) oracleMatches++;
}
const repairable = records.filter((r) => r.repairable === true),
  report = {
    generatedAt: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: platform(),
      arch: arch(),
      cpu: cpus()[0]?.model,
    },
    method: {
      warmups: 1,
      repetitions: 25,
      oracleSeed: 42023,
      oracleSamples: 200,
      timing:
        "Wall-clock performance.now; machine-specific, not a universal performance claim.",
      candidateSpace:
        "12 singles, pairs among first six, and resulting funding additions; no global optimum claim.",
    },
    summary: {
      fixtures: records.length,
      correct: records.filter((r) => r.correct).length,
      feasibleCertificatesValid: records
        .filter((r) => r.actualStatus === "feasible")
        .every((r) => r.certificateValid),
      allReturnedRepairsValid: records.every((r) => r.allRepairsVerified),
      repairableFixtures: repairable.length,
      repairableFixturesWithVerifiedRepair: repairable.filter(
        (r) => r.verifiedRepairs > 0,
      ).length,
      oracleMatches,
      oracleSamples: 200,
    },
    records,
  };
mkdirSync("docs/evaluations", { recursive: true });
writeFileSync(
  "docs/evaluations/solver-latest.json",
  JSON.stringify(report, null, 2) + "\n",
);
const lines = [
  "# Reproducible solver evaluation",
  "",
  `Measured ${report.generatedAt} on ${report.environment.cpu}, ${platform()} ${arch()}, ${process.version}.`,
  ``,
  `${report.summary.correct}/${records.length} defined outcomes correct; ${oracleMatches}/200 independent small-case oracle comparisons match. All returned feasible witnesses and verified interventions pass the independent checker.`,
  ``,
  `${report.summary.repairableFixturesWithVerifiedRepair}/${repairable.length} fixtures defined as repairable have a verified repair in the bounded candidate set. This rate is fixture-specific, not a general success probability.`,
  ``,
  "| Fixture | Solver | Covered | Greedy baseline | Verified repairs | Median / p95 solve (ms) |",
  "|---|---|---:|---|---:|---:|",
  ...records.map(
    (r) =>
      `| ${r.id} | ${r.actualStatus} | ${r.filledSlots}/${r.totalSlots} | ${r.baselineStatus} | ${r.verifiedRepairs} | ${r.medianSolveMs.toFixed(3)} / ${r.p95SolveMs.toFixed(3)} |`,
  ),
  "",
  "The first-fit baseline never proves infeasibility. The specialist fixture demonstrates a valid solution missed by greedy ordering. Contradictory dependencies are intentionally not repaired by adding people or supplies. Two identical simultaneous vacancies now have a verified pair of distinct hypothetical volunteers. Search is still bounded to at most two candidates per skill profile and pairs among the first six singles; three identical new volunteers in one bundle remain outside its candidate space. Timing uses one warm-up and 25 measured repetitions per fixture; intervention timing is recorded separately in JSON. No live users, measured impact, or global optimality is claimed.",
  "",
  "Run `npm run evaluate` to regenerate both artifacts.",
];
writeFileSync("docs/evaluations/solver-latest.md", lines.join("\n") + "\n");
console.log(JSON.stringify(report.summary));
if (
  !records.every(
    (r) =>
      r.correct &&
      r.allRepairsVerified &&
      (r.actualStatus !== "feasible" || r.certificateValid),
  ) ||
  oracleMatches !== 200
)
  process.exitCode = 1;
