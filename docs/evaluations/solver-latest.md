# Reproducible solver evaluation

Measured 2026-11-19T17:17:20.586Z on AMD Ryzen 9 8945HS w/ Radeon 780M Graphics, win32 x64, v24.14.1.

19/19 defined outcomes correct; 200/200 independent small-case oracle comparisons match. All returned feasible witnesses and verified interventions pass the independent checker.

11/12 fixtures defined as repairable have a verified repair in the bounded candidate set. This rate is fixture-specific, not a general success probability.

| Fixture | Solver | Covered | Greedy baseline | Verified repairs | Median / p95 solve (ms) |
|---|---|---:|---|---:|---:|
| robotics-shortage | infeasible | 7/8 | no_solution_found | 1 | 0.362 / 0.669 |
| robotics-repaired | feasible | 8/8 | feasible | 0 | 0.265 / 0.364 |
| robotics-withdrawal | infeasible | 7/8 | no_solution_found | 1 | 0.262 / 0.447 |
| cleanup-shortages | infeasible | 4/5 | no_solution_found | 2 | 0.213 / 0.312 |
| donation-feasible | feasible | 4/4 | feasible | 0 | 0.119 / 0.467 |
| donation-withdrawal | infeasible | 3/4 | no_solution_found | 1 | 0.134 / 0.200 |
| overlapping-tasks | infeasible | 1/2 | no_solution_found | 1 | 0.117 / 0.182 |
| missing-qualification | infeasible | 0/1 | no_solution_found | 1 | 0.092 / 0.168 |
| budget-shortage | infeasible | 1/1 | no_solution_found | 1 | 0.186 / 0.241 |
| dependency-conflict | infeasible | 1/2 | no_solution_found | 0 | 0.107 / 0.219 |
| greedy-specialist-trap | feasible | 2/2 | no_solution_found | 0 | 0.098 / 0.279 |
| multiple-alternatives | feasible | 1/1 | feasible | 0 | 0.094 / 0.146 |
| workload-cap | infeasible | 1/2 | no_solution_found | 1 | 0.117 / 0.254 |
| repair-creates-budget-deficit | infeasible | 1/1 | no_solution_found | 1 | 0.096 / 0.374 |
| impossible-cycle | infeasible | 2/2 | no_solution_found | 0 | 0.092 / 0.141 |
| fragmented-availability | infeasible | 0/1 | no_solution_found | 3 | 0.089 / 0.135 |
| reusable-boundary | feasible | 2/2 | feasible | 0 | 0.094 / 0.130 |
| consumable-total | infeasible | 2/2 | no_solution_found | 1 | 0.099 / 0.134 |
| two-identical-vacancies | infeasible | 0/2 | no_solution_found | 0 | 0.078 / 0.148 |

The first-fit baseline never proves infeasibility. The specialist fixture demonstrates a valid solution missed by greedy ordering. Contradictory dependencies are intentionally not repaired by adding people or supplies. The two-identical-vacancies fixture exposes the current one-candidate-per-skill-profile limit; sequential contributions can still repair that project. Timing uses one warm-up and 25 measured repetitions per fixture; intervention timing is recorded separately in JSON. No live users, measured impact, or global optimality is claimed.

Run `npm run evaluate` to regenerate both artifacts.
