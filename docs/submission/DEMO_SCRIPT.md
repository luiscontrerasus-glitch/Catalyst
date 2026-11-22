# Final recorded narration

The final export is approximately 3:42, using Luis Contreras’s actual recorded voice. This transcript follows the edited recording; it is not an invented personal learning story. There is a two-second opening and a four-second closing hold. One unclear transition sentence was trimmed. Captions correct transcription homophones without synthesizing or replacing speech.

Hi, I'm Luis, and this is Catalyst. A lot of community

projects don't fail because people don't care.

They get stuck because coordinating everyone's time, skills, and resources is harder

than it looks. You might have volunteers and a great idea, but still be

missing the one thing that makes it possible.

Catalyst helps groups find that missing piece.

Let's say a student club wants to run a free robotics workshop for middle school

students. They have budget, materials, and people willing to help.

But can they actually run the event?

In Catalyst, the project is broken down into tasks, required roles,

supplies, and dependencies. Each volunteer has different skills,

qualifications, available times, and limits on how much work they can take on.

When I analyze the workshop, Catalyst finds that seven of the eight required roles

can be covered. The problem isn't simply the number of volunteers.

Two robotics labs are scheduled at the same time and one instructor can't be in both

places. Here's where Catalyst becomes especially useful.

Instead of just telling us the project isn't feasible, it explores possible changes

that could make the plan work. For example, it can suggest adding another

qualified instructor.

When I preview that change, Catalyst reruns its constraint solving algorithm.

It finds a complete assignment, and an independent verification system checks that

every assignment satisfies the project requirements.

Now all eight roles are covered. Importantly, this is a hypothetical preview.

It doesn't mean somebody has actually volunteered.

I can inspect a proposed solution before deciding whether or not to actually apply

it. But projects rarely ever actually go as expected.

Let's say one of our volunteers suddenly becomes unavailable.

Catalyst reevaluates the entire project, identifies a new shortage, and explores

other ways to resolve it. I can also experiment with changing volunteer

schedules, budgets, or available supplies, and immediately see how those changes

affect the plan. Catalyst also includes shared project rooms, where invited

participants can contribute their own skills, availability, and resources.

These contributions update the shared project model, and the activity

history keeps track of what has actually changed.

Organizer permissions also prevent participants from accidentally modifying

parts of the project that they don't control.

And creating a new project doesn't require filling out a complicated planning

spreadsheet. I can simply describe my idea in plain English.

Using Google Gemini, Catalyst suggests the tasks, roles, resources,

and other requirements that the project might potentially need.

But there's an important distinction here.

Gemini only proposes a plan. It doesn't make the final decisions, invent available

volunteers, or determine whether the project is feasible.

Instead, I can review the suggestions, correct any assumptions, and explicitly

approve the requirements. From there, Catalyst's deterministic mathematical

engine performs the actual analysis.

Behind the interface, we implemented constraint solving, independent assignment

verification, and a system that evaluates possible interventions.

We also tested the solver against 200 additional independently computed

comparison cases alongside 143 automated tests.

These tests help verify that Catalyst follows its mathematical rules, although a

feasible plan doesn't guarantee that a real -world event will succeed.

I developed Catalyst with assistance from Codex, while Gemini powers the optional

AI planning feature. The participants and projects shown in this demonstration

are just fictional examples. Ultimately, what I like most about Catalyst

is that it changes the question. Instead of asking, why can't we make this happen,

we can ask what exactly would make this possible.

Because sometimes the difference between an ambitious idea and a project that can

actually happen is just one missing contribution.
