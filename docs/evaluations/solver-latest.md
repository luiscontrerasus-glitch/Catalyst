# Reproducible solver evaluation

Measured 2026-11-19T23:35:36.606Z on AMD Ryzen 9 8945HS w/ Radeon 780M Graphics, win32 x64, v24.14.1.

19/19 defined outcomes correct; 200/200 independent small-case oracle comparisons match. All returned feasible witnesses and verified interventions pass the independent checker.

12/12 fixtures defined as repairable have a verified repair in the bounded candidate set. This rate is fixture-specific, not a general success probability.

| Fixture | Solver | Covered | Greedy baseline | Verified repairs | Median / p95 solve (ms) |
|---|---|---:|---|---:|---:|
| robotics-shortage | infeasible | 7/8 | no_solution_found | 1 | 0.272 / 0.445 |
| robotics-repaired | feasible | 8/8 | feasible | 0 | 0.243 / 0.434 |
| robotics-withdrawal | infeasible | 7/8 | no_solution_found | 1 | 0.219 / 0.560 |
| cleanup-shortages | infeasible | 4/5 | no_solution_found | 2 | 0.279 / 0.377 |
| donation-feasible | feasible | 4/4 | feasible | 0 | 0.129 / 0.214 |
| donation-withdrawal | infeasible | 3/4 | no_solution_found | 1 | 0.122 / 0.169 |
| overlapping-tasks | infeasible | 1/2 | no_solution_found | 1 | 0.169 / 0.318 |
| missing-qualification | infeasible | 0/1 | no_solution_found | 1 | 0.091 / 0.135 |
| budget-shortage | infeasible | 1/1 | no_solution_found | 1 | 0.244 / 0.400 |
| dependency-conflict | infeasible | 1/2 | no_solution_found | 0 | 0.120 / 0.175 |
| greedy-specialist-trap | feasible | 2/2 | no_solution_found | 0 | 0.093 / 0.211 |
| multiple-alternatives | feasible | 1/1 | feasible | 0 | 0.111 / 0.170 |
| workload-cap | infeasible | 1/2 | no_solution_found | 1 | 0.131 / 0.255 |
| repair-creates-budget-deficit | infeasible | 1/1 | no_solution_found | 1 | 0.127 / 0.175 |
| impossible-cycle | infeasible | 2/2 | no_solution_found | 0 | 0.103 / 0.205 |
| fragmented-availability | infeasible | 0/1 | no_solution_found | 3 | 0.122 / 0.211 |
| reusable-boundary | feasible | 2/2 | feasible | 0 | 0.124 / 0.316 |
| consumable-total | infeasible | 2/2 | no_solution_found | 1 | 0.107 / 0.219 |
| two-identical-vacancies | infeasible | 0/2 | no_solution_found | 1 | 0.080 / 0.089 |

The first-fit baseline never proves infeasibility. The specialist fixture demonstrates a valid solution missed by greedy ordering. Contradictory dependencies are intentionally not repaired by adding people or supplies. Two identical simultaneous vacancies now have a verified pair of distinct hypothetical volunteers. Search is still bounded to at most two candidates per skill profile and pairs among the first six singles; three identical new volunteers in one bundle remain outside its candidate space. Timing uses one warm-up and 25 measured repetitions per fixture; intervention timing is recorded separately in JSON. No live users, measured impact, or global optimality is claimed.

Run `npm run evaluate` to regenerate both artifacts.
