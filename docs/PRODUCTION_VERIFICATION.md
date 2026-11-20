# Production deployment verification

Owner approved publication on November 19, 2026: `luiscontrerasus-glitch/Catalyst`, Vercel Hobby and Turso Free only. No billing, paid upgrades or Devpost submission is authorized.

## Source publication

- Public repository: https://github.com/luiscontrerasus-glitch/Catalyst
- Verified release commit: `ae74f2020acac2ca7f4979413790bcd278305390`.
- Existing ten-commit history pushed to `main`; remote ref verified with Git.
- Signed-out browser displays the public repository and tested commit.
- Release secret scan: no configured-key/Google-key matches in source, browser bundles or history. Credentials and room databases remain ignored.
- `.vercelignore` additionally excludes local configuration, databases and deployment tools from CLI uploads.

## Hosted acceptance status

Not deployed yet. Vercel is signed in, but GitHub import requires its GitHub connection; CLI access is being checked. Turso requires owner sign-in before a Free libSQL database can be created. No hosted success is claimed from local results.

Pending: real Gemini, custom projects/approval, solver/interventions, two independent browsers, database persistence, invitations/roles, stale writes, desktop/mobile, HTTPS/credentials and safe production failures. Full procedure: [VERCEL_HANDOFF.md](VERCEL_HANDOFF.md).

Local release: 143 tests, lint/typecheck/build, 19/19 room checks, 19/19 benchmark outcomes and 200/200 oracle comparisons. Historical real Gemini ledger: four accepted proposals and nine earlier unsuccessful attempts on `gemini-3.5-flash-lite`. No hosted request attempted yet.

Organizer recovery and member revocation remain unimplemented; invitation rotation does not revoke existing sessions. [Local checkpoint](FINAL_VERIFICATION.md).
