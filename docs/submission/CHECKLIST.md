# Release and submission checklist

Target: owner-requested November 20, 2026 production readiness; STEM2Connect November 21. Rule notes in [HACKATHONS.md](../HACKATHONS.md) were checked November 18 and must be rechecked before submission. Do not infer team eligibility or cross-submission permission.

## Engineering evidence

- [x] Original solver/verifier and all original 100 tests preserved; intervention search has a focused multiplicity fix with new regression tests.
- [x] Genuine persistent rooms, invitation/session separation, contribution ownership, organizer-only plan editing, activity, optimistic concurrency and idempotent retries implemented.
- [x] 143 automated tests pass, including real SQLite, disk reopen, HTTP boundaries, provider grammar, repeated contributions and fail-closed production configuration.
- [x] Local real-server HTTP evaluation passes 19/19 checks with independent cookie sessions.
- [x] Solver benchmark records 19/19 outcomes, 200/200 oracle matches, 12/12 repairable fixtures found; bounded-search limitations disclosed.
- [x] Actual browser found and retested the localhost/127.0.0.1 origin issue; organizer room creation observed.
- [x] Two genuinely independent browsers: native Brave contributor plus in-app organizer; join, availability, supplies, synchronized verified plans, contributor restrictions, stale draft and reload pass. Offline/reconnect was separately tested in the in-app browser.
- [x] Same-page invitation regression passes in a real browser: automatic reload, join form, fragment removal, contributor contribution, synchronized feasibility and organizer-only editing.
- [x] Current desktop/mobile robotics and a fresh custom project pass UI checks; mobile room contributions, reload, shared same-session tabs, stale drafts and reconnect are exercised. This does not replace the independent-browser gate.
- [x] Three live Gemini evaluation proposals and a fourth production-browser proposal accepted on `gemini-3.5-flash-lite`; actual earlier failures disclosed and strict validation/approval checked.
- [x] Current npm production dependency audit: zero reported advisories. Exact configured key absent from 32 scanned browser build artifacts.
- [ ] Test managed Turso configuration and transaction behavior on approved staging hosting.
- [ ] Rehearse deployed HTTPS cookie/origin behavior, persistence across restart and any multiple-instance sync.
- [x] Confirm lint/typecheck/tests/build results in [final verification](../FINAL_VERIFICATION.md).
- [x] Docker Compose configuration validates; nonexistent public-asset copy removed. Container execution remains blocked by unavailable Docker engine.

- [x] Vercel/libSQL configuration, schema/preflight scripts, fail-closed serverless checks and database-backed quotas prepared and tested locally.
- [ ] Complete every hosted acceptance item in [the handoff](../VERCEL_HANDOFF.md) after approval.

## Publication and human review

- [x] README, architecture/mathematics, disclosure, evaluation artifacts, deployment recipe, demo script and Devpost draft prepared.
- [ ] Human review of code, licenses, mathematical claims, credentials handling and actual team contributions.
- [ ] Confirm participants' eligibility, team size, registration, guardian permissions where applicable, and any AI-credit exception.
- [ ] Confirm cross-submission permission with both organizers before entering both events. CSC deadline discrepancy remains unresolved.
- [ ] Owner approves public GitHub push, hosting and video publication. No such approval or publication is assumed.
- [ ] Publish approved repository/README, approved hosted app and 2–3 minute video; verify links from a signed-out browser.
- [ ] Add actual team members and authentic learning/challenge narrative to Devpost.
- [ ] Explicit owner approval before Devpost submission; no submission performed.

## Screenshot plan

Fresh Milestone 3 evidence is in `docs/screenshots/milestone-3/`: landing, robotics preview, real Gemini proposal, approved custom plan, mobile editor/preview, organizer room, mobile contribution/verified room, and stale-draft rejection. Five new `two-browser-*` images show actual distinct roles, matching revision 11, contributor repair restrictions, cross-browser stale rejection and a mobile organizer view. No invitation fragments, cookies, API tokens or unrelated browser content are shown.

New `docs/screenshots/release/` images show the invitation regression, restarted organizer room and 390-pixel contributor layout. Capture equivalent public HTTPS evidence after deployment.

Older images outside the Milestone 3 subdirectory remain historical Milestone 1/2 evidence. Preserve the stable local planning demo as fallback until all room UI gates pass.
