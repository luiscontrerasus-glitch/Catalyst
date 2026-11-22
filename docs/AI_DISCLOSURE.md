# AI use disclosure — production release

Draft for human review before submission. Do not claim human understanding, personal learning, or a completed review until those things have happened.

## Development assistance

Luis Contreras conceived Catalyst and directed it as a solo project. He defined the product vision, selected features and requirements, set engineering and evaluation priorities, guided integration decisions, reviewed results and design through repeated iterations, and recorded the final demo narration.

He used OpenAI Codex extensively as an AI coding assistant. Codex substantially assisted architecture, the deterministic TypeScript engine and independent verifier, UI implementation, fictional fixtures, Gemini integration, tests, browser QA, debugging, development workflows, and documentation. This was substantial implementation assistance under his direction; it is not a claim that he manually wrote every line or that AI independently originated the project. The underlying Codex model identity is not asserted. The original Milestone 1 implementation and all 35 original tests are preserved in local Git history.

Team members should review the constraints, exact-search guarantees and node cutoff, certificate checker, bounded counterfactual candidates and scoring, project approval boundary, AI validation limitations, persistence model, test strategy, and the team's actual decisions and learning. No personal accounts or real-world impact are fabricated.

## Runtime AI

The optional compiler uses the current official Google GenAI SDK, with default model `gemini-3.5-flash-lite`, verified against official documentation. Secrets are server-side environment variables; `server-only` guards the provider. There are no keys in browser code, Git, application logs, or exported model data.

The user explicitly requests drafting before their brief is sent to Google. The response is untrusted: strict Zod validation checks shape, bounds, references, allowed fields, and evidence quotations against the original brief. Exact quote validation does not prove semantic truth. All task times, role requirements, qualifications, dependencies, expenses, and supply needs are suggestions pending review. Available people, confirmed qualifications, budget, date, and inventory are never populated from the AI proposal. Manual budget/date/audience values are preserved; the proposal creates no volunteers and sets new inventory to zero.

The user reviews a proposal, chooses whether to copy it into an editable draft, edits missing information, and explicitly approves the final requirements. AI assumptions and unresolved questions are retained in planning notes. Unresolved real-world questions remain outside the mathematical model; approval does not resolve venue access, safety, consent, turnout, or actual commitments. Only approved requirements enter the authoritative solver. The LLM never produces a feasibility verdict used by the product.

Missing credentials preserve manual planning with an explicit unavailable message. Invalid output, incomplete responses, timeout, credential rejection, provider failure, and rate limiting return sanitized errors without applying changes. No raw provider error is returned or logged. There are no fake, cached, or staged AI responses in the product.

## What was actually tested

The initial Milestone 3 checkpoint had no configured key. On November 19 the owner configured it privately, and actual requests were made with `gemini-3.5-flash-lite` and official SDK 3.6.1. Three final evaluation briefs and one local production-mode browser brief produced accepted proposals. On November 21, two additional requests through public Vercel production were accepted: a browser reading-circle review/approval/solver flow and an ambiguous-cleanup API evaluation. At that checkpoint there were 15 provider-reaching attempts: six accepted, seven provider errors and two strict-validation rejections. Invalid-input and quota probes are excluded. Nine earlier attempts were unsuccessful: seven provider errors and two returned responses rejected by application validation. The [call ledger](evaluations/ai-call-ledger.json) distinguishes those outcomes; no raw credentials or unsanitized errors are recorded.

`npm run evaluate:ai` records three real responses for fictional goals: detailed robotics, partial cleanup and ambiguous donation. All three preserve assumptions/questions, enforce approval, and create no roster or owned inventory. The approved drafts remain infeasible without commitments, as expected. In the real browser, an online reading-circle proposal stayed unapproved until review, produced a 0/1 staffing gap, and then reached an independently verified 1/1 after a reviewed fictional volunteer input. Assumptions/questions were editable. Some model questions repeated facts already supplied; semantic review remains necessary. During the hosted browser flow an unrequested preparation task was removed before approval. The hosted quota error preserved the brief and allowed manual planning. Timeout, credential rejection and current provider outage were not induced live.

Actual provider errors exposed an overly complex constrained-decoding schema. Following [Google's schema-complexity guidance](https://aistudio.google.com/docs/structured-output#simplifying-complex-schemas), the provider grammar omits numeric/array bounds while keeping types, required fields, strict object shape and simple identifier patterns. The original strict Zod schema still enforces all bounds, identifiers and references before any proposal is accepted. Real invalid identifier output was rejected during debugging. Timeout, rate-limit and credential failure unit cases are mocks, not claims that those live failures were induced. No staged AI output exists in the app.

Shared-room contributions are participant-entered declarations, not AI-generated commitments. Hypothetical intervention volunteers remain labeled simulated model changes. Neither joining a room nor previewing a repair creates a claim that a real volunteer agreed to help. All room evaluation data is fictional. Development assistance also covers shared-room implementation, evaluation fixtures, deployment recipes and submission drafts.

## Attribution and submission

Identify Codex's development contributions and Google's optional runtime role in both README and Devpost. Credit major libraries and outside work, explain testing and limits, and describe each human member's actual contribution. Do not describe a mocked provider test as a live demonstration. Verify team eligibility and any applicable credit exception. If entering the same project in two events, separately establish both organizers' cross-submission permission. The approved GitHub repository and Vercel/Turso app are public. At that earlier checkpoint no video publication, Devpost submission or organizer contact had been performed; the final demo update below supersedes video/draft status. The hosted two-independent-browser UI check remains unverified; separate role interfaces and independent API sessions were tested.

## Earlier local visual redesign — November 21, e01944b

Codex assisted with the redesigned presentation, interaction checks and visual QA. A fictional garden illustration was generated with the built-in image-generation tool, and the UI labels it as artwork. The new logo/diagram are code-native SVG/React. Newsreader and DM Sans are self-hosted with included OFL licenses. [Asset provenance and exact generation prompt](ASSET_CREDITS.md). No user-provided reference mockup is redistributed as a product asset.

Two additional Gemini requests were accepted during this redesign: one through the existing deployed app for the before audit, one through the redesigned local production server. At that redesign checkpoint the observed ledger totaled 17 provider-reaching attempts: eight accepted, seven provider errors and two strict-validation rejections. The new browser flow preserved unapproved suggestions, explicit review, zero fabricated commitments, deterministic gap analysis and an independently verified result after a reviewed fictional contribution. The redesign is local only pending owner visual approval. No video or Devpost entry was created.

## Minimal visual refinement — November 21

Codex assisted with the subsequent visual simplification and real-browser verification. At that historical checkpoint, Instrument Serif Regular appeared only in the homepage headline; Geist served the rest of the interface. Both are locally hosted with original OFL notices. The generated illustration is no longer displayed. No new image generation or Gemini provider request was made during this refinement. The observed live-call ledger remains 17 attempts: eight accepted, seven provider errors, and two validation rejections. Existing provider validation, human approval, solver, API, database, and permission behavior are unchanged. The new manual reading-circle project and all room contributions used fictional QA data. [Comparison, screenshots, checks, and limitations](MINIMAL_REFINEMENT_REVIEW.md).


## Approved Plus Jakarta Sans rollout — November 21

The owner selected Option A. Codex assisted with applying that typography and warm, bold visual direction across the entire product, shorter copy, progressive disclosure, original code-native project visuals, and browser QA. Plus Jakarta Sans is now the sole custom product font. The older families and unused generated garden image were removed. No new image generation or stock photography was used. [Current visual provenance](ASSET_CREDITS.md).

One real request to `gemini-3.5-flash-lite` returned an application-validated reading-circle proposal through the local production browser UI. Its assumptions/questions stayed visible; some questions repeated supplied facts and were reviewed manually. Accepting suggestions created no roster or inventory and did not start analysis. Explicit human approval produced 0/1 staffing; manually entering and approving a fictional hosting volunteer produced independently verified 1/1, which survived reload. The cumulative call ledger is now **18 attempts: nine accepted, seven historical provider errors, two historical validation rejections**. This phase had one accepted request and no failed provider-reaching request. No raw provider error or credential was saved.

At that historical checkpoint the rollout remained local, pending visual review. Backend integration, deterministic solver, verifier, database schema, permissions, and provider validation were unchanged. No push, public deployment, recording, or Devpost submission had occurred at that checkpoint; the final production update below supersedes publication status. The built-in browser still cannot establish independent isolated contexts; separate role views and independent HTTP sessions are distinguished in the [current review](JAKARTA_DESIGN_REVIEW.md).


## Final narrated production demo — November 21

The owner authorized publication of the approved design and final demo preparation. The Plus Jakarta Sans release is deployed to the existing Vercel Hobby application with the existing Turso Free database. One additional real production request to `gemini-3.5-flash-lite` returned an accepted proposal and was captured during browser interaction. Human edits and explicit approval preceded deterministic analysis. The cumulative observed ledger is **19 attempts: 10 accepted, 7 historical provider errors, 2 historical validation rejections**. This phase had no failed provider-reaching call.

The demo uses Luis Contreras's actual narration. Local Whisper transcription assisted caption preparation; Codex assisted editing and FFmpeg rendering. No voice cloning, synthetic narration, generated product mockup, stock footage, or fabricated product interaction was used. Source footage consists of actual production page captures during browser interactions; capture cadence varies, and the export is 30 FPS with deliberate final-frame holds while the narration explains results. One unclear transition sentence was removed; natural pitch and speaking pace were retained. Full disclosure and limitations remain in the Devpost draft. The draft is not submitted.

The completed 3:42 demo is now [Unlisted on YouTube](https://youtu.be/8FPt2KOD-jI), with original narration, reviewed English (United States) captions and signed-out playback verified. Seven production screenshots and the full factual description are saved in Devpost. It remains DRAFT (4/5 steps); final legal acceptance and submission have not occurred. [Final handoff](submission/FINAL_HANDOFF.md).

## Submission writing review — November 22

The owner confirmed his concept development, project direction, requirements, evaluation priorities, integration decisions, iterative design feedback, and narration. The saved Devpost draft and Created by contribution now reflect those roles while retaining substantial Codex implementation credit, Gemini runtime attribution, actual testing results, and known limitations. No manual coding accomplishment, personal learning anecdote, user adoption, or measured impact was invented. The draft remains unsubmitted.
