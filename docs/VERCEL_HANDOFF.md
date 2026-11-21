# Vercel deployment and operations handoff

Originally prepared November 19 from `5462920`; updated November 21 after explicit owner approval. GitHub and Vercel Hobby/Turso Free are live: https://catalyst-luiscontrerasus-glitch.vercel.app. All six Production secrets/settings, Git connection, Node 24 and schema v2 are configured. No new credential action is needed. [Actual acceptance report and limitations](PRODUCTION_VERIFICATION.md) supersedes pending setup language in the reusable recipe below.

## Chosen architecture

Use Vercel's **Next.js / Node.js 24.x** runtime and a **Turso libSQL-engine database**. Shared rooms, session hashes, invitation hashes, revisions, activity, retry deduplication and rate counters all live in the remote database. Browser localStorage retains the personal workspace only; it is not the room database. No embedded replicas or temporary server files are used for managed rooms.

The existing application uses `@libsql/client` transactions. Remote connections now use `@libsql/client/web`, which selects HTTPS for `libsql://` URLs. Native SQLite is dynamically imported only for the persistent local-server fallback. Vercel automatically requires managed storage and an explicit HTTPS origin even if `REQUIRE_MANAGED_ROOMS` was forgotten. Missing configuration fails closed. API handlers explicitly use Node, not Edge. Gemini has a 40-second SDK timeout inside a 60-second function allowance.

The provider's current documentation distinguishes the new Turso engine from libSQL. **Choose libSQL for this release; do not use `--tursodb`.** This preserves the tested SQL/client architecture without a database migration to a different engine. [Official engine selection](https://github.com/tursodatabase/turso-docs/blob/main/quickstart.mdx), [client compatibility](https://github.com/tursodatabase/turso-docs/blob/main/sdk/ts/reference.mdx), [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [function duration](https://vercel.com/docs/functions/configuring-functions/duration).

## Accounts and credentials the owner must configure

| Account or value | Exact purpose |
| --- | --- |
| GitHub account/organization and repository name | Permission to publish this source and connect Vercel. Suggested repository name: `catalyst`; owner must choose the namespace and review licensing. |
| Vercel account/team | Import the approved repository as a Next.js project. Owner completes sign-in, permissions and terms. No custom domain is necessary. |
| Turso account/organization | Create one libSQL database for production. Choose a region near the Vercel function region and review current quota/pricing before creation. |
| `TURSO_DATABASE_URL` | The database's `libsql://…` connection URL, without query overrides or credentials embedded in it. |
| `TURSO_AUTH_TOKEN` | A **database-scoped read/write** token for that database, not a Turso organization/admin API token. It needs DDL access for migrations. Protect it as a server secret. |
| Google AI Studio project/key | Existing local Gemini key is configured. Copy it privately into Vercel's server-side `GEMINI_API_KEY`; local files are not uploaded. Confirm access/quota for `gemini-3.5-flash-lite`. |
| `APP_ORIGIN` | The exact stable production origin, e.g. `https://catalyst-your-team.vercel.app`, without a path. Use the actual assigned domain, not this example. |

Do not paste secrets into chat, source, screenshots, build arguments or `NEXT_PUBLIC_*`. No Vercel automation token or Turso admin API token is required for the dashboard workflow. Review provider budgets and prevent automatic paid upgrades unless separately approved.

## Ordered setup after explicit approval

1. Review the release diff, README, AI disclosure, dependency licenses and screenshot contents. Confirm the GitHub owner/name and source license. Publish **only the Catalyst repository**, excluding `.env*` except `.env.example`, `data`, `.runtime`, `.room-secrets`, `.next` and `node_modules`. Keep the existing commit history after the secret scan passes. Do not publish other hackathon folders.
2. Create the libSQL database through Turso's dashboard, or use its official CLI in a supported shell after installation and sign-in:

   ```sh
   turso auth login
   turso db create catalyst-production
   turso db show catalyst-production
   turso db tokens create catalyst-production
   ```

   The last command displays a secret: run it privately and save the database token directly in the environment manager. Use the dashboard's token expiry/rotation options; maintain a reminder before expiry. Do not run the command in a recorded demo. Omit `--tursodb`; confirm the database engine is libSQL. Initial resources were configured through the dashboard and authenticated Vercel CLI; these Turso CLI commands are a reusable alternative, not an execution log.
3. In Vercel, import the approved GitHub repository. Root directory is `.` when Catalyst is the repository root, otherwise select the actual Catalyst subdirectory. Framework: **Next.js**. Node: **24.x**. Leave Output Directory at the framework default; do not export static HTML. `vercel.json` runs `npm ci`, then configuration checks and `npm run build` using Webpack.
4. Before the first deployment, set these variables in the **Production** environment:

   ```dotenv
   GEMINI_API_KEY=<private Google AI Studio key>
   GEMINI_MODEL=gemini-3.5-flash-lite
   TURSO_DATABASE_URL=libsql://<actual-database-host>
   TURSO_AUTH_TOKEN=<private database token>
   APP_ORIGIN=https://<actual-stable-vercel-domain>
   REQUIRE_MANAGED_ROOMS=true
   ```

   Vercel supplies `VERCEL=1`. Never set `NEXT_PUBLIC_` counterparts. Use the stable project domain shown in Vercel settings. Alternate domains/preview URLs are not automatically authorized for writes. Redirect to the canonical origin or configure the intended exact origin; old-origin invitations will not carry their cookie sessions to a new domain.
5. Configure the same managed values privately in local ignored environment configuration, or a protected operator shell. Run `npm run check:production`, then **`npm run db:migrate`**. The first prints only readiness booleans; the second prints only schema readiness/version. Migration v1 preserves existing room tables; v2 adds shared rate counters. Both migrations are additive and replay-safe, applied atomically with a version ledger. Cold-start initialization uses the same migration code. No manual schema copying or SQLite upload is needed. Back up a database before future schema changes.
6. Do not share production credentials with pull-request Preview deployments. Either disable previews for this release, or use a **separate** libSQL database, separate token, and exact HTTPS preview origin in Preview settings. Unconfigured previews intentionally fail the production check. A stable staging alias is easier to pin than changing deployment URLs.
7. Deploy only after approval. Place functions near the database. Set hosting/provider spending controls and monitoring. Database-backed quotas allow **5 AI attempts/minute across the deployment**, and **120 room writes/minute across all rooms**. These are fixed-window caps, reset at minute boundaries; a boundary can allow adjacent bursts. They persist across instances/restarts and fail closed if quota storage fails. They are not per-person quotas or a complete denial-of-service defense. Configure Vercel Firewall/abuse controls for excessive unauthenticated traffic; do not set read limits below normal two-second polling demand.

## Required acceptance test on the actual deployment

Record build/commit, public origin, UTC time, exact Gemini model, call outcomes and sanitized screenshots. Keep these boxes open until actually observed; local passes do not fill them.

- [ ] Open the public URL signed out; verify HTTPS certificate, canonical origin and security response headers. `/api/health` must return `status:ok, rooms:managed`; no database host or credentials in the response.
- [ ] Make one real Gemini request from the browser; review assumptions/questions, approve explicitly, and solve. Record success or actual sanitized failure separately from mocked tests.
- [ ] Create a new fictional custom project, reload it, edit/reapprove, analyze an infeasible case, preview/apply a counterfactual repair and inspect the independent certificate.
- [ ] Create a room. Use **two independent browser profiles/apps**; the bare URL must deny unauthenticated access. Paste the invitation on that same page; joining must work and the fragment must disappear. Test the public HTTPS invitation from a fresh session.
- [ ] Contributor adds availability and supplies. Both browsers synchronize revision, coverage and activity; only the organizer can edit requirements, rotate invitations or apply a hypothetical repair.
- [ ] Make concurrent edits; stale approval must fail without losing the draft or overwriting the newer contribution. Retry a request safely. Deny foreign-origin writes, cross-room cookies and unauthorized role changes.
- [ ] Restart/redeploy the app. Existing rooms, distinct sessions, activity, revision and shared rate counters must persist. Confirm a second instance reads the same revision; inspect remote transaction latency/errors.
- [ ] Test reconnect and expired/replaced invitations. Confirm replacing an invitation does **not** revoke an already joined member; document this to reviewers.
- [ ] Exercise desktop and 390×844 mobile creation, contribution, graph/task selector, repair preview and reload; check scrolling and readable controls.
- [ ] Inspect browser requests, HTML, JS bundles and responses for credentials. Cookies must be HttpOnly, Secure, SameSite=Strict and room-scoped. Room responses must be private/no-store and no-referrer. Do not publish request/response captures containing capabilities.
- [ ] Exercise controlled quota rejection and a provider failure safely. No invalid proposal may be applied; manual planning must remain available. Review monitoring without storing briefs, cookies, invite tokens or raw provider errors.
- [ ] Verify repository/demo links signed out, record the 2–3 minute video, finish authentic team/learning details, recheck rules and eligibility, then request submission approval. Do not submit automatically.

## Known limits and rollback

Member revocation and account-based organizer recovery do not exist. Sessions last up to 30 days; invitation rotation affects future joins only. Use fictional, low-sensitivity data. Existing local room URLs and sessions are not automatically transferred to the hosted database/domain. Polling generates ongoing database reads; this is a small bounded prototype, not load-tested infrastructure. Bounded repair search cannot propose every multi-person repair (including three identical new volunteers in a bundle).

Keep the verified local demonstration as fallback. Roll back application code through Vercel if acceptance fails; the current migrations are additive and do not require deleting existing data. Disable the runtime AI credential to stop AI spending while retaining manual planning, or restrict deployment access during an incident. Do not delete database data or publish a broken build as a completed production verification.

**Current decision:** the public app, actual remote persistence, provider requests from Vercel, HTTPS, role UIs, mobile layouts, quotas and persistence across redeployment passed the checks in [production verification](PRODUCTION_VERIFICATION.md). The two-independent-browser same-room UI gate remains unverified, not passed. Checklist items combining verified and unverified actions remain open. Sustained multi-instance/load behavior is not established. Rotate the current DB token before December 19, 2026, 7:45 PM EST. No paid upgrade or Devpost submission is authorized.
