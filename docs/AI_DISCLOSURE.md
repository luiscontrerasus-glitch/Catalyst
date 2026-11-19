# AI use disclosure — Milestone 2

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

No Gemini key was configured in Catalyst or the process environment during this milestone. **No successful live Gemini request has been tested or claimed.** The real local HTTP endpoint's missing-key response and the browser's unavailable state were checked. Provider success/error/output cases use explicitly mocked test fixtures; they are not evidence of a live request. End-to-end manual project creation and real deterministic feasibility were tested separately in the running production app.

## Attribution and submission

Identify Codex's development contributions and Google's optional runtime role in both README and Devpost. Credit major libraries and outside work, explain testing and limits, and describe each human member's actual contribution. Do not describe a mocked provider test as a live demonstration. Verify team eligibility, any credit exception, and both organizers' cross-submission permission before submission. No publication, submission, or organizer contact has been performed.
