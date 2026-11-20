# CATALYST

**Turn ideas into collective action.**

Catalyst answers: **what is the smallest useful contribution that could make this community project possible?** It models requirements, explains bottlenecks, and independently verifies hypothetical repairs. Custom plans, optional Gemini drafting, three fictional scenarios, and durable shared project rooms use the same deterministic engine. Repairs are ranked within a bounded candidate set; a global minimum is not claimed.

## Run locally

Requires Node.js 24.x and npm. Tested with Node.js 24.14.1.

```powershell
cd C:\Users\luisc\OneDrive\Documents\ChatGPT\hackathons\catalyst
npm ci
npm run dev
```

Open [http://127.0.0.1:3100](http://127.0.0.1:3100). Production: `npm run build`, then `npm start`. Builds use the supported Webpack option because Turbopack's production CSS worker failed on this Windows environment. Local scripts bind only to loopback. Manual planning and demos need no account or API key. Shared rooms automatically use SQLite in ignored `data/catalyst.db`, or a configured managed Turso database.

Click **Try the live demo → Preview this change** to see the robotics plan move from 7/8 to a verified 8/8 in a hypothetical preview. Applying a simulated repair is separate from receiving an actual participant contribution.

## Production preparation

Public source: [luiscontrerasus-glitch/Catalyst](https://github.com/luiscontrerasus-glitch/Catalyst). Deployment on Vercel Hobby and Turso Free is approved and in progress; see [hosted verification status](docs/PRODUCTION_VERIFICATION.md). Hosted results remain pending until actually tested.

Vercel Node 24 plus a hosted **libSQL-engine Turso database** are the prepared target. Remote storage uses the HTTP client; Vercel cannot silently fall back to local SQLite. `npm run check:production` checks readiness without printing secrets, `npm run db:migrate` creates/replays the additive schema, and `npm run verify:secrets` scans source, browser bundles and Git history. Managed deployments use database-backed quotas. Follow the [exact account/setup handoff](docs/VERCEL_HANDOFF.md); actual hosting remains unverified.

## Shared project rooms

Choose **Create shared room**, enter a fictional display name, and copy the private invitation. An invited participant joins with a display name, contributes their own skills, declared qualifications, availability or existing supplies, and every connected session checks for updates every two seconds. Contributions change the actual model and rerun the solver. Only the organizer can replace requirements or invitations. Revision checks reject stale drafts; request IDs make retries safe. Activity records identify model changes.

Rooms require room-specific HttpOnly sessions. Invite tokens are sensitive bearer access, expire after seven days, and appear in URL fragments that are removed after opening. Session expiry is 30 days. The database stores token hashes. Protect the organizer browser session: there is no account-based organizer recovery or member-removal interface yet. Rotating an invitation prevents new joins with the old link; it does not revoke existing sessions. This prototype is for fictional, low-sensitivity planning data.

Local links work across browsers **on the same computer**. Remote participants need approved hosting. Managed persistence is implemented but not exercised against a remote account because hosting and database credentials are absent. A contributor in native Brave and an organizer in the in-app browser were independently verified: joining, volunteer/supply contributions, synchronized verified plans, permissions, reload and stale-edit rejection. Desktop/mobile robotics and a fresh AI-assisted custom project were also tested. The same-page invitation regression now passes in a real browser, including contributor contribution and organizer permissions. See [current verification](docs/FINAL_VERIFICATION.md) and [deployment configuration](docs/DEPLOYMENT.md).

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

Requests have a 40-second timeout, no SDK retry/automatic continuation, a 6,000-output-token cap, and five drafting attempts per minute (shared across instances with managed storage; per-process locally). No grounding or paid external tools are enabled. Only the brief is sent when the user requests drafting. Free-tier provider data handling differs from paid tiers; keep personal/sensitive information out of briefs and review the provider's terms.

**Live Gemini verified:** the three fictional evaluation briefs produce valid proposals on `gemini-3.5-flash-lite` with SDK 3.6.1, including ambiguous inputs. A fourth accepted proposal completed the real production-browser approval and deterministic-solver workflow. Debugging exposed provider schema-complexity rejection and invalid identifiers; the provider grammar is now smaller while strict application validation is retained. The [call ledger](docs/evaluations/ai-call-ledger.json) records four accepted proposals and nine earlier unsuccessful attempts. Returned assumptions and questions still require semantic review; some questions repeat already provided facts. Missing-key, malformed-output, timeout, rate-limit and redacted-error unit tests remain clearly labeled tests. No staged responses exist in the product.

## Verify

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run evaluate
npm run evaluate:ai
# With the local app running:
npm run evaluate:rooms
```

There are **143 passing tests**, preserving all original 100 Milestone 2 tests, including the original 35 solver tests unchanged. New room tests use real SQLite: permissions, independent session tokens, HTTP cookies/origins, stale writes, concurrent commits, retry deduplication, expiry, invite rotation, disk reopen persistence and fail-closed managed configuration. AI provider-schema and repeated-contribution regression tests cover the final fixes. The original suite also compares 100 seeded small CSPs against an independent oracle. See [current verification](docs/FINAL_VERIFICATION.md) for actual UI evidence and limits.

The separate reproducible benchmark gets **19/19 defined outcomes correct**, **200/200 additional seeded oracle matches**, and verified repairs on **12/12 defined repairable fixtures** after fixing paired identical volunteer contributions. Three identical new volunteers in one bundle remain outside the bounded candidate space. First-fit greedy misses the specialist-ordering fixture that exact search solves. All returned feasible certificates and repairs pass the independent checker. Small synthetic timings are machine-specific and do not establish production scalability. See [results and limitations](docs/evaluations/solver-latest.md) and machine-readable artifacts alongside it.

## Architecture and limits

The deterministic mathematical model, solver, independent verifier, intervention analyzer, AI compiler/provider, fictional scenarios, project helpers, persistence reducer, and UI remain separate. See [architecture](docs/ARCHITECTURE.md).

Models use fixed times on one event day: up to 16 tasks, 24 volunteers, 32 role slots, and 30 supply types. The workspace supports 30 saved projects. Search has a 200,000-node cap; an interrupted search never becomes a staffing-infeasibility proof. Feasible means the stated model is satisfiable, not that an event is safe or guaranteed to succeed. Intervention search is bounded and does not claim a global minimum or cheapest real-world fix. Unknown supply acquisition costs stay labeled unknown.

## Disclosure, credits, and next milestone

OpenAI Codex assisted with architecture, implementation, UI design, fictional data, tests, debugging, and documentation. Humans must review and understand the work before presenting. Runtime AI uses Google Gemini only when configured and explicitly requested. See [AI disclosure](docs/AI_DISCLOSURE.md) and [hackathon requirements](docs/HACKATHONS.md).

Libraries: Next.js, React, TypeScript, Tailwind CSS, React Flow, Zod, Lucide, Vitest, ESLint, the libSQL/Turso client, the official Google GenAI SDK, and their dependencies. Exact versions and dependency licenses are available via the lockfile and installed packages. The original CSS/SVG artwork is retained. No stock testimonials or real impact metrics are used.

The [demo script](docs/submission/DEMO_SCRIPT.md), [Devpost draft](docs/submission/DEVPOST.md), [submission checklist](docs/submission/CHECKLIST.md), and deployment recipe are prepared for review. Source is published and free-tier deployment is approved; hosted managed-backend/HTTPS verification remains pending. Vercel/Turso setup is prepared in [the handoff](docs/VERCEL_HANDOFF.md). Docker Compose validates, but the Docker engine is unavailable for container execution. Existing local Git history is preserved. Source publication is complete. Public app deployment is in progress; video publication and Devpost submission have not occurred. Cross-submission permission and team eligibility remain unresolved.
