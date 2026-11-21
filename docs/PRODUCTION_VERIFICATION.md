# Production verification — November 21, 2026

**Live app:** https://catalyst-luiscontrerasus-glitch.vercel.app

**Public source:** https://github.com/luiscontrerasus-glitch/Catalyst

The owner authorized GitHub publication, Vercel Hobby and Turso Free. The core hosted workflow works. No billing was enabled, paid resource provisioned, or Devpost entry submitted. This remains a bounded prototype for fictional, low-sensitivity planning data, with the browser verification gap below.

## Actual deployed configuration

- GitHub `main` is connected to Vercel project `catalyst-luiscontrerasus-glitch`, team `luis-0239`. The actual team plan is Hobby. Node 24.x, Next.js 16.4.6, React 19.3.1; cloud build, type validation and preflight pass. Cloud `npm ci` reported zero vulnerabilities.
- All six values were privately configured as sensitive, Production-only variables: `GEMINI_API_KEY`, `GEMINI_MODEL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `APP_ORIGIN`, `REQUIRE_MANAGED_ROOMS`. Production credentials are absent from Preview/Development. No `NEXT_PUBLIC_` credentials exist.
- `APP_ORIGIN` exactly matches the live HTTPS origin above; `REQUIRE_MANAGED_ROOMS=true`. Gemini uses `gemini-3.5-flash-lite`, official SDK 3.6.1.
- Turso Free database `catalyst-production` uses libSQL and HTTP, near the US East/Virginia functions. Real atomic, replay-safe migrations succeeded at schema version 2. Rooms, capability hashes, members, revisions, activity, deduplication and quotas live remotely; serverless shared data does not depend on disk or browser localStorage.
- The first cloud build failed because unanchored `.vercelignore` entry `data` excluded `src/data`. Commit `530cce8` fixed this to `/data/`, retaining source while excluding local databases. It added framing, content-type and referrer protections. Its Git-triggered deployment is READY; subsequent evidence-only commits retain those runtime changes.
- Production health returns `status:ok, rooms:managed`. No additional account or credential is needed for the live deployment.

Rotate the database-scoped Read & Write token before **December 19, 2026, 7:45 PM EST** (expiry December 20, 00:45 UTC). Update the Production secret, redeploy and check managed health. No reminder or automatic rotation is configured.

## Real Gemini results

Two additional public Vercel requests were accepted on **`gemini-3.5-flash-lite`**:

1. Browser reading-circle brief → live proposal → human review/edit → explicit approval → deterministic 0/1 staffing gap → reviewed fictional volunteer → independently verified 1/1. Approval required confirmation. An unrequested preparation task was removed in review; questions sometimes repeat known facts.
2. Hosted ambiguous-cleanup API request: HTTP 200 in 2,595 ms; three assumptions, seven questions, no invented roster/owned inventory, approval required, and expected infeasibility without commitments. [Artifact](evaluations/hosted-ai-latest.json).

The full observed [ledger](evaluations/ai-call-ledger.json) is **15 provider-reaching application attempts: 6 accepted proposals, 7 provider errors, 2 returned responses rejected by strict validation**. The nine unsuccessful attempts were earlier schema-debugging outcomes and remain disclosed.

Controlled invalid-input/origin/quota probes made no Gemini calls. A browser request during the quota window showed a sanitized rate-limit message, preserved its brief and allowed manual task creation. Actual current credential rejection, timeout and provider outage were not deliberately induced publicly; labeled unit tests cover those branches and invalid-output rejection. No raw provider error is returned/logged. Schema acceptance does not prove semantic truth; review remains necessary.

## Actual browser coverage

The built-in Codex browser exercised the public HTTPS UI:

- Robotics 7/8 → independently verified 8/8 repair preview → apply → reset.
- New AI-assisted custom project: review/edit, explicit approval, infeasible analysis, fictional volunteer, reapproval, feasible result, mobile editing and reload persistence.
- Desktop and 390×844 mobile editing/contribution/reload with no document horizontal overflow; task selection complements the graph.
- Organizer created a managed room, contributed qualified availability and supplies, and retained role, activity, revision and verified 8/8 after reload and an actual server redeployment.
- A bare second room denied entry. Opening its real invitation on the same page exposed joining without manual reload, then removed the fragment. The contributor saved availability/supplies, retained role/revision/activity after reload/redeployment, and had no organizer editing/invite controls.
- An independent API organizer changed that contributor room's budget; its browser synchronized to a shortfall. Repair preview worked; Apply was disabled with “Only the organizer can apply this repair.” Restored budget synchronized back to feasible.
- Same-session organizer tabs synchronized a newer contribution. Stale approval visibly failed without losing the draft or overwriting the newer revision. These tabs share authentication.
- Organizer-generated invitation used the canonical HTTPS origin and fragment capability; it was hidden before screenshots.

**Two independently authenticated browser UIs in the same production room are NOT verified.** The built-in browser provides one profile, no isolated-context capability; explicit context creation returned unsupported. Organizer/contributor interfaces were therefore tested in separate fictional rooms, with an API organizer for the contributor room. API tests do not replace this missing UI gate. Earlier native-Brave/in-app passes remain historical local evidence only. The owner need not open Brave for this report.

## Test results

| Check | Observed result |
| --- | --- |
| Unit/integration suite | **143/143**, 15 files; original 100 preserved |
| Lint / TypeScript | Pass |
| Vercel build / production preflight | Pass, Node 24, managed DB, HTTPS origin, private key detection |
| Real hosted room API | **19/19**, distinct cookie sessions, contributions, roles, stale writes, retry safety, activity, invite replacement ([artifact](evaluations/hosted-rooms-latest.json)) |
| Real remote Turso HTTP | **10/10**, concurrent transactions, fresh-connection persistence, shared atomic quotas ([artifact](evaluations/managed-db-latest.json)) |
| Hosted security / invalid input | **27/27** ([artifact](evaluations/hosted-security-latest.json)) |
| Solver benchmark | **19/19** outcomes, **200/200** extra oracle matches, **12/12** defined repairable fixtures |
| Credential exposure | Zero exact key/token matches in actual public HTML and 11 fetched JS assets; source/local bundles/Git history scanned separately |

HTTPS checks observed HTTP→HTTPS 308, HSTS, `nosniff`, framing denial, room `no-referrer`, private/no-store APIs, HttpOnly/Secure/SameSite=Strict room cookies, unauthenticated/foreign-origin denial, and 404 for private configuration/database paths. Managed AI quota returned 429 and `Retry-After:60`. Room endpoints use the managed 120-write/minute quota: unit boundary tests and real remote quota transactions cover wiring/persistence; the live app was not flooded with 121 writes.

These overlapping groups are not added into a misleading aggregate test count. [Screenshots](screenshots/production/) contain fictional data without invitations/credentials. [UI record](evaluations/hosted-browser-latest.json).

## Remaining limits and competition assessment

- **Verification gap:** two independent same-room browser UIs. Long-duration uptime, sustained load and real multi-region scalability are not established. Polling consumes DB reads; shared fixed-window quotas are not comprehensive abuse protection.
- **Access lifecycle:** no member revocation or account-based organizer recovery. Invitation rotation stops new joins, not existing sessions, which can last 30 days. Protect the organizer session. Display names/qualifications are unverified declarations.
- **Engine:** bounded repair search cannot propose three identical new volunteers in a single bundle; no globally minimal repair is claimed. Model/node limits remain documented. Feasible means satisfiable entered requirements, not safety, turnout or actual commitments.
- **AI:** review invented requirements, times, assumptions and redundant questions. No automatic approval or fabricated commitments. Future provider/quota failures can still occur; manual creation remains available.

The core hosted demonstration is ready, with its strongest evidence in the independently checked contribution/repair workflow. Further features are unnecessary for the deadline. Full production acceptance is **not** claimed because of the browser gap. No deployment credential blocker remains. Authentic learning, clear presentation and disclosure still require human work.

## Exact remaining submission work

[Official rules](https://stem2connect-online-hackathon.devpost.com/rules) and [event page](https://stem2connect-online-hackathon.devpost.com/) were rechecked November 21. **Deadline: November 21, 2026, 11:59 PM EST.**

1. Confirm student eligibility (13+), team size up to six, registration and applicable guardian permissions. Add actual members and authentic contributions/learning; the agent cannot establish these facts.
2. Human-review code, credits and [AI disclosure](AI_DISCLOSURE.md). Use the [Devpost draft](submission/DEVPOST.md), selecting Community Impact, and preserve the production-browser limitation.
3. Record the [2–3 minute demo](submission/DEMO_SCRIPT.md), publish it on YouTube/Vimeo publicly or unlisted, and check signed out. Rules cap the video at six minutes. Recording/video publication has not occurred.
4. Complete Devpost with app, public GitHub, video, problem/AI/learning narrative, track and members; check all links. Submit personally before the deadline or explicitly authorize that separate action. **No Devpost submission occurred.**
5. Follow organizer instructions for the November 24 live/prerecorded Demo Day presentation. A second event requires its own eligibility/rules review; cross-submission permission is not claimed.
