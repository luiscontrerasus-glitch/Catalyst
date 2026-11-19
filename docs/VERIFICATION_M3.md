# Milestone 3 verification — November 19, 2026

This record separates implemented behavior, automated evidence and actual browser observations. Milestone 3 is **not fully release-verified**: independent-browser/mobile UI and live Gemini checks remain pending. No public hosting, GitHub push, video publication or Devpost submission has occurred.

## Completed checks

| Check                                                              | Actual result                                                                                                               |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint`                                                     | Pass, zero warnings                                                                                                         |
| `npm run typecheck`                                                | Pass                                                                                                                        |
| `npm test`                                                         | **122/122**, eight files                                                                                                    |
| `npm run build`                                                    | Pass, Next.js 16.4.6 Webpack production build                                                                               |
| Original engine/tests                                              | Solver, verifier, interventions and all original 100 Milestone 2 tests unchanged relative to `0952c54`                      |
| `npm run evaluate`                                                 | 19/19 defined outcomes; 200/200 additional seeded oracle comparisons                                                        |
| Feasible witnesses/returned repairs                                | All independently verified                                                                                                  |
| Repairable fixture success                                         | 11/12 in the defined bounded candidate set                                                                                  |
| `npm run evaluate:rooms` against development and production server | 19/19 actual HTTP checks with independent cookie sessions; latest artifact records production mode                          |
| Production HTTP smoke                                              | Home 200, direct demo anchor present; compile POST 503 with sanitized `unavailable` missing-key response                    |
| Database reopen                                                    | Real file-backed SQLite test retains project, roles, session authorization, revision and activity after client close/reopen |
| Invite/session expiry                                              | Expired invite and expired session denied; valid existing session survives invite expiry/rotation                           |

Automated room coverage includes HttpOnly room-path cookies, private/no-store views, unauthenticated read denial including ETag requests, joins, contribution ownership, recomputation, shared activity, organizer-only replacement/rotation, CAS stale-write rejection, concurrent same-revision writes, exact retry deduplication, request-ID misuse, cross-room token rejection, token digests, malformed input, limits, sanitized errors, and configured production origin checks. Persistence tests use the real libSQL implementation, not a mocked database. Route tests substitute the store's runtime wiring with a real in-memory SQLite client; they do not stand in for hosted-network testing.

The actual-server evaluation creates fictional test rooms in ignored local storage. It does not record room IDs, invitations, cookies or database credentials in the artifact. It is an HTTP/API test, **not** an independent-browser UI test. See [rooms JSON](evaluations/rooms-latest.json).

## Actual browser observations and defect correction

The in-app browser loaded the current desktop app and exposed the robotics summary above the graph: 7/8 role slots, “Add 1 robotics instructor,” independently verified repair, and Preview this change. Try the live demo links directly to that summary. The existing local projects remained visible.

Creating a room initially failed with a same-origin error. Browser network metadata showed a genuine `http://127.0.0.1:3100` Origin and Host while Next constructed an internal localhost URL. The corrected helper validates against the actual target Host locally, or a pinned `APP_ORIGIN` in production; forwarded headers cannot authorize it. Browser retesting successfully created a durable room and showed Organizer, revision 1, the 7/8 model, real local storage status, contribution controls, activity, and invitation controls. The same helper now protects the Gemini endpoint's matching-origin case, with a new regression test.

The attempted second browser was native Brave. Computer Use first encountered its minimized window, then stopped because it could not determine Brave's current URL confidently enough to enforce browser policy. UI automation ended at that point and was not bypassed. **No guest join/contribution was observed in Brave, no two-browser sync is claimed, and no Milestone 3 mobile review was completed.** No new screenshot set was captured. Historical Milestone 1/2 screenshots remain labeled historical.

Milestone 2 had completed desktop/mobile robotics and fresh custom-project flows, documented in [historical verification](VERIFICATION.md). Changes to the summary, graph and room UI require fresh review; historical success is not counted as a current Milestone 3 pass.

## Gemini status

The project has no `.env.local` Gemini credential and no accepted process credential was configured. Installed official SDK 3.6.1 and default `gemini-3.5-flash-lite` were checked against the official registry/docs during this work. `npm run evaluate:ai` records **zero provider calls and zero successful live requests**. The real production HTTP endpoint returns 503/unavailable, keeping manual planning intact. Mocked provider tests remain explicitly labeled mocks.

To enable the remaining gate: copy `.env.example` to Catalyst's `.env.local`, set server-only `GEMINI_API_KEY`, restart, then run `npm run evaluate:ai`. Do not paste the key in chat or use `NEXT_PUBLIC_`. Review real extracted claims, quotes, questions, assumptions and approval before recording an AI demonstration. See [AI artifact](evaluations/ai-latest.json).

## Evaluation interpretation

The current run measured small-fixture median solve times of 0.078–0.362 ms on the recorded Windows/Node/Ryzen machine, with one warm-up and 25 repetitions per fixture. Timing and separate intervention costs are in [full JSON](evaluations/solver-latest.json); [readable results](evaluations/solver-latest.md) specify categories and the baseline.

The greedy baseline fails to find the specialist-ordering solution that exact search finds; it never proves infeasibility. Repair search misses the simultaneous two-identical-volunteer fixture because it generates one candidate per skill profile. All 11 found repairs are genuine verified witnesses. This is not a general 91.7% success probability, global-minimum proof, independent formal proof or scalability benchmark.

## Remaining release gates and limitations

1. Restore browser control in a subsequent turn; verify organizer and contributor in truly separate browser sessions, contribution/polling/reload, stale open drafts, invitation replacement, reconnect, and contributor permissions. Review current desktop/mobile robotics and a completely new custom project; save fresh screenshots without secrets.
2. Configure Gemini and inspect real provider successes/errors. AI schema tests do not establish semantic correctness of unseen provider output.
3. Configure managed Turso credentials for a separately approved hosted rehearsal. Remote transaction semantics, HTTPS/proxy cookies and multi-instance persistence are unverified. Local storage is real and durable; it is not public cross-device hosting.
4. Docker/Compose configuration is prepared but container build/run has not been verified. Native Windows production build and local production HTTP checks passed.
5. Prototype limits: no account-based organizer recovery, explicit member revocation, room deletion/retention UI, distributed abuse controls, or production access audit. Invite rotation blocks new joins only. Keep demo data fictional and low sensitivity.

Prepared submission files: [deployment](DEPLOYMENT.md), [architecture/math](ARCHITECTURE.md), [AI disclosure](AI_DISCLOSURE.md), [demo script](submission/DEMO_SCRIPT.md), [Devpost draft](submission/DEVPOST.md), and [checklist](submission/CHECKLIST.md). The stable single-user workflow is retained as the demonstration fallback until room UI verification is complete. Owner approval is still required before public deployment, pushing or submission.
