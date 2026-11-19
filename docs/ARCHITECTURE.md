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

The app remains local-first. Next.js provides the shell, optional server-side AI endpoint and shared-room APIs; the solver runs in the browser. Local plans use browser storage; shared rooms use session authorization and SQLite/libSQL. Only an explicitly submitted natural-language brief is sent to Google when drafting is configured and requested. Manual planning and scenario analysis make no provider calls. React Flow's normal attribution is retained. Milestone 1's solver and verifier implementation are unchanged.

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

Export includes current input, result, planning notes, and verifier report; an infeasible export intentionally fails full-plan verification. API secrets are never part of the project model/export. This standalone nested Git repository preserves checkpoint history and isolates work from other hackathon projects. Import/backup UI, larger-model workers and deeper repeated-contribution repair search remain future work.

## Shared-room state and permissions

`src/rooms/model.ts` validates narrow operations. `store.ts` owns SQL-bound queries, transactions, authorization and revisions. `runtime.server.ts` selects ignored local `data/catalyst.db` or managed Turso configuration. `http.server.ts` validates origins, JSON/body limits, cookies and sanitized errors. Route handlers expose create, join, authenticated read and authenticated mutation; no browser receives database credentials. `shared-room.tsx` renders the derived solver/verifier output from each received project revision.

Rooms store a validated JSON project, monotonically increasing revision, hashed invitation and expiry. Sessions store a hashed 256-bit token, member identity, display name, role and expiry. Room IDs are 96-bit random values but IDs alone confer no access. Invitation tokens are also 256-bit random values. The creation/join response sets a room-specific HttpOnly, SameSite Strict cookie; HTTPS production origin adds Secure. The owner receives a contributor invitation separately. Invite URL fragments avoid sending the invitation to the room-page server request and are removed after opening. Session storage retains an organizer's invitation for copying in that tab; only hashes are in the database.

A write transaction authenticates the session, checks a member-scoped request ID/action fingerprint for an exact retry, validates the expected revision, checks action permissions, validates the resulting project, then conditionally updates the old revision and writes activity plus the deduplication record atomically. Concurrent stale writers get 409. A valid retry returns the latest view without applying the action twice. Reusing an ID for a different action fails. The UI captures the revision when a draft opens and preserves a rejected draft for review, rather than silently rebasing an old replacement.

Contributors can upsert/withdraw only their own generated volunteer ID and add existing supply types. They cannot alter other volunteer profiles, task requirements, budget or invitation. Organizer replacement can change the approved model; it is deliberately privileged. Membership is not volunteered availability. Qualifications are self-declarations. Invitation rotation blocks future joins with the old token, not existing sessions; organizer loss/recovery and explicit member revocation are not implemented. Sessions expire after 30 days and invitations after seven days. The read view returns the latest 50 activity records; old records are not automatically purged.

Polling occurs every two seconds and on focus. Authorized matching ETags return 304; authorization is checked before that shortcut. Late responses cannot regress a newer client revision. This is polling, not websocket realtime. Shared server state is authoritative for project inputs; each browser derives its result using the same deterministic solver. Remote managed-backend behavior and independent-browser UI synchronization require further verification; separate real database/HTTP session tests are not presented as browser evidence.

Local SQLite requires a persistent single-server volume. Managed libSQL supports the same transaction interface but is not exercised here without credentials. `REQUIRE_MANAGED_ROOMS=true` prevents accidental file fallback on ephemeral hosting. `APP_ORIGIN` pins the public origin behind a proxy. Same-origin request validation uses the actual Host for local Next internal-URL differences and ignores forwarded-header authorization claims. Limits are process-local; there is no production-grade distributed abuse-control service.

## Milestone 3 evaluation methodology

`src/evaluation/fixtures.ts` defines 19 fictional cases covering schedule overlap, qualifications, budget, dependencies, withdrawals, inventory, workload, alternative assignments, compounded repairs and impossible cycles. Expected outcomes are explicit. The first-fit baseline considers roles in input order and reports only a verified complete witness as feasible; failure is `no_solution_found`, never an infeasibility proof.

`scripts/evaluate.ts` warms each solver fixture once and times 25 repetitions using `performance.now()`, recording median and nearest-rank p95, node counts and separate intervention generation times. Every returned feasible witness and reported resolving repair is independently checked. An additional 200 seeded small cases (seed 42023) compare satisfiability with full witness enumeration using only the independent checker. The original seeded oracle test remains unchanged too. This oracle still shares model definitions and the verifier, so it is evidence of implementation consistency rather than an independent formal proof.

Actual results after the final regression fix: 19/19 outcomes, 200/200 additional oracle comparisons, all feasible certificates/returned repairs verified, and 12/12 defined repairable fixtures with a found verified repair. Combination mode now permits two distinct hypothetical volunteers per capability profile and checks the combined 24-volunteer cap before testing a pair. The original solver and verifier are unchanged; all original tests remain unchanged. Three identical new volunteers in a single bundle remain outside the candidate space. No global optimality, generalized success rate or production scalability is inferred. Full JSON includes environment and timings.

Provider-side constrained decoding uses a structurally equivalent reduced grammar: typed required fields, enums, simple identifier patterns and strict object shapes remain, while numeric and array bounds are enforced only by the full application validator. This avoids the live provider's schema state explosion without weakening acceptance checks. The provider's default temperature is used; the model does not support a custom temperature. The final live evaluation and production UI approval flow are recorded separately from mocked failure tests. See [final verification](FINAL_VERIFICATION.md).
