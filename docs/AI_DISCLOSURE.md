# AI use disclosure — Milestone 3

Draft for human review before submission. Do not claim human understanding, personal learning, or a completed review until those things have happened.

## Development assistance

OpenAI Codex assisted with product interpretation, architecture, the deterministic TypeScript engine and independent verifier, UI design/implementation, fictional data, Gemini integration, tests, browser QA, debugging, and documentation. The underlying Codex model identity is not asserted. The original Milestone 1 implementation and all 35 original tests are preserved in local Git history.

Team members should review the constraints, exact-search guarantees and node cutoff, certificate checker, bounded counterfactual candidates and scoring, project approval boundary, AI validation limitations, persistence model, test strategy, and the team's actual decisions and learning. No personal accounts or real-world impact are fabricated.

## Runtime AI

The optional compiler uses the current official Google GenAI SDK, with default model `gemini-3.5-flash-lite`, verified against official documentation. Secrets are server-side environment variables; `server-only` guards the provider. There are no keys in browser code, Git, application logs, or exported model data.

The user explicitly requests drafting before their brief is sent to Google. The response is untrusted: strict Zod validation checks shape, bounds, references, allowed fields, and evidence quotations against the original brief. Exact quote validation does not prove semantic truth. All task times, role requirements, qualifications, dependencies, expenses, and supply needs are suggestions pending review. Available people, confirmed qualifications, budget, date, and inventory are never populated from the AI proposal. Manual budget/date/audience values are preserved; the proposal creates no volunteers and sets new inventory to zero.

The user reviews a proposal, chooses whether to copy it into an editable draft, edits missing information, and explicitly approves the final requirements. AI assumptions and unresolved questions are retained in planning notes. Unresolved real-world questions remain outside the mathematical model; approval does not resolve venue access, safety, consent, turnout, or actual commitments. Only approved requirements enter the authoritative solver. The LLM never produces a feasibility verdict used by the product.

Missing credentials preserve manual planning with an explicit unavailable message. Invalid output, incomplete responses, timeout, credential rejection, provider failure, and rate limiting return sanitized errors without applying changes. No raw provider error is returned or logged. There are no fake, cached, or staged AI responses in the product.

## What was actually tested

The initial Milestone 3 checkpoint had no configured key. On November 19 the owner configured it privately, and actual requests were made with `gemini-3.5-flash-lite` and official SDK 3.6.1. Three final evaluation briefs and one production-browser brief produced accepted proposals. Nine earlier attempts were unsuccessful: seven provider errors and two returned responses rejected by application validation. The [call ledger](evaluations/ai-call-ledger.json) distinguishes those outcomes; no raw credentials or unsanitized errors are recorded.

`npm run evaluate:ai` records three real responses for fictional goals: detailed robotics, partial cleanup and ambiguous donation. All three preserve assumptions/questions, enforce approval, and create no roster or owned inventory. The approved drafts remain infeasible without commitments, as expected. In the real browser, an online reading-circle proposal stayed unapproved until review, produced a 0/1 staffing gap, and then reached an independently verified 1/1 after a reviewed fictional volunteer input. Assumptions/questions were editable. Some model questions repeated facts already supplied; semantic review remains necessary.

Actual provider errors exposed an overly complex constrained-decoding schema. Following [Google's schema-complexity guidance](https://aistudio.google.com/docs/structured-output#simplifying-complex-schemas), the provider grammar omits numeric/array bounds while keeping types, required fields, strict object shape and simple identifier patterns. The original strict Zod schema still enforces all bounds, identifiers and references before any proposal is accepted. Real invalid identifier output was rejected during debugging. Timeout, rate-limit and credential failure unit cases are mocks, not claims that those live failures were induced. No staged AI output exists in the app.

Shared-room contributions are participant-entered declarations, not AI-generated commitments. Hypothetical intervention volunteers remain labeled simulated model changes. Neither joining a room nor previewing a repair creates a claim that a real volunteer agreed to help. All room evaluation data is fictional. Development assistance also covers shared-room implementation, evaluation fixtures, deployment recipes and submission drafts.

## Attribution and submission

Identify Codex's development contributions and Google's optional runtime role in both README and Devpost. Credit major libraries and outside work, explain testing and limits, and describe each human member's actual contribution. Do not describe a mocked provider test as a live demonstration. Verify team eligibility, any credit exception, and both organizers' cross-submission permission before submission. No publication, submission, or organizer contact has been performed.
