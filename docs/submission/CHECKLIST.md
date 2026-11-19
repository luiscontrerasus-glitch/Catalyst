# Release and submission checklist

Target: owner-requested November 20, 2026 production readiness; STEM2Connect November 21. Rule notes in [HACKATHONS.md](../HACKATHONS.md) were checked November 18 and must be rechecked before submission. Do not infer team eligibility or cross-submission permission.

## Engineering evidence

- [x] Original engine and original tests preserved.
- [x] Genuine persistent rooms, invitation/session separation, contribution ownership, organizer-only plan editing, activity, optimistic concurrency and idempotent retries implemented.
- [x] 122 automated tests pass, including real SQLite, disk reopen and HTTP boundaries.
- [x] Local real-server HTTP evaluation passes 19/19 checks with independent cookie sessions.
- [x] Solver benchmark records 19/19 outcomes, 200/200 oracle matches, 11/12 repairable fixtures found; limitations disclosed.
- [x] Actual browser found and retested the localhost/127.0.0.1 origin issue; organizer room creation observed.
- [ ] Finish two genuinely independent browser sessions: join, availability, supplies, both views synchronized, contributor restrictions, stale draft, reload and reconnect.
- [ ] Current Milestone 3 desktop and mobile QA of robotics and a fresh custom project, including shared-room responsive layouts.
- [ ] Configure Gemini server key and run `npm run evaluate:ai`; inspect each live result and failure. Zero live successes currently.
- [ ] Test managed Turso configuration and transaction behavior on approved staging hosting.
- [ ] Rehearse deployed HTTPS cookie/origin behavior, persistence across restart and any multiple-instance sync.
- [x] Confirm final lint/typecheck/tests/build results in [VERIFICATION_M3.md](../VERIFICATION_M3.md).

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

Capture fresh evidence only after browser control is restored. Recommended: robotics blocked summary and readable graph; 7/8→8/8 verified preview; two distinct browser roles receiving the same real contribution revision; stale draft rejection; new custom plan; mobile preview and room contribution. Never show invitation fragments, cookies, API tokens or unrelated browser content.

Existing `docs/screenshots/` images are **historical Milestone 1/2 evidence**, not proof of Milestone 3 rooms or current mobile QA. No Milestone 3 screenshot set was captured before browser control stopped. Preserve the stable local planning demo as fallback until all room UI gates pass.
