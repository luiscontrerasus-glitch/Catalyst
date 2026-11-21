"use client";
import { useState } from "react";
import { ArrowRight, CalendarDays, GitBranch, Layers3, Users } from "lucide-react";

const dimensions = [
  { id: "people", title: "People", icon: Users, detail: "Match people’s skills, qualifications, and availability to each role." },
  { id: "resources", title: "Resources", icon: Layers3, detail: "Check supplies and planned expenses against inventory and budget." },
  { id: "time", title: "Time", icon: CalendarDays, detail: "Respect task times, availability, and workload limits." },
  { id: "dependencies", title: "Dependencies", icon: GitBranch, detail: "Check that prerequisites finish before the next task begins." },
] as const;

export function MarketingIntro({ onCreate }: { onCreate: () => void }) {
  const [selected, setSelected] = useState<string>("people");
  const active = dimensions.find((d) => d.id === selected)!;
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">COMMUNITY PROJECT PLANNING</p>
          <h1 id="hero-title">Turn community<br />ideas into<br /><span>feasible plans.</span></h1>
          <p>Bring people, time, and resources into one clear plan. See what’s missing and find a way forward.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={onCreate}>Plan a project <ArrowRight size={16} /></button>
            <a className="text-link" href="#workspace">Explore the demo <ArrowRight size={15} /></a>
          </div>
        </div>
        <div className="model-illustration">
          <div className="model-canvas" aria-label="Interactive explanation of a community project model">
            <svg className="model-lines" viewBox="0 0 560 360" preserveAspectRatio="none" aria-hidden="true">
              <path d="M110 90 C195 90 170 180 280 180 M110 270 C195 270 170 180 280 180 M450 90 C365 90 390 180 280 180 M450 270 C365 270 390 180 280 180" />
            </svg>
            <div className="model-center"><span>A community</span><strong>project</strong></div>
            {dimensions.map(({ id, title, icon: Icon }) => (
              <button key={id} className={`model-node model-node-${id} ${selected === id ? "selected" : ""}`} onClick={() => setSelected(id)} aria-pressed={selected === id} aria-controls="model-explanation"><Icon size={18} strokeWidth={1.5} /><span>{title}</span></button>
            ))}
          </div>
          <p className="model-explanation" id="model-explanation" aria-live="polite"><strong>{active.title}.</strong> {active.detail}</p>
        </div>
      </section>
      <section id="how-it-works" className="principles" aria-label="How Catalyst works">
        {[
          ["Model", "Define the tasks, people, and resources."],
          ["Analyze", "Find the requirements that need attention."],
          ["Explore", "Test a contribution before changing the plan."],
          ["Collaborate", "Bring everyone’s contributions together."],
        ].map(([title, text]) => <article key={title}><h2>{title}</h2><p>{text}</p></article>)}
      </section>
    </>
  );
}
