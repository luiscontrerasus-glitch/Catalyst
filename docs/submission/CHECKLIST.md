# Release and submission checklist — November 21, 2026

Deadline **today at 11:59 PM EST**, rechecked against [official rules](https://stem2connect-online-hackathon.devpost.com/rules) and [event page](https://stem2connect-online-hackathon.devpost.com/). Full evidence: [production verification](../PRODUCTION_VERIFICATION.md). No Devpost submission has occurred.

## Engineering and publication

- [x] Original engine and all original 100 tests preserved; 143 tests / 15 files pass. Lint, typecheck and cloud production build pass.
- [x] Solver benchmark: 19/19 outcomes, 200/200 additional oracle matches, 12/12 defined repairable fixtures. Bounded-search limits disclosed.
- [x] Approved public GitHub: https://github.com/luiscontrerasus-glitch/Catalyst.
- [x] Approved Vercel Hobby/Turso Free app: https://catalyst-luiscontrerasus-glitch.vercel.app. No billing or paid upgrade enabled.
- [x] Node 24, all six sensitive Production-only variables, exact HTTPS `APP_ORIGIN`, fail-closed managed storage and schema-v2 remote migration verified.
- [x] Managed DB integration 10/10 and hosted room API 19/19. Cookies, roles, invitation rotation, CAS/stale writes, retry deduplication, activity and persistence tested.
- [x] Two new actual public Gemini requests accepted on `gemini-3.5-flash-lite`; totals 6 accepted / 9 historical unsuccessful across 15 provider-reaching attempts. Invalid/quota probes excluded.
- [x] Browser custom project review/approval, solver, repairs, desktop/mobile, same-page invitation joining, contributions and contributor restrictions passed.
- [x] Room roles, revisions, activity and contributions survived actual redeployment and reload.
- [x] Hosted security/input checks 27/27, actual public JS credential scan clean; safe quota message preserves brief and manual planning. Source/history/build secret scan clean.
- [ ] **Hosted two-independent-browser UI test in the same room.** Built-in browser isolated contexts are unsupported. Separate role UIs and independent API sessions passed; this checkbox remains open and is not replaced by HTTP tests.
- [x] No organizer recovery or member revocation claimed. Existing sessions survive invite rotation up to 30 days. Repair-search, AI semantic-review and load-test limits disclosed.

## Human submission work — still required

- [ ] Review code, licenses/credits, mathematical claims and [AI disclosure](../AI_DISCLOSURE.md); be able to explain the work and actual human contributions.
- [ ] Confirm student eligibility (13+), team size at most six, registration and applicable guardian permission. No eligibility is inferred.
- [ ] Add authentic team members, their contributions, challenges and learning to the [Devpost draft](DEVPOST.md). Select **Community Impact** as the primary track.
- [ ] Record the [2–3 minute demo](DEMO_SCRIPT.md), publish on YouTube/Vimeo publicly or unlisted (six-minute maximum), and check the video signed out. Video publication has not occurred.
- [ ] Complete Devpost with public GitHub, live app, video, description/AI/learning, track and all members; verify every link.
- [ ] Submit personally before **November 21, 2026, 11:59 PM EST**, or explicitly authorize that separate action. The agent has not submitted.
- [ ] Follow organizer instructions for live/prerecorded **November 24 Demo Day**.
- [ ] Before entering a second event, separately confirm its rules/eligibility and cross-submission permission. This is not a prerequisite invented for a STEM2Connect-only entry.

## Screenshot and video plan

Use only fictional data and hide invitation fragments, cookies, private configuration, logs and unrelated tabs. Fresh HTTPS evidence is in `docs/screenshots/production/`:

1. `landing-full.jpg` — public entry and core interface.
2. `robotics-repair-preview.jpg` — 7/8 → verified 8/8 hypothetical repair.
3. `gemini-live-proposal.jpg` — actual returned proposal before approval.
4. `custom-project-full.jpg` — approved project with independent feasible certificate.
5. `mobile-custom-full.jpg` — 390×844 responsive layout, no document overflow.
6. `room-organizer-redeployed.jpg` / `contributor-redeployed.jpg` — actual role interfaces and managed persistence, **separate test rooms**, not a passed two-browser test.
7. `stale-draft-rejected.jpg`, `contributor-permissions.jpg`, `safe-rate-limit.jpg` — rejection and permissions evidence.

Older `milestone-*` and `release/` images are local historical evidence. Do not present them as hosted same-room two-browser verification. Screenshots are evidence, not a substitute for the required working demo video.

## Operations after submission

Rotate the Turso database-scoped token before **December 19, 2026, 7:45 PM EST**; update the Production value, redeploy, verify `/api/health` reports managed. No reminder is scheduled. Monitor free-tier quotas; do not enable billing or paid upgrades without separate owner approval. No source changes or additional product features are required for the prepared demo.
