import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { donation } from "../../src/data/scenarios";
import { solve } from "../../src/engine/solver";
import { verifyAssignment } from "../../src/engine/verify";
import { formatTime, slotsFor } from "../../src/engine/model";

// Local design studies only. No app routes, project state, or APIs are changed.
const directory = join(process.cwd(), "design-studies/homepage-options");
mkdirSync(directory, { recursive: true });
const result = solve(donation);
const verified = result.status === "feasible" &&
  verifyAssignment(donation, result.assignments).valid;
if (!verified) throw new Error("The fictional example must independently verify.");
const slots = slotsFor(donation);
const tasks = donation.tasks.map((task) => ({
  id: task.id,
  name: task.name,
  dependencies: task.dependencies,
  time: `${formatTime(task.start)}–${formatTime(task.end)}`,
  roles: task.roles.map((role) => `${role.count} ${role.name.toLowerCase()}${role.count > 1 ? "s" : ""}`).join(" · "),
  supplies: task.resources.map((need) => {
    const resource = donation.resources.find((r) => r.id === need.resourceId)!;
    return `${need.quantity} ${resource.name.toLowerCase()}`;
  }).join(" · ") || "No supplies required",
  people: result.assignments.filter((a) => slots.some((s) => s.id === a.slotId && s.task.id === task.id))
    .map((a) => donation.volunteers.find((v) => v.id === a.volunteerId)!.name),
}));
writeFileSync(join(directory, "project-data.js"), `export const project = ${JSON.stringify({
  title: "Community donation drive", tasks,
  coverage: `${result.filledSlots} of ${result.totalSlots} roles covered`,
  verified,
}, null, 2)};\n`);

for (const [option, family, filename] of [
  ["A", "Plus Jakarta Sans", "PlusJakartaSans.ttf"],
  ["B", "Manrope", "Manrope.ttf"],
]) {
  const alternate = option === "A" ? "b" : "a";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Catalyst — Option ${option} · ${family}</title>
  <link rel="preload" href="./fonts/${filename}" as="font" type="font/ttf" crossorigin>
  <style>@font-face { font-family: "Study"; src: url("./fonts/${filename}") format("truetype"); font-style: normal; font-weight: 200 800; font-display: swap; }</style>
  <link rel="stylesheet" href="./home.css">
  <script type="module" src="./home.js"></script>
</head>
<body data-option="${option}" data-typeface="${family}">
  <header class="site-header">
    <a href="#" class="brand" aria-label="Catalyst home">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 19a9 9 0 0 1 9-9h7v7a9 9 0 0 1-9 9H3z" fill="currentColor"/><path d="M17 3h12v5a8 8 0 0 1-8 8h-4z" fill="#93A480"/><path d="m10 19 12-9" stroke="#FCFBF7" stroke-width="1.5" stroke-linecap="round"/></svg>
      <span>Catalyst</span>
    </a>
    <nav aria-label="Main navigation">
      <a href="#how-it-works">How it works</a>
      <a href="#project">Explore a project</a>
    </nav>
    <a class="workspace-link" href="http://127.0.0.1:3100/#workspace">Open workspace <span aria-hidden="true">↗</span></a>
  </header>
  <main>
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow">Community starts with a plan</p>
        <h1 id="hero-title">Good ideas<br>deserve to<br><span>happen.</span></h1>
        <p class="supporting">Bring people, skills, and resources together. See what's missing and find a way forward.</p>
        <div class="hero-actions">
          <a class="primary-button" href="http://127.0.0.1:3100/#workspace">Plan a project <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>
          <a class="secondary-button" href="#how-it-works">See how it works</a>
        </div>
      </div>
      <section class="project-preview" id="project" aria-labelledby="project-title">
        <div class="project-heading"><h2 id="project-title">Community donation drive</h2><span>Fictional example</span></div>
        <div class="project-canvas" aria-label="Select a task in this real example project">
          <svg class="connections" viewBox="0 0 530 326" aria-hidden="true">
            <defs><marker id="arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1 6 4 1 7" fill="none" stroke="#87947C" stroke-width="1.5"/></marker></defs>
            <g id="dependency-lines"></g>
          </svg>
          <button type="button" class="task task-intake" data-task="intake" aria-pressed="false" aria-controls="task-details"><strong>Welcome &amp; collect</strong><span>09:00–10:00</span></button>
          <button type="button" class="task task-sorting selected" data-task="sorting" aria-pressed="true" aria-controls="task-details"><strong>Sort useful donations</strong><span>10:00–11:30</span></button>
          <button type="button" class="task task-delivery" data-task="delivery" aria-pressed="false" aria-controls="task-details"><strong>Deliver to the<br>community hub</strong><span>11:30–12:30</span></button>
        </div>
        <div class="project-result"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg><strong>${result.filledSlots} of ${result.totalSlots} roles covered</strong><span>Independently checked</span></div>
        <div class="task-details" id="task-details" aria-live="polite"><p class="detail-title">${tasks[1].roles}</p><p class="detail-supplies">${tasks[1].supplies}</p></div>
      </section>
    </section>
    <section class="how-it-works" id="how-it-works" aria-label="How Catalyst works">
      <article><h2>Make the plan clear.</h2><p>Map the work, the people, and the resources your idea needs.</p></article>
      <article><h2>Find your way forward.</h2><p>See what's missing and test a contribution before changing the plan.</p></article>
      <article><h2>Bring people together.</h2><p>Share a project room and turn individual contributions into a shared plan.</p></article>
    </section>
  </main>
  <footer class="study-footer"><span>Homepage study ${option} · ${family}</span><a href="./${alternate}.html">Compare option ${alternate.toUpperCase()} <span aria-hidden="true">→</span></a></footer>
</body>
</html>`;
  writeFileSync(join(directory, `${option.toLowerCase()}.html`), html);
}
console.log(JSON.stringify({ options: 2, model: "existing fictional donation scenario", independentVerification: verified, coverage: `${result.filledSlots}/${result.totalSlots}` }));
