# Milestone 2 verification

Verified November 18, 2026, America/New_York. Environment: Node.js 24.14.1, npm 11.11.0, Next.js 16.4.6, TypeScript 5.9.3, Vitest 4.1.12. Google GenAI SDK: 3.6.1. Exact dependency graph is recorded in the lockfile. [Milestone 1 evidence](VERIFICATION_M1.md) is retained.

## Automated checks

| Command             | Result                                                              |
| ------------------- | ------------------------------------------------------------------- |
| `npm run lint`      | Passed; zero warnings/errors                                        |
| `npm run typecheck` | Passed                                                              |
| `npm test`          | 100 tests passed across four files                                  |
| `npm run build`     | Passed; optimized production output using supported Webpack bundler |

All original 35 solver tests are unchanged and still pass. The original oracle test additionally compares 100 seeded small CSPs against independently verified exhaustive enumeration. New tests cover custom validation/approval/editing, normalized skills, reference-safe removals, generic dependency layout, three scenario outcomes, isolated switching/reset baselines, persistence/migration/corruption/failure, strict AI JSON and field boundaries, missing/invalid output, mocked provider failures and redaction, HTTP origin/size/rate limits, procurement costs/funding bundles, optional scope, independent repair verification, and disruption ranking that treats identical role slots as interchangeable.

Provider tests use explicit test doubles. They do not make or demonstrate live Gemini requests, and their fixture responses are not shipped as product behavior.

## Production browser tests

Exercised the actual `npm start` production app at `http://127.0.0.1:3100`, including a 1365 × 900 desktop breakpoint and a 390 × 844 mobile breakpoint. Restored the normal browser viewport afterward.

- **Custom creation:** used the guided editor to create the explicitly fictional QA project “Neighborhood reading circle · QA,” entering budget, audience, a task, two qualified reading roles, one volunteer with explicit skills/qualification/window/capacity, and books with stock and per-task demand. Approval produced an actual 1/2-role staffing deficit.
- **Preview isolation:** a proposed facilitator showed verified 2/2 coverage while the current project remained 1/2. Applying produced a feasible assignment. Later editing the requirement to three facilitators changed the real result to 2/3. Canceling another preview preserved 2/3; applying it produced independently verified 3/3. Preview scoring correctly reported zero disrupted commitments for interchangeable role indices.
- **Editing/removal:** added a task and dependency, removed that task, changed the required people count, reviewed, and approved; the solver reflected the new count with intact remaining references. No draft changed the analyzed project before approval.
- **Robotics:** retains the original missing-instructor model and real solver; original tests verify instructor repair and assistant withdrawal. Its new preview/apply flow was checked in the running final app.
- **Cleanup:** initially 4/5 roles covered plus two missing grabbers. Preview proposed the combined stock increase and Priya availability extension, showed $20 additional modeled procurement expense, and independently verified 5/5. Applying worked. Switching away/back retained the experiment; reset restored both original deficits.
- **Donation drive:** initially 4/4 feasible. Withdrawing Taylor produced 3/4 and a qualified-driver deficit. Reset restored 4/4. Candidate generation and verification are also covered in tests.
- **Fresh mobile creation:** created the explicitly fictional “Mobile volunteer meetup · QA.” Review correctly prevented approval without a task. Added a one-hour welcome task, approved with an empty roster, and observed a 0/1 deficit. Preview/apply of a welcome host produced a verified 1/1 plan.
- **Mobile persistence/reset:** reload restored the mobile project's feasible 1/1 scenario. Reset returned to its approved empty-roster 0/1 baseline. Project switching preserved other projects.
- **Usability:** editor body scroll resets between steps; approval scrolls the resulting workspace into view; the mobile editor and preview fit without horizontal overflow. Dialogs support keyboard focus containment and Escape, and reduced-motion preferences are respected. This is functional accessibility verification, not a complete WCAG audit.
- **Console:** no browser warning/error entries observed in the exercised final flows.

Two clearly named fictional QA projects were created in local browser storage to verify manual creation. No real users, commitments, or community impact are claimed. Their data is local to that browser; reset baselines and fictional scenario inputs remain distinct.

## AI integration status

The real local `GET /api/compile` returned `configured: false`, provider Google Gemini, model `gemini-3.5-flash-lite`. The real local POST returned HTTP 503 with code `unavailable`, an actionable server-configuration message, and no fabricated plan. The browser disabled live drafting with an explicit unavailable state while preserving manual creation.

No Gemini API key was configured in this project's environment or `.env.local`. **No successful live provider call was made or claimed.** The official SDK integration and its request parameters compile against the installed SDK types. Schema validation, the HTTP boundary, conversion, and sanitized errors are exercised in isolated tests. Actual provider enforcement of request parameters, real account/model access, live output quality, and quotas remain to be verified when credentials are supplied. This is the only missing prerequisite for testing the requested live-AI judge flow.

## Screenshots

- [Desktop custom-project intervention preview](screenshots/milestone-2/custom-preview.jpg)
- [Mobile guided creation and honest missing-key state](screenshots/milestone-2/mobile-create.jpg)
- [Mobile verified repair preview](screenshots/milestone-2/mobile-preview.jpg)
- [Custom project workspace](screenshots/milestone-2/custom-workspace.jpg)
- [Cleanup counterfactual candidates](screenshots/milestone-2/cleanup-lab.jpg)

## Limits and next milestone

Local browser persistence, one-day fixed-time models, 200,000-node solve cutoff, bounded candidate combinations, unknown acquisition-cost assumptions, 30 saved-project limit, and single-process API rate limiting are documented limitations. No globally optimal/minimal repair is claimed. Shared rooms, durable storage, import/backup, larger-model execution/benchmarking, a fuller accessibility audit, deployment, and submission assets remain Milestone 3 work. Live Gemini output evaluation should begin once a key is configured.

All changes are confined to Catalyst. Local checkpoint commits preserve the original implementation. No GitHub push, public deployment, Devpost submission, or organizer contact was performed. Temporary QA servers are stopped after verification; use README launch commands to run locally.
