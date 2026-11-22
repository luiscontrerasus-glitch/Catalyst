## Inspiration

A community project can have plenty of enthusiasm and still be one contribution away from working. An instructor might have the right skills but be needed in two places at once. Supplies might be available, but not enough for overlapping activities.

I conceived Catalyst around a practical question: **what contribution would make this project possible?** I wanted a planning tool that could explain a blocked plan and test a way forward.

## What it does

Catalyst connects tasks, people, skills, supplies, budget, and dependencies in one project model. Organizers can create a custom plan, inspect its bottlenecks, and preview changes before applying them.

The robotics demo makes this concrete: seven of eight required roles can be covered, but two simultaneous labs need another qualified instructor. Previewing that contribution reruns the solver and produces an independently verified eight-role assignment. A hypothetical repair shows what would help; it does not recruit a volunteer.

Shared rooms bring the model back to people. Invited participants enter their own skills, availability, and existing supplies. Saved contributions update the plan and activity history, while organizers retain control of project requirements. The goal is to help someone see where their particular contribution could matter.

## The feasibility engine

The core is a deterministic constraint solver. It searches assignments against fixed task times, skills, declared qualifications, availability, workload, overlapping work, supplies, budget, and dependencies. A separate verifier checks successful assignments against the requirements.

Counterfactual analysis applies candidate changes to copies of the model, solves them again, verifies the result, and ranks useful repairs. This makes the explanation testable: the proposed change has to produce a checked result.

Google Gemini provides an optional starting point. It turns a brief into suggested requirements with quoted evidence, assumptions, and questions. The server validates the response, and the user reviews, edits, and explicitly approves the model before analysis. Available volunteers and owned supplies come from entered commitments, not AI guesses.

## Development challenges

One engineering challenge was avoiding misleading headcounts. A plan may have enough people overall and still fail because the same specialist is required for simultaneous tasks. Independent assignment verification and small cases checked against a separate reference calculation were important evaluation priorities.

Another challenge was Gemini's structured output: the initial schema exceeded provider limits. The provider schema was simplified while strict application validation remained in place. Production collaboration also required persistent Turso storage rather than relying on local SQLite files surviving serverless deployments.

I directed repeated interface revisions to make those technical results easier to understand: a clear graph, readable findings, shorter copy, and a visible distinction between a draft, a hypothetical repair, and an entered contribution.

The application uses Next.js, React, TypeScript, React Flow, and Zod, with server-side Gemini integration, Vercel Hobby hosting, and Turso Free/libSQL storage. Room permissions, revision checks, and persistent activity history support shared planning.

## Testing and results

Verification includes **143 passing automated tests**, **19 solver fixtures**, **200 additional small cases matched against an independent reference calculation**, and verified repairs on **12/12 defined repairable fixtures**. Hosted checks passed for room APIs (19), managed storage (10), and HTTPS, security, and input handling (27). The demo captures a real production Gemini draft followed by human review and deterministic analysis.

## Current limits and next steps

The examples use fictional projects and participants; no real-world users or measured impact are claimed. Feasibility describes the entered model, not a guarantee of attendance, safety, or authentic qualifications. Repair search is bounded, so it does not prove a globally smallest or cheapest fix.

Independent API sessions and separate role interfaces were tested; the hosted same-room test with two independently authenticated browser UIs remains unverified. Member revocation and account-based organizer recovery are future work. Rotating an invitation blocks new joins through the old link but does not revoke existing sessions.

The next priorities are completing that browser acceptance test, improving recovery and membership controls, and getting feedback from community organizers.

## My role and AI assistance

I created Catalyst as a solo project, developing the concept and directing its product requirements, technical priorities, and design through repeated review and iteration. I used OpenAI Codex extensively as an AI coding assistant for architecture, implementation, debugging, testing, and development workflows. Google Gemini powers the optional AI-assisted project drafting feature; a separate deterministic solver handles feasibility analysis. I reviewed the results, guided revisions, and recorded the final demo narration.

Libraries and font licenses are credited in the [repository](https://github.com/luiscontrerasus-glitch/Catalyst).
