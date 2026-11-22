# Final submission handoff â€” November 22, 2026

**Ready for owner review. Devpost remains a draft, not a submitted entry.**

## Links

- [Live Catalyst](https://catalyst-luiscontrerasus-glitch.vercel.app)
- [Public source](https://github.com/luiscontrerasus-glitch/Catalyst)
- [Unlisted demo](https://youtu.be/8FPt2KOD-jI)
- [Devpost draft editor](https://devpost.com/submit-to/31789-stem2connect-ai-hackathon/manage/submissions/1315513-catalyst/finalization) â€” owner sign-in required
- [Project preview](https://devpost.com/software/catalyst-2yem1p)

The current deadline is **November 29, 2026, 11:59 PM EST**, per the [organizer's extension](https://stem2connect-online-hackathon.devpost.com/updates/47871-deadline-extended) and [current schedule](https://stem2connect-online-hackathon.devpost.com/details/dates). The rules and finalization reminder still display the earlier November 21 date. Confirm current presentation arrangements with organizers; the draft does not invent a Demo Day commitment.

## Video

Local export: `C:\Users\luisc\Downloads\Catalyst-Demo-Final.mp4`. Matching `.srt` and `-transcript.txt` files are in the same folder. Ignored `.runtime/submission-artifacts/` preserves the edit manifest, production captures, captions, render inputs and verification evidence. `.runtime/build-final-demo.py` is the editing/render source; it is not required to run Catalyst.

Verified export: **3:42.033, 1920Ã—1080, 30 FPS H.264/AAC**, 11,217,345 bytes. All 6,661 frames decoded successfully. Full local browser playback completed with `ended`, no player error, and audio unmuted. Signed-out YouTube playback was observed in an independent Brave Private Window, progressing to 2:48 of 3:42 without requiring login. Visibility is **Unlisted**. Reviewed **English (United States)** captions are published and captions are also burned into the export.

The YouTube thumbnail is an actual homepage frame selected from generated options. Custom thumbnail upload required channel phone verification, which was not performed. Devpost uses a separate actual homepage screenshot. Luis's original voice was retained. No synthetic voice or product mockup was used. Production capture cadence varies; 30 FPS describes the export. [AI disclosure](../AI_DISCLOSURE.md).

## Saved draft and screenshots

Devpost visibly reports **DRAFT, 4/5 steps done**. The final rules/terms checkbox is unchecked; **Submit project has not been clicked**.

Saved fields: name, pitch, solo Luis Contreras and individual contribution, Community Impact track, technology list, complete story, AI disclosure, limitations, live/repository links, embedded demo, and judge instructions. [Story copy](DEVPOST.md).

Seven real production screenshots are uploaded and captioned:

1. [Homepage](../screenshots/submission/01-homepage.jpg)
2. [Robotics workspace](../screenshots/submission/02-robotics-workspace.jpg)
3. [Initial bottleneck](../screenshots/submission/03-bottleneck.jpg)
4. [Verified hypothetical repair](../screenshots/submission/04-verified-repair.jpg)
5. [Shared room](../screenshots/submission/05-shared-room.jpg)
6. [Real Gemini proposal](../screenshots/submission/06-gemini-draft.jpg)
7. [Human approval](../screenshots/submission/07-human-approval.jpg)

No private invitation, credential, debug screen, generated reference image, or fabricated customer outcome is included. Participants and projects are fictional QA examples.

## Evidence and limits

Approved application commit: `3d6a8360d0770297026281eb032b337122371a5f`, deployed on existing Vercel Hobby with Turso Free. No billing or paid resource was enabled. This handoff adds documentation, not application functionality.

- 143 automated tests; lint, typecheck and optimized production build passed.
- 19 solver fixtures, 200 independently computed small oracle comparisons, and 12/12 defined repairable fixtures passed.
- Fresh hosted checks: 19 room API, 10 managed database, and 27 HTTPS/security/input checks passed.
- Recording phase: one actual `gemini-3.5-flash-lite` request, accepted; zero failed provider-reaching calls. Cumulative: 19 attempts, 10 accepted, 7 historical provider errors, 2 historical validation rejections.
- Production UI: custom draft review, explicit approval, solver gap, robotics repair preview/application, saved room contributions, history and reload checked.
- **Two independently authenticated browser UIs collaborating in the same hosted room remain unverified.** Independent API sessions and separate role interfaces do not replace this gate. Signed-out YouTube playback does not establish app collaboration.
- Repair search is bounded; no globally smallest repair is claimed. Member revocation and account-based organizer recovery are not implemented. Invitation rotation does not revoke existing sessions.

[Sanitized production evidence](../evaluations/submission-production.json). [Full production review](../PRODUCTION_VERIFICATION.md).

## Owner's remaining actions

1. Review story, screenshots, narration, AI disclosure and individual contribution for accuracy. No firsthand learning story or manual coding claim was invented.
2. Confirm student eligibility and applicable guardian permission. Registration agreements were handled by the owner; final legal certification remains for the owner.
3. Confirm live/prerecorded presentation arrangements with organizers. The draft says these will be confirmed; no organizer message was sent.
4. Review the disclosed hosted collaboration acceptance gap.
5. If satisfied, personally review the final rules/terms checkbox and click **Submit project** before the extended deadline. Verify Devpost changes from Draft to Submitted. Saving a draft alone does not enter the hackathon.

Operations: rotate the database-scoped Turso token before **December 19, 2026, 7:45 PM EST**, update Production, redeploy, and verify managed health. Monitor free-tier quotas; paid upgrades require separate approval.

## Final writing pass — November 22

The saved Devpost story, Created by contribution, AI helper answer, screenshot captions and judge instructions were refined. Luis confirmed the concept, product direction, feature and integration decisions, technical evaluation priorities, iterative review, and narration. Codex remains credited for substantial implementation assistance. README font/video status was corrected to the current release. The application, video, screenshots, tests and technical results were not changed. The draft remains unsubmitted.
