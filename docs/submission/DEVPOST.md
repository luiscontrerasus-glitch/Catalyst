## Inspiration

A community project can have enthusiasm, volunteers, and supplies—and still be blocked. One person may have the right skill but the wrong availability. Two activities may need the same equipment at the same time. A useful plan should explain the missing contribution, not just produce a longer checklist.

Catalyst asks: **what exactly would make this possible?**

## What it does

Catalyst turns a project into connected tasks, required roles, volunteer commitments, supplies, costs, and dependencies. It checks the model, explains bottlenecks, and tests hypothetical changes.

In the fictional robotics workshop, seven of eight roles can be covered. Two labs run simultaneously, so one qualified instructor cannot cover both. Previewing another instructor reruns the constraint solver and independently checks a complete eight-role assignment. It is a modeled repair, not a claim that someone has volunteered.

The what-if workspace also tests withdrawals, availability, funding, supplies, and scope changes. Shared rooms let invited participants contribute their own declared skills, availability, and existing supplies. Saved contributions update the model and activity history. Organizers control project requirements; contributors cannot replace them.

## How it works

**AI proposes. Catalyst verifies.**

Google Gemini turns a natural-language brief into structured suggested requirements, quoted evidence, assumptions, and questions. The server validates the output. People review and edit the draft, then explicitly approve it before analysis. Gemini does not invent a committed roster or owned inventory, and it does not determine feasibility.

A bounded constraint solver assigns people to fixed-time role slots while checking skills, declared qualifications, availability, workload limits, overlapping work, supplies, budget, and dependencies. A separate verifier checks complete assignment certificates. Candidate repairs are applied to copies, solved again, checked, and ranked using disclosed assumptions. This does not prove a globally smallest or cheapest repair.

## How it was built

Next.js, React, and TypeScript power the interface; React Flow renders dependency graphs; Zod validates inputs and Gemini proposals. The official Google GenAI SDK calls Gemini server-side. Vercel Hobby hosts the Node.js application, and Turso Free/libSQL provides persistent shared-room storage. Local development can use SQLite. Credentials stay on the server.

Room sessions use HttpOnly cookies, hashed invitation tokens, revision checks, safe retry identifiers, and database-backed quotas. Polling keeps connected views current. A participant's declaration remains self-reported; joining a room is not a volunteer commitment.

## Challenges and accomplishments

The build had to preserve the difference between a plausible suggestion and a checked result. Overlapping roles require more than a greedy headcount; independent verification catches invalid assignments. Gemini's initial structured-output schema exceeded provider limits, so the provider grammar was simplified while strict application validation stayed in place. Serverless hosting also required explicit managed persistence instead of assuming local SQLite would survive.

The working public product includes custom plans, real Gemini drafting, repair previews, shared rooms, and a cohesive desktop/mobile interface. Verification includes **143 automated tests**, **19 solver fixtures**, **200 independently computed small oracle comparisons**, and verified repairs on **12/12 defined repairable fixtures**. The deployed redesign also passed **19 hosted room API checks** and **27 HTTPS/security/input checks**.

## Lessons and next steps

Three principles shaped the project: make assumptions visible, separate AI suggestions from authority, and test claims against an independent check. Interface review also showed how clearer typography and shorter copy make technical reasoning easier to follow.

Next steps are organizer recovery, member revocation, deeper repair search, and feedback from real community organizers. These are future work, not existing features.

## Honest limits

All demo projects, participant counts, names, and contributions are fictional. No actual users, measured impact, or successful events are claimed. Feasibility applies to the entered mathematical requirements; it cannot guarantee safety, authentic qualifications, attendance, or real-world success. AI suggestions still need semantic review.

Independent hosted API sessions and separate role interfaces were checked. **Two independently authenticated browser UIs collaborating in the same hosted room remain unverified** because the available browser does not provide isolated contexts. API checks do not replace that gate. Invitation rotation affects future joins, not existing sessions. Member revocation and account-based organizer recovery are not implemented.

## AI assistance and individual contribution

**Primary track: Community Impact. Solo project by Luis Contreras.** Luis directed the project requirements and visual review and recorded the demo narration. **OpenAI Codex contributed substantially to architecture, implementation, interface design, fictional fixtures, testing, debugging, deployment preparation, and documentation.** Google Gemini powers the optional runtime drafting feature. The narration uses Luis's actual recording, not a synthesized voice.

Libraries and font licenses are credited in the repository. No generated mockup or fabricated customer result is presented as evidence.

Live app: https://catalyst-luiscontrerasus-glitch.vercel.app

Source: https://github.com/luiscontrerasus-glitch/Catalyst
