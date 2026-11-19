# CATALYST

**Turn ideas into collective action.**

Catalyst checks whether a community project can satisfy its explicitly modeled requirements, explains uncovered constraints, and re-solves after hypothetical contributions or withdrawals. Milestone 1 is a working local robotics workshop demo, built from scratch on November 18, 2026.

## Run locally

Requires Node.js 22.13+ (tested with Node 24) and npm.

```powershell
cd C:\Users\luisc\OneDrive\Documents\ChatGPT\hackathons\catalyst
npm ci
npm run dev
```

Open [http://127.0.0.1:3100](http://127.0.0.1:3100). Production: `npm run build`, then `npm start`. No account, database, API key, or paid service is needed. Changes are saved in this browser's local storage; Reset demo restores the fictional dataset.

## The 60-second demo

1. Click **Try the live demo**. The workshop is infeasible: **7 of 8** role slots are covered. Its parallel labs need two qualified instructors; the roster has one.
2. Inspect a graph task or the accessible task selector to see its actual assignments.
3. Click **Simulate this change** to add a hypothetical qualified instructor. All **8 of 8** roles and the modeled budget, supplies, and dependency constraints pass. An independent checker validates the certificate.
4. Open **What-if laboratory** and withdraw **Jordan Lee**. The solver identifies an uncovered build assistant role.
5. Apply the new tested contribution. The project becomes feasible again.
6. Explore **People & skills** to add a volunteer with explicit availability and capacity, or **Resources & budget** to introduce supply and funding deficits.
7. **Export plan** downloads the complete model, solver output, and independent verification as JSON. Partial assignments are diagnostic, not executable plans.

All names, commitments, resource counts, and the proposed workshop are fictional. The 60 students are a modeled target, not measured impact. Feasibility means only that the supplied model is satisfiable; it does not guarantee event safety, turnout, consent, venue access, or actual commitments.

## Verify

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite covers all required solver cases and 100 seeded instances compared against an exhaustive independent certificate oracle. See [architecture](docs/ARCHITECTURE.md) for constraints, proof limits, and verifier design.

All four checks passed. The demo was also exercised on desktop, at mobile width, and against the built production server. See [verification and screenshots](docs/VERIFICATION.md) for the observed results. The production build uses Next.js's supported Webpack bundler because Turbopack's production CSS worker failed in this Windows environment.

## AI disclosure and credits

OpenAI Codex assisted with architecture, implementation, UI design, fictional scenario authoring, tests, debugging, and documentation. Team members must personally review the code and understand the algorithm before presenting. No specific model identity or completed human review is asserted. See [AI disclosure](docs/AI_DISCLOSURE.md).

**There is no runtime AI feature in Milestone 1.** No provider is configured or called, and no AI responses are simulated. The authoritative feasibility engine is ordinary deterministic TypeScript. The validated, editable AI requirement compiler is Milestone 2 work; credentials will be server-only and environment-based when implemented.

Third-party libraries: Next.js and React (application), Tailwind CSS (CSS pipeline), @xyflow/react / React Flow (dependency visualization and controls), Zod (validation), Lucide (icons), Vitest (tests), TypeScript, ESLint, and their transitive dependencies. See `package.json` and the lockfile for exact versions and each package for its license. The geometric hero artwork is authored in CSS and inline SVG; no external stock images, testimonials, or impact metrics are used.

## Scope and next milestone

Completed: landing page, design system, interactive graph, deterministic solver, independently checked assignments, tested interventions, volunteer simulation/withdrawals, resource/budget experiments, local persistence, JSON export, and automated tests.

Next: AI requirement compiler with provider integration and editable approval flow; project creation; community cleanup and donation drive scenarios; multi-change repair search; visualization refinements. Collaboration rooms, durable storage, benchmarking, deployment, video, and submission materials follow in Milestone 3.

No public deployment, GitHub push, or Devpost submission has been performed. This is an independent local Git repository inside the requested folder. Other projects are untouched.

Hackathon research, eligibility requirements, deadlines, AI disclosure obligations, and unresolved cross-submission permission are in [hackathon requirements](docs/HACKATHONS.md). Eligibility is not verified. Publication and submission still require the owner's approval.
