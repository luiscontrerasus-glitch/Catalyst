# Architecture and solver contract

## Boundaries

| Module                                                  | Responsibility                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `src/engine/model.ts`                                   | Zod schemas, typed finite model, stable role slot identities                                            |
| `src/engine/solver.ts`                                  | Static constraints and deterministic bounded exact CSP search                                           |
| `src/engine/verify.ts`                                  | Independent assignment certificate validation; no search helpers                                        |
| `src/engine/interventions.ts`                           | Construct explicit hypothetical changes, re-solve, label results                                        |
| `src/data/robotics.ts`, `src/data/scenarios.ts`         | Three explicitly fictional datasets using one mathematical model                                        |
| `src/lib/persistence.ts`                                | Versioned localStorage with schema validation and graceful failure                                      |
| `src/components/`                                       | Graph and interactive user interface; derives results from solver state                                 |
| `src/app/`                                              | Next.js route, metadata, global styling                                                                 |
| `src/ai/schema.ts`, `compiler.ts`, `provider.server.ts` | Untrusted suggestion schema, validation/conversion, sanitized failures, server-only official Gemini SDK |
| `src/app/api/compile/route.ts`                          | Configuration status, same-origin POST, body/rate limits, provider boundary                             |
| `src/lib/projects.ts`                                   | Draft approval gate, normalized identifiers, reference-safe item removal                                |
| `src/components/project-editor.tsx`                     | Progressive, editable draft separate from approved solver inputs                                        |

The app is local-first and uses no authentication or database. Next.js provides the app shell and optional server-side AI endpoint; the solver and state updates run in the browser. Only an explicitly submitted natural-language brief is sent to Google when drafting is configured and requested. Manual planning and scenario analysis make no provider calls. React Flow's normal attribution is retained. Milestone 1's solver and verifier implementation are unchanged.

## Model

One event day, explicit time zone, integer minutes after local midnight. All intervals are half-open `[start,end)`; adjacent tasks do not overlap. Tasks have fixed times, mandatory role slots, fixed expenses in integer cents, resource needs, and finish-to-start dependencies. Every skill and qualification on a role is mandatory. One role slot requires one person for the entire task window. Availability must contain the entire task within one declared window; separated availability windows cannot be pooled. Workload is the sum of assigned task durations, independent of idle time.

Reusable inventory uses the maximum sum of concurrent task demand. Consumables use total demand across all tasks. Entered inventory is treated as already available. Task expenses are the full modeled cash outlay, independent of role coverage. All active tasks remain budgeted and reserve supplies even when staffing is incomplete. An optional flag permits an explicit scope intervention to drop a leaf task; it does not silently waive any current requirement. Movable times, travel, overtime preferences, unstated qualifications, and uncertain turnout remain outside the model. Date and time-zone validity are checked. Planning notes and simulated availability labels carry provenance, not additional mathematical constraints.

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

Generate candidates for qualified volunteer additions, explicit availability extensions, supply inventory, funding, and optional leaf-task scope reduction. Every candidate applies to a deep clone, calls the same solver, and passes through the independent full-plan verifier. A verified repair requires both a feasible solve and a valid certificate. Other outcomes are promising/incomplete (coverage or issue count improves), search-incomplete, or still blocked. Remaining bottlenecks are returned and displayed. Reassignment within capabilities is performed by every solve.

The original `analyzeInterventions` API defaults to singles for backward compatibility with the original 35 tests. The Milestone 2 UI explicitly enables combinations: up to 12 singles, all compatible pairs among the first six, and a funding addition for each of the first 27 candidates whose procurement cost creates a budget gap. The candidate space is deterministic and bounded, not exhaustive over all possible edits; no globally minimal/cheapest result is claimed.

Rank outcome first (verified, promising, unknown, blocked), then ascending score: `100 × changes + 2 × added known dollars + added assigned minutes / 10 + 5 × disrupted commitments + 50 if supply cost is unknown`. Ties use stable IDs. A commitment is volunteer + task + role, ignoring interchangeable slot indices. Known additional inventory cost is added to the first task's expenses before re-solving; it is also displayed in the preview. Unknown acquisition costs remain explicitly unpriced. Funding is a limit change, not a spending expense. Availability and new volunteer commitments are hypothetical; no real person is recruited. Workload impact measures added assigned minutes, not promised availability.

## AI and approval boundary

The official `@google/genai` SDK is imported only by a `server-only` module. Default `gemini-3.5-flash-lite` model and structured-output support were verified against official documentation; an environment override is available. Credentials are server-side `GEMINI_API_KEY` or `GOOGLE_API_KEY`, never public environment values. Requests use schema-constrained JSON, 6,000 output tokens, no retries/automatic continuation, a 40-second timeout, no provider-side interaction storage, and no external tools. `/api/compile` limits brief/body size, rejects mismatched browser origins, and allows five attempts/minute/process. This local limiter is not a production multi-tenant abuse-control system.

Strict Zod output validation rejects extra authoritative fields, invalid times/counts, duplicate/unknown task or resource references, and unsupported evidence quotes. A quote appearing in the brief does not prove the extracted statement's semantics. Suggested tasks/costs/qualifications remain untrusted until human review. Conversion produces an editor draft with no volunteers and zero inventory, preserves the human-entered budget/date/audience, and retains assumptions/questions. No feasibility analysis occurs on a raw proposal. Approval validates the full project schema and requires explicit confirmation before saving/analyzing. Users can approve an intentionally infeasible model to study bottlenecks. Static conflicts are surfaced during review.

Provider failures are mapped to safe public error codes; raw provider errors are neither returned nor logged. Missing keys preserve manual creation. Unit tests use explicit provider doubles. No successful live provider request is claimed without a configured credential and observed response.

## Persistence and portability

`catalyst:workspace:v2` stores up to 30 validated approved projects, active ID, and independent reset baselines. A valid Milestone 1 robotics record migrates from `catalyst:robotics:v1`. A pure reducer handles switching, experiments, approval, and reset; `useSyncExternalStore` connects it to React without cascading mount effects. Storage failures retain a usable in-memory session with an honest status. Reset restores only the active project's latest approved baseline. Unapproved editor drafts never enter the persisted solver model. Comparison history starts a new session baseline after reload, rather than inventing prior experiment history.

Export includes current input, result, planning notes, and verifier report; an infeasible export intentionally fails full-plan verification. API secrets are never part of the project model/export. This standalone nested Git repository preserves checkpoint history and isolates work from other hackathon projects. Durable sharing, room permissions, import/backup, cross-device synchronization, larger-model workers, and deeper repair search are Milestone 3 work.
