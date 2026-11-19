# AI use disclosure — Milestone 1

Draft for human review before submission. Describe only work actually performed; do not claim the team has reviewed or understood code until that happens.

## Development assistance

OpenAI Codex assisted with product interpretation, architecture, TypeScript constraint solver and independent verifier, fictional demo data, React/Next.js implementation, CSS/SVG design, tests, debugging, and documentation. The specific underlying model name is not asserted. The final verification report records which automated checks actually ran.

The team must review and explain the model, backtracking algorithm, deterministic ordering, budget/resource checks, intervention assumptions, independent verifier, test strategy, and node-limit behavior. Review should also establish what each human member changed, tested, learned, and contributed. Those personal accounts cannot be fabricated by an assistant.

## Runtime behavior

- No LLM or AI provider is connected in this milestone.
- No API key is required, read, copied from another project, or embedded in the browser.
- The application makes no live AI requests and contains no staged AI responses.
- All feasibility verdicts, assignments, deficits, and tested intervention outcomes come from deterministic code operating on the current validated model.
- Names, availability, inventory, and commitments are explicitly fictional or simulated.
- Feasibility is model satisfiability, not an event safety guarantee or probability of success.

## Milestone 2 boundary

Implement a real provider-backed requirement compiler only after credentials are configured. Keep secrets server-side in environment variables. Validate output with Zod, explicitly label every assumption, surface unanswered questions, and require edits/approval before changing authoritative requirements. Missing credentials must produce an honest unavailable state. Never infer volunteer availability, real resources, or commitments as facts. The LLM will draft requirements; the deterministic engine will remain the sole authority on feasibility.

## Submission checklist

Identify Codex and its contributions in the README and Devpost description. Credit libraries and outside resources. Explain the team's review, decisions, testing, limitations, and learning in the demo. Runtime AI remains unimplemented, so do not describe this milestone as having an AI requirement compiler. STEM2Connect's API-credit exception must not be claimed unless the team's actual circumstances qualify. Verify cross-submission permission with both organizers before submitting the same project twice.
