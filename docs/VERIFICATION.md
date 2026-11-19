# Milestone 1 verification

Verified November 18, 2026, America/New_York. Node.js 24.14.1, npm 11.11.0, Next.js 16.4.6, React 19.3.1, TypeScript 5.9.3, Vitest 4.1.12. Exact dependency graph is in `package-lock.json`.

## Automated checks

| Command | Result |
| --- | --- |
| `npm run lint` | Passed, zero warnings/errors |
| `npm run typecheck` | Passed |
| `npm test` | 35 tests passed; one test independently checks 100 seeded small CSPs |
| `npm run build` | Passed; Next.js production build using supported Webpack bundler |

Turbopack's production CSS subprocess failed on this Windows environment, including with local process permissions available. The build script explicitly selects `next build --webpack`; the resulting production build succeeds. Development uses the default Turbopack bundler and was also exercised successfully. No failing production build is left as the configured default.

## Browser verification

Used the local in-app browser against both `npm run dev` and the actual `npm start` production output at `http://127.0.0.1:3100`.

- Initial fictional workshop: infeasible, exactly 7/8 role slots covered; uncovered robotics instructor role at the parallel lab.
- Apply tested instructor contribution: feasible, 8/8 covered, independent assignment verification passes.
- Withdraw Jordan Lee: infeasible, 7/8 covered; a build assistant is required.
- Apply tested assistant contribution: feasible again, independent verification passes. Repeated successfully on the production build.
- Custom instructor with only 60 minutes of workload: remains infeasible for the 90-minute lab. A 120-minute custom profile satisfies the model.
- Reduce robotics kits from 20 to 19: supply violation appears despite all eight staffing slots being assigned; tested inventory fix restores feasibility.
- Reduce funding from $400 to $350: the computed $360 expense total produces a $10 deficit and a tested funding repair.
- Reload: saved scenario is restored. Comparison history honestly starts a new session baseline after reload.
- Export: browser downloaded JSON containing the complete model, eight assignments, feasible status, and `verification.valid: true`.
- Mobile viewport 390 × 844: navigation and feasible state render without horizontal overflow; simulation works.
- Browser error/warning console: no entries observed in the exercised development and production flows.
- Original fictional scenario restored after testing. Temporary local servers stopped after QA; use the README launch commands to run again.

Screenshots captured from the production build:

- [Landing page](screenshots/landing.jpg)
- [Initially blocked workshop](screenshots/workspace-blocked.jpg)
- [Verified feasible assignment](screenshots/workspace-feasible.jpg)
- [Withdrawal comparison](screenshots/withdrawal.jpg)

## Limits and remaining work

This is one fixed-time, one-day fictional scenario with browser-local persistence. Search has a 200,000-node cap and never claims staffing infeasibility solely from an interrupted search. Single-change repair candidates are tested, not claimed globally minimal or cheapest. No live AI compiler, editable project creation, additional scenario presets, multi-user rooms, deployment, or submission is implemented.

Milestone 2 should add validated AI drafting with explicit assumptions and human approval, editable requirements, cleanup/donation scenarios, and deeper counterfactual analysis. Hackathon eligibility, CSC deadline clarification, and permission to cross-submit remain owner/organizer matters; see `HACKATHONS.md`. No public hosting, GitHub push, Devpost submission, or organizer contact was performed.
