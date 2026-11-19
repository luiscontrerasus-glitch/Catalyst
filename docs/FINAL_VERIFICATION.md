# Final verification — November 19, 2026

Scope: continue `62963a3` / `c700cfc`, stabilize the product, verify real Gemini and production behavior, and prepare locally. The owner confirmed hosting is **not configured**. No push, public deployment, video publication or submission is authorized or performed.

## Current assessment

The local production demonstration now includes real AI drafting through explicit approval to deterministic analysis, desktop/mobile robotics and a new custom plan, plus **genuine independent-browser collaboration** between a native Brave contributor and an in-app-browser organizer. Joining, volunteer/supply contributions, synchronization, permissions, concurrent edits and reload persistence were observed. **Full competition/public-production readiness is not claimed:** the invitation regression is closed, while managed hosting, HTTPS/proxy behavior and container execution remain unverified.

## Production preparation from 5462920

The same-page invitation browser regression is closed. The rebuilt production server retains room revision 3, organizer authorization and the contributed availability after restart, with independently verified 8/8 feasibility. The contributor remains distinct. Its mobile viewport measured 390 pixels, with no document horizontal overflow; the temporary override was reset. See [release screenshots](screenshots/release/).

Prepared Vercel Node 24 configuration, mandatory managed storage and pinned HTTPS origin on Vercel, remote HTTP client selection, atomic additive schema initialization with a version ledger, secret-safe preflight/migration scripts, and database-backed AI/write quotas. Tests exercise concurrent quota consumption across two database clients, reopen persistence, byte-bounded AI input, missing origins and safe quota-storage failure. A generic route error boundary provides retry/workspace navigation without rendering raw errors; its build is verified, but a deliberate browser crash was not induced.

Local gates: **143 tests / 15 files**, preserving all original 100 tests and the original solver/verifier; lint, typecheck, production build, and final production-server room evaluation **19/19** pass. The secret scan covers tracked and pending source, 33 browser artifacts and Git history; no matches or forbidden tracked paths. No new Gemini requests were made in this continuation: the existing exact model and four accepted/nine unsuccessful attempts below remain the ledger.

Expected blockers: `check:production` detects Node 24 and the Gemini key but fails for the absent managed database and public HTTPS origin. `db:migrate` safely refuses missing managed credentials; no remote database was contacted or provisioned. Migrations and quota persistence pass against real local SQLite clients. Remote HTTP transactions, Vercel execution, HTTPS and multi-instance behavior remain unverified. Docker execution remains blocked by the unavailable daemon; Docker is not required for the chosen target.

Follow [the exact Vercel/Turso handoff](VERCEL_HANDOFF.md). No public GitHub remote, hosted account or public origin is configured. No publication, paid provisioning or submission occurred. This is ready for an approved hosted rehearsal, not completed production sign-off.

## Live Gemini: actual calls and fixes

Key detection printed only a configured boolean. Tested provider: Google Gemini, exact model `gemini-3.5-flash-lite`, official `@google/genai` **3.6.1**, Interactions API, no automatic retries/continuation, `store:false`, 40-second request timeout and 6,000 output tokens. The model's default temperature is used.

Thirteen actual application-level calls were observed during this verification session:

| Phase                                                                    | Accepted proposals |                                          Unsuccessful attempts |
| ------------------------------------------------------------------------ | -----------------: | -------------------------------------------------------------: |
| Original evaluation plus scrubbed diagnostics                            |                  0 |                                              5 provider errors |
| Reduced grammar evaluation plus validator diagnosis                      |                  0 | 2 provider errors, 2 returned responses rejected by validation |
| Final evaluation: detailed robotics, partial cleanup, ambiguous donation |                  3 |                                                              0 |
| Production-browser online reading circle                                 |                  1 |                                                              0 |
| **Total**                                                                |              **4** |                                                          **9** |

The original constrained-decoding schema exceeded Gemini's serving state limit (observed HTTP 400). [Google documents this complexity limit](https://aistudio.google.com/docs/structured-output#simplifying-complex-schemas). The provider grammar now keeps types, required fields, strict object shapes, enums and simple identifier patterns, while numeric/array bounds remain enforced by the full application Zod schema. Removing identifier patterns initially let actual qualification strings fail strict validation; restoring simple patterns and explicit identifier guidance resolved that issue. There is no automatic acceptance of invalid output.

Artifacts: [call ledger](evaluations/ai-call-ledger.json), [final real proposals](evaluations/ai-latest.json), [initial failures](evaluations/ai-initial-schema-failures.json), [intermediate outcomes](evaluations/ai-schema-reduction-attempt.json). Calls that returned invalid output are not counted as accepted proposals. Raw keys, raw provider errors and private participant information are not stored in these artifacts.

All three final evaluation proposals retained assumptions/questions, blocked conversion without explicit approval, and created no available volunteers or owned inventory. Their approved models were infeasible without commitments, which is the expected honest result. Some questions repeated date/budget/audience facts already in the brief; schema success does not establish semantic completeness. Human review remains required.

Actual browser path: fictional online reading-circle brief → real proposal, clearly unapproved → copy into editable draft → review button disabled before confirmation → explicit approval → 0/1 staffing gap → add a fictional reading-skilled volunteer and review the date/notes → approve → independently verified 1/1. The custom plan was edited and reapproved on mobile, then survived reload. A native keyboard event was required to commit automated date/time control input; the final displayed date was November 21 and the final contributed window was 10:30–12:00.

Real schema errors and real invalid output were observed. Missing-key behavior was verified at the earlier checkpoint; malformed outputs, credentials, timeout and rate-limit branches also have explicit mocked unit coverage. Those mocks are not described as induced live provider failures. Manual creation remains available without AI.

## Actual browser and room evidence

Production runs with `NODE_ENV=production` and pinned `APP_ORIGIN=http://127.0.0.1:3100`, loading the ignored local credential. Desktop viewport was the browser default; mobile was 390×844 and the temporary override was reset.

Observed in the in-app browser:

- Landing → Try the live demo → 7/8 robotics bottleneck → verified 8/8 preview in three interactions. Applying and resetting the hypothetical repair worked.
- Fresh AI-assisted custom project, empty roster gap, explicit fictional volunteer, independently checked solution, mobile edit/reapproval and reload persistence.
- Organizer creates a genuine room; the same room and organizer authorization survive a production server stop/build/restart.
- Mobile room contribution declares robotics skills, qualification, 10:30–12:00 availability and 90-minute capacity. Saving advances revision 1→2 and changes the model to verified 8/8; reload retains it.
- A second in-app tab receives the same model. These two tabs share one organizer cookie session and **do not count as two independent browser sessions**.
- With an organizer draft open at revision 2, the other tab contributes two kits at revision 3. Approving the old draft is rejected with its draft preserved and an actionable error; the original project title and new inventory remain.
- Withdrawing the organizer's own volunteer contribution advances revision 4 and both tabs automatically return to 7/8, with activity visible.
- Offline emulation disables contribution buttons and labels the last received revision. The other tab contributes another kit; restoring normal networking catches up to revision 5. Temporary network overrides are removed.

After the owner unlocked Windows and paused manual input, native Brave was tested through the dedicated Windows computer-use API. The in-app browser and Brave had separate cookie sessions: the bare room URL in Brave first showed an invitation-required screen while the in-app organizer remained authorized. The private invitation was copied through the visible field without printing or saving its token. Joining with fictional display name Avery created contributor membership at revision 7. The invitation fragment was removed from the address bar.

Avery entered robotics skill, the fictional `robotics_instruction` qualification, reviewed full-event availability (09:00–13:15) and a 90-minute workload limit. Saving advanced to revision 8 and **both independent browsers displayed an independently verified 8/8 plan**, with participant-specific activity. Avery then donated one robotics kit at revision 9 while the organizer had an older requirements draft open. The organizer's stale approval failed visibly; the new supply contribution and approved project were preserved. Both browsers retained their distinct roles and plan after reload.

Role behavior was also observed in the actual UI: Brave had no requirements editor or invitation controls. The organizer temporarily set the budget to zero from a 390×844 mobile viewport at revision 10; Brave synchronized the new budget shortage. Avery could preview the funding repair, but its apply button was disabled with “Only the organizer can apply this repair.” The organizer restored the $400 budget at revision 11, and both browsers returned to the verified feasible plan. Matching organizer/contributor screenshots show revision 11; the temporary native fullscreen mode was restored after saving screenshots that exclude private browser chrome.

The test exposed a navigation edge case: pasting an invitation while already on that same room's bare URL changed only the fragment and did not open the join gate until a manual reload. The client now listens for an invitation hash change and reloads the room so the existing validated join path runs; the token stays in the fragment, and ordinary anchors do not trigger this reload. The patched production build, lint, tests and typecheck pass. The final regression now passes in the in-app browser with cookie-isolated loopback origins: a bare room denied access; same-page invitation navigation caused an actual document reload; the join form appeared without manual refresh; and the token fragment disappeared. A fictional contributor joined and saved availability, both roles reached verified 8/8, and only the organizer displayed the requirements editor. These two origins supplement the earlier independent Brave evidence; they are not described as independent browser applications. The independent collaboration results above were completed before that stop and do not rely on HTTP-only tests.

Observed message defects were fixed: stale offline warnings clear after reconnection, old success notices clear when a new contribution dialog opens, and old preview errors clear when opening a fresh preview. Stale writes still preserve drafts. Invitation-rotation retry handling now clears an obsolete copied link if a lost response cannot recover the newly generated secret; a fresh link can be generated.

Fresh screenshots in [the Milestone 3 folder](screenshots/milestone-3/) now also include `two-browser-organizer.jpg`, `two-browser-contributor.jpg`, `two-browser-stale-draft.jpg`, `two-browser-contributor-permissions.jpg` and `two-browser-mobile-organizer.jpg`. They show actual independent-browser results. Existing images cover landing, robotics preview, real Gemini output, approved custom plan, mobile forms and reconnect. No invitation, session cookie, API key or unrelated user page appears in the saved images.

## Engine and security review

The known two-identical-volunteer repair limitation is fixed within the existing bounded candidate approach. Combination mode permits up to two distinct candidates per capability profile, assigns unique IDs/display names, and excludes pairs exceeding the 24-volunteer cap. The original solver, verifier and all original 100 tests are unchanged. Three identical new volunteers in a single bundle remain outside the candidate space; no global minimum is claimed.

Latest reproducible outcomes: **19/19 fixtures**, **200/200 additional seeded oracle matches**, **12/12 defined repairable fixtures** with found verified repairs. Every returned feasible witness and resolving repair passes independent checking. First-fit greedy misses the specialist-ordering witness found by exact search; its failure is not an infeasibility proof. Timing is machine-specific; see [results](evaluations/solver-latest.md) and [JSON](evaluations/solver-latest.json).

Room controls reviewed: random bearer invitations and separate random session secrets; digest-only storage; room-specific HttpOnly/SameSite Strict cookies; Secure attribute for pinned HTTPS origins; authenticated private/no-store reads; same-origin writes; explicit organizer permissions; participant-owned volunteer IDs; transactional expected revisions and idempotent request IDs. Existing tests cover role escalation denial, cross-room token denial, stale/concurrent writes, expiry and invitation replacement. Actual guest UI restrictions and concurrent contribution behavior were verified separately in Brave as described above.

Member revocation and account-based organizer recovery are deliberately not added at deadline. UI and documentation explicitly state that replaced invitations prevent future joins but existing sessions may retain access for up to 30 days, and losing the organizer browser session has no account recovery. Use fictional low-sensitivity data; this is not an audited identity/credential service.

The configured API-key value was absent from all scanned production browser artifacts and tracked files; only counts were printed. Source uses a `server-only` provider and requests go through the app API, not a browser-to-Google call carrying the key. Current `npm audit --omit=dev` reports zero advisories; this is not a complete security certification. [Secret-scan counts](evaluations/security-latest.json) and the audit's public metadata are recorded alongside the evaluations.

## Quality gates and deployment blockers

- Lint: pass, zero warnings. Typecheck: pass. **143 tests pass** across 15 files.
- Next.js 16.4.6 Webpack production build: pass. A sandbox permission failure during an earlier prerender was resolved by an authorized build outside the sandbox.
- Local production room HTTP evaluation: 19/19 checks with independent cookie sessions at the initial checkpoint; rerun against the final build is recorded in `rooms-latest.json`.
- Actual SQLite close/reopen and production-server restart retain room data/session authorization. Managed-required configuration fails closed when credentials are missing.
- Docker Compose validates. Dockerfile's copy of a nonexistent `public` directory was removed. The Docker Linux engine is unavailable, so no container build/run success is claimed.
- Hosting, Turso URL/token, a public HTTPS origin, remote database transactions and multi-instance behavior are unconfigured/unverified. Owner instruction is to prepare locally. Deployment remains blocked until a target is chosen and approved for a hosted rehearsal.
- Managed deployments now use atomic fixed-window database quotas: five AI attempts/minute and 120 room writes/minute across the deployment. Cross-client concurrent consumption and reopen persistence pass locally. Hosted behavior, read-abuse protection and spending controls still require approved setup.

## Skeptical judge assessment

The local first-minute path makes the contribution-first innovation visible: explain a specific conflict, preview a small repair, and inspect a verified assignment. Mobile graph text is readable through pan/zoom plus the task selector; the complete graph intentionally does not fit as tiny unreadable labels. Proposal assumptions, fictional commitments and model-only feasibility are visible. There are no claimed real users or measured community outcomes.

Independent contributor-browser evidence is now available. The remaining technical gate is actual hosted operation. Use the verified local planning/AI/room demonstration while preparing an approved hosted rehearsal. Public repository, hosting and Devpost publication remain subject to approval, and human eligibility/contribution/rules review is still required. See the [submission checklist](submission/CHECKLIST.md).
