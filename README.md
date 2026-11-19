# CATALYST

**Turn ideas into collective action.**

Catalyst models whether a community project can satisfy its stated requirements, explains bottlenecks, and verifies hypothetical repairs. Milestone 2 extends the original interface and deterministic engine with custom project creation, optional Gemini drafting, multiple fictional scenarios, and previewable counterfactuals.

## Run locally

Requires Node.js 22.13+ and npm. Tested with Node.js 24.14.1.

```powershell
cd C:\Users\luisc\OneDrive\Documents\ChatGPT\hackathons\catalyst
npm ci
npm run dev
```

Open [http://127.0.0.1:3100](http://127.0.0.1:3100). Production: `npm run build`, then `npm start`. Builds use the supported Webpack option because Turbopack's production CSS worker failed on this Windows environment. Local servers bind only to loopback. No authentication, database, or API key is required for manual planning and the demos.

## Create a project

1. Click **Create a project**. Describe your idea and set title, event date, time zone, audience, and available budget/spending limit.
2. Optionally request a real Gemini draft when a server credential is configured. Inspect extracted statements, quotations, suggested requirements, assumptions, and unanswered questions. Nothing is applied automatically.
3. Add/edit tasks, times, expenses, dependencies, mandatory roles, skills, qualifications, volunteer profiles, availability windows, workload limits, supply types, inventory, and task-specific resource requirements.
4. Review and explicitly approve the model. Only then is it saved to the workspace and analyzed by the deterministic constraint engine.
5. Preview a tested intervention. The preview shows its proposed inputs, resulting coverage, remaining bottlenecks, known/unknown cost assumptions, ranking score, and independent certificate result. Apply it only when you want to change the current model.

**Edit requirements** reopens a separate draft. Approval updates the project's reset baseline. **Reset scenario** undoes experiments back to the latest approved baseline; it does not erase another project's state. Switch projects with the selector above the workspace. **Export plan** downloads input, output, and independent verification as JSON.

Defaults are explicit placeholders requiring review: today's date, one participant, $0 budget, a one-hour task, and suggested availability. Empty volunteer rosters and zero inventory are valid, typically infeasible models; they are not fabricated commitments. AI does not fill available volunteers, confirmed qualifications, funding, or inventory. Skills are matched as normalized identifiers; comma-separated editor input converts spaces to underscores.

## Fictional demo paths

| Scenario                 | Initial state                                                        | What to test                                                                       |
| ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Robotics workshop        | 7/8 roles covered; one qualified instructor needed for parallel labs | Preview/apply an instructor; withdraw Jordan; preview/apply an assistant           |
| Neighborhood cleanup     | Arrival/schedule conflict plus two missing grabbers                  | Preview the combined inventory and availability repair; compare partial candidates |
| Community donation drive | Initially feasible                                                   | Withdraw Taylor; preview/apply a qualified driver; reset                           |

All scenarios and custom projects use the same solver, verifier, and intervention analyzer. All demo people, commitments, and projects are fictional. Audience counts are planning targets, not measured impact.

## Optional live Gemini compiler

Copy `.env.example` to `.env.local` in **this project**, set `GEMINI_API_KEY` there, and restart the server. `GOOGLE_API_KEY` is also accepted from the server environment. Never use a `NEXT_PUBLIC_` variable or put a secret in source code. The provider module is guarded by `server-only`; browser requests go through `/api/compile`.

Default model: `gemini-3.5-flash-lite`, configurable with `GEMINI_MODEL`. The official Google GenAI SDK (`@google/genai`) uses the documented Interactions API and schema-constrained JSON. Model and structured-output support were checked in [Google's model documentation](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite). [Google's pricing page](https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite) lists free-tier text input/output; account eligibility, limits, billing, and access remain provider-dependent.

Requests have a 40-second timeout, no SDK retry/automatic continuation, a 6,000-output-token cap, and five local drafting attempts per minute per server process. No grounding or paid external tools are enabled. Only the brief is sent when the user requests drafting. Free-tier provider data handling differs from paid tiers; keep personal/sensitive information out of briefs and review the provider's terms.

**Current verification status: no Gemini credential was configured, so no successful live provider request is claimed.** Missing-key behavior was exercised against the real local endpoint and browser. Valid/invalid output, provider errors, rate limits, and approval conversion are covered by clearly labeled mocked unit tests. No staged AI responses exist in the product. Manual creation remains fully functional without AI.

## Verify

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

There are 100 passing tests, including all original 35 unchanged, plus 100 seeded small CSPs compared against an independent exhaustive oracle inside one original test. Coverage includes custom approval/editing, strict AI schemas, malformed output, missing configuration, redacted errors, HTTP limits, scenario switching, resets, storage migration/failure, optional scope, procurement/funding bundles, reproducibility, and independently verified interventions. See [verification](docs/VERIFICATION.md) for browser evidence and screenshots.

## Architecture and limits

The deterministic mathematical model, solver, independent verifier, intervention analyzer, AI compiler/provider, fictional scenarios, project helpers, persistence reducer, and UI remain separate. See [architecture](docs/ARCHITECTURE.md).

Models use fixed times on one event day: up to 16 tasks, 24 volunteers, 32 role slots, and 30 supply types. The workspace supports 30 saved projects. Search has a 200,000-node cap; an interrupted search never becomes a staffing-infeasibility proof. Feasible means the stated model is satisfiable, not that an event is safe or guaranteed to succeed. Intervention search is bounded and does not claim a global minimum or cheapest real-world fix. Unknown supply acquisition costs stay labeled unknown.

## Disclosure, credits, and next milestone

OpenAI Codex assisted with architecture, implementation, UI design, fictional data, tests, debugging, and documentation. Humans must review and understand the work before presenting. Runtime AI uses Google Gemini only when configured and explicitly requested. See [AI disclosure](docs/AI_DISCLOSURE.md) and [hackathon requirements](docs/HACKATHONS.md).

Libraries: Next.js, React, TypeScript, Tailwind CSS, React Flow, Zod, Lucide, Vitest, ESLint, the official Google GenAI SDK, and their dependencies. Exact versions and dependency licenses are available via the lockfile and installed packages. The original CSS/SVG artwork is retained. No stock testimonials or real impact metrics are used.

Recommended Milestone 3: durable shared project rooms, collaboration and permission design, stronger benchmarks and larger-model execution, deeper bounded repair search, accessibility audits, backup/import, evaluation of real Gemini output once credentials are supplied, deployment, and submission materials. Existing local Git history is preserved with meaningful checkpoint commits. Nothing has been pushed, publicly deployed, or submitted; those actions still require approval. Cross-submission permission and team eligibility remain unresolved.
