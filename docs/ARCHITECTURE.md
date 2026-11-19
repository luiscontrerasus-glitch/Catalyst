# Architecture and solver contract

## Boundaries

| Module                        | Responsibility                                                          |
| ----------------------------- | ----------------------------------------------------------------------- |
| `src/engine/model.ts`         | Zod schemas, typed finite model, stable role slot identities            |
| `src/engine/solver.ts`        | Static constraints and deterministic bounded exact CSP search           |
| `src/engine/verify.ts`        | Independent assignment certificate validation; no search helpers        |
| `src/engine/interventions.ts` | Construct explicit hypothetical changes, re-solve, label results        |
| `src/data/robotics.ts`        | One explicitly fictional dataset and reset factory                      |
| `src/lib/persistence.ts`      | Versioned localStorage with schema validation and graceful failure      |
| `src/components/`             | Graph and interactive user interface; derives results from solver state |
| `src/app/`                    | Next.js route, metadata, global styling                                 |
| AI requirement compiler       | Not implemented in Milestone 1; no provider or runtime AI calls         |

The app is local-first, uses no authentication or database, and does not transmit scenario data. Next.js provides the app shell; the solver and state updates run in the browser. The app calls no third-party services at runtime. React Flow's normal attribution is retained.

## Model

One event day, explicit time zone, integer minutes after local midnight. All intervals are half-open `[start,end)`; adjacent tasks do not overlap. Tasks have fixed times, mandatory role slots, fixed expenses in integer cents, resource needs, and finish-to-start dependencies. Every skill and qualification on a role is mandatory. One role slot requires one person for the entire task window. Availability must contain the entire task within one declared window; separated availability windows cannot be pooled. Workload is the sum of assigned task durations, independent of idle time.

Reusable inventory uses the maximum sum of concurrent task demand. Consumables use total demand across all tasks. Inventory is treated as on hand; changing supply quantities does not imply a purchase or add costs. Task expenses are the full modeled cash outlay, independent of role coverage. All mandatory tasks remain budgeted and reserve supplies even when staffing is incomplete. Optional tasks, movable times, travel, overtime preferences, prerequisite certificates beyond stated qualifications, and uncertain turnout are outside the model.

Validation limits: 16 tasks, 24 volunteers, 32 role slots, 30 resource types; strict IDs, nonnegative capacities/costs/inventory, valid positive durations, unique IDs, and known references. Cycles are explicitly rejected by static dependency checks.

## Search and guarantees

For each role slot, precompute volunteers satisfying skills, qualifications, availability, and single-task capacity. Sort slots by smallest candidate domain, then stable ID. Sort volunteers by ID. Depth-first search assigns an eligible volunteer or skips a slot; every branch checks overlap and aggregate workload. Branch-and-bound discards branches unable to beat the best role coverage found. A complete assignment terminates immediately; an exhausted search without one proves staffing infeasibility for the model. Skipping allows a maximum-cardinality partial assignment for explanations when the search completes. The displayed count is exact assigned-role coverage, never a feasibility probability.

Search limit: 200,000 nodes per solve. Statuses:

- `feasible`: complete assignment and all static constraints pass.
- `infeasible`: a static constraint is provably violated, or staffing search exhausts without a complete assignment.
- `unknown`: staffing search hits the node limit without a complete assignment, with no static proof of infeasibility.
- `invalid`: schema validation fails before solving.

`exhaustive` means no node cutoff occurred; a complete witness can stop search early because satisfiability is already established. Unknown partial coverage is a lower bound. Staffing explanations identify deficits in the returned partial assignment, not a unique minimal unsatisfiable core. A full staffing assignment with a resource or budget deficit is still an infeasible project. Worst-case search is exponential; bounded hackathon scenarios are the intended scope. This is not an industrial scheduling optimizer.

## Independent verification

`verifyAssignment` reconstructs and checks role identities, exact coverage, unknown/duplicate assignments, qualifications, availability, overlaps, workload, task costs, dependency timing, and resource demand. It does not import `solve`, `staticIssues`, `resourceDemand`, `available`, `qualified`, or `overlaps`. Its separate resource sweep and direct constraints provide a second path to check feasible certificates. Positive task durations imply a directed dependency cycle necessarily violates at least one finish-to-start edge.

Tests include required examples, invalid inputs, certificate tampering, exact boundary cases, reproducibility, cutoff semantics, and 100 seeded small instances compared with a brute-force enumerator that accepts only certificates passing the independent verifier.

## Intervention contract

Generate single-change candidates from observed uncovered roles or static supply/funding deficits. A volunteer candidate explicitly assumes required skills/qualifications, full event availability, and an event-length workload ceiling. It is marked simulated, never claimed to be a real recruited person. Re-solve each candidate before reporting whether it satisfies all modeled requirements. Resource changes assume on-hand stock; any acquisition expense must be modeled separately.

Results are deterministic, with resolving changes ranked ahead of partial improvements. A successful single change is a one-change repair of this model. The analyzer does **not** guarantee a globally cheapest or globally minimal intervention across all possible edits. Multiple independent deficits can require multiple sequential changes. Exact multi-change repair search is future work.

## Persistence and portability

State is validated on restore and stored only in `catalyst:robotics:v1`. Storage failures leave the current session usable. Reset restores a deep clone of the canonical data. Export packages input, output, and verifier report; an infeasible export intentionally has an invalid full-plan certificate. No secrets are used. A standalone nested Git repository isolates this work from other hackathon projects.
