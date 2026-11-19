# Catalyst — draft for human review

**Tagline:** Find the contribution that makes a community project possible.

**Primary track:** Community Impact, subject to organizer rules and team eligibility.

## Inspiration

Community projects depend on more than enthusiasm: someone needs the right skills at the right time, shared supplies must cover demand, and the plan must fit a budget. Catalyst makes these relationships explicit and asks: what useful contribution could turn a blocked plan into a feasible one?

## What it does

Create and approve a project model, inspect connected tasks and assignments, identify a bottleneck, and preview a tested repair. The robotics example has seven of eight roles covered because parallel labs need another qualified instructor. Catalyst reruns the model with a proposed contribution and independently verifies the resulting assignment before describing it as feasible.

Durable project rooms support private invitations, display-name participants, their own availability/skills and supply contributions, two-second update polling, activity history, organizer permissions, revision conflicts and safe retries. These are backed by a real database. Independent HTTP-session and persistence tests pass; **full two-independent-browser and Milestone 3 mobile verification remain pending after Computer Use stopped**. Do not remove that qualification until actual UI evidence exists.

Optional Google Gemini drafting converts a brief into schema-validated proposed requirements with quoted evidence, assumptions and questions. The user explicitly approves the model. AI does not invent an available volunteer roster or owned inventory, and never supplies the authoritative feasibility verdict. **No successful live Gemini request is currently claimed: the project has no configured key.**

## How we built it

Next.js, React, TypeScript, React Flow, Zod, SQLite/libSQL with an optional managed Turso backend, and the official Google GenAI SDK. A bounded exact constraint search assigns fixed-time role slots; a separate checker validates complete assignment certificates. Candidate interventions are applied to copies, re-solved, independently checked and ranked with disclosed cost/disruption assumptions. This is bounded repair search, not a proof of a globally smallest or cheapest contribution.

## Evaluation and limitations

122 automated tests pass, preserving the earlier 100. A separate reproducible evaluation produces 19/19 correct defined outcomes and 200/200 additional small oracle matches. All returned feasible assignments and reported verified repairs pass the independent checker. Repair search succeeds on 11/12 defined repairable fixtures; it misses the simultaneous two-identical-volunteer case. Small local timing results are in the repository, not a scalability claim. A simple greedy baseline misses a specialist-ordering solution found by exact search.

Feasibility means the entered mathematical requirements are satisfiable. It does not establish safety, turnout, credential authenticity, or a real-world commitment. All demo names, projects, participant counts and contributions are fictional planning examples. No users, measured impact or volunteer outcomes are claimed. Remote managed-backend and hosted operation are not verified yet.

## AI and outside-work disclosure

OpenAI Codex assisted with architecture, code, design, fictional data, tests, debugging and documentation. Optional runtime AI uses Google Gemini. Credit the listed libraries and their licenses, plus all actual team contributions. The team must understand the solver, verification and approval boundaries before presenting. No human learning story is supplied on behalf of the team.

## What is next

Complete live Gemini evaluation, independent-browser/mobile QA and an approved hosted rehearsal, then improve repeated-contribution repair search, organizer recovery and production access management. Public source, hosting and video links must be added after owner approval. Eligibility and any cross-submission permission remain unconfirmed.

**Before submission:** replace pending statuses only with observed evidence; add actual team members/contributions, approved source/demo/video links, and the team's real learning and challenges. Nothing has been published or submitted.
