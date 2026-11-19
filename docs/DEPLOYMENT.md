# Deployment preparation — no publication performed

The Node production build is the release artifact. Dockerfile and Compose are provided as an unexecuted deployment recipe; no container or hosted deployment is claimed verified. Use a single persistent Node server for file-based rooms, or a managed libSQL/Turso database for ephemeral or multiple instances. The implementation uses the official [libSQL TypeScript client](https://docs.turso.tech/sdk/ts/reference); Turso offers a [free plan](https://turso.tech/pricing), subject to current provider limits. No account has been created.

Latest local production evidence, real Gemini results and remaining gates are in [final verification](FINAL_VERIFICATION.md). Docker Compose configuration now validates, and the nonexistent `public` asset copy was removed from the image recipe. The installed Docker Linux engine is unavailable, so container execution remains unverified. The owner confirmed that hosting is not configured and instructed local preparation only.

## Environment

Copy `.env.example` to `.env.local` in Catalyst only. Real values must stay in ignored local configuration or the hosting provider's server-side secrets manager.

| Variable                | Purpose                                                                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GEMINI_API_KEY`        | Optional Gemini drafting credential; `GOOGLE_API_KEY` is an accepted fallback. Missing key keeps manual planning functional.                                                                   |
| `GEMINI_MODEL`          | Defaults to `gemini-3.5-flash-lite`; verify access with `npm run evaluate:ai`.                                                                                                                 |
| `APP_ORIGIN`            | Exact browser-facing origin, e.g. `https://your-host.example`, without a path. Set for every production deployment. Same-origin mutations are enforced and HTTPS makes session cookies Secure. |
| `TURSO_DATABASE_URL`    | Optional managed database URL, `libsql://…` or `https://…`.                                                                                                                                    |
| `TURSO_AUTH_TOKEN`      | Required with the managed URL; database credential remains server-side.                                                                                                                        |
| `REQUIRE_MANAGED_ROOMS` | Set `true` on ephemeral/serverless/multiple-instance hosting. Missing managed configuration fails shared-room health instead of quietly using temporary SQLite.                                |

Do not use `NEXT_PUBLIC_` secrets. Pin `APP_ORIGIN` at the reverse proxy's public HTTPS origin; untrusted forwarded headers do not determine authorization. Preserve the browser Host at the proxy. Shared responses are private/no-store; room pages use no-referrer. Keep API access logs free of cookies, request bodies and invitation fragments. No database credential is sent to clients.

## Local production rehearsal

```powershell
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm start
# In a second terminal while the server runs:
npm run evaluate:rooms
```

The start script binds `127.0.0.1:3100`. `/api/health` checks actual database initialization. File storage is `data/catalyst.db`; it must survive restarts. Back up the database using a SQLite-consistent backup or stop the application before copying all required database files. Database backups contain project data and hashed access capabilities; protect them.

## Container recipe

After `.env.local` exists, `docker compose up --build` runs a non-root Node 24 server with a named persistent volume and loopback-only host binding. The internal server listens on port 3100; public exposure requires a separately approved HTTPS proxy/hosting configuration. Container build excludes environment secrets, databases, Git, and screenshots. Keep secrets out of build arguments and image layers. Docker/container execution remains unverified in this environment.

For managed hosting, configure both Turso variables, `REQUIRE_MANAGED_ROOMS=true`, and `APP_ORIGIN`. Run one staging instance first, check health, create a fictional room, and verify two genuinely independent browsers, contributions, stale editor behavior, reconnect, restart, and invitation replacement. Then check all active instances observe the same revision. Remote transaction behavior and hosting-specific native package support remain release gates.

## Operational limits and release decision

- Session-based display names, not identity verification. Qualifications are declarations, not credential checks. No sensitive/minor participant information is needed.
- Invitation seven days; sessions 30 days. Rotating invites does not revoke joined members. No organizer recovery, member-removal UI, room deletion UI, scheduled cleanup, distributed abuse controls, or audited production authentication.
- Process-local request limits are prototype safeguards, not distributed rate limiting. Avoid an unrestricted production launch without hosting-level limits.
- Polling every two seconds; no websocket or instant-sync guarantee. A disconnected browser retains its last received model and disables contribution buttons.
- Exact search and intervention generation run in the browser with bounded model/search limits. Benchmark results cover small fixtures only.
- Local planning remains available if shared storage fails. Preserve it as the demonstration fallback until independent-browser/mobile checks pass.

**Release status:** configuration prepared; public deployment not authorized or performed. Do not call this publicly production-ready until the remaining gates in the submission checklist pass.
