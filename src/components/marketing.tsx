"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";
import { donation } from "@/data/scenarios";
import { formatTime } from "@/engine/model";
import { solve } from "@/engine/solver";
import { verifyAssignment } from "@/engine/verify";

// A real, fictional scenario. The visual uses the same engine as the workspace.
const example = solve(donation);
const verified = example.status === "feasible" &&
  verifyAssignment(donation, example.assignments).valid;

export function MarketingIntro({ onCreate }: { onCreate: () => void }) {
  const [selected, setSelected] = useState("sorting");
  const [connections, setConnections] = useState<string[]>([]);
  const canvas = useRef<HTMLDivElement>(null);
  const active = donation.tasks.find((task) => task.id === selected)!;

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    let mounted = true;
    function connect() {
      if (!mounted || !element) return;
      const frame = element.getBoundingClientRect();
      const paths: string[] = [];
      for (const task of donation.tasks) {
        const destination = element.querySelector(`[data-task="${task.id}"]`)!.getBoundingClientRect();
        for (const id of task.dependencies) {
          const source = element.querySelector(`[data-task="${id}"]`)!.getBoundingClientRect();
          const x1 = source.x + source.width / 2 - frame.x;
          const y1 = source.bottom - frame.y;
          const x2 = destination.x + destination.width / 2 - frame.x;
          const y2 = destination.top - frame.y - 3;
          const middle = (y1 + y2) / 2;
          paths.push(`M${x1} ${y1} C${x1} ${middle} ${x2} ${middle} ${x2} ${y2}`);
        }
      }
      setConnections(paths);
    }
    const observer = new ResizeObserver(connect);
    observer.observe(element);
    void document.fonts.ready.then(connect);
    return () => { mounted = false; observer.disconnect(); };
  }, []);

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Community starts with a plan</p>
          <h1 id="hero-title">Good ideas<br />deserve to<br /><span>happen.</span></h1>
          <p className="hero-supporting">Bring people, skills, and resources together. See what’s missing and find a way forward.</p>
          <div className="hero-actions">
            <button className="home-primary" onClick={onCreate}>Plan a project <ArrowRight size={20} /></button>
            <a className="home-secondary" href="#how-it-works">See how it works</a>
          </div>
        </div>
        <section className="home-project" aria-labelledby="home-project-title">
          <div className="home-project-heading"><h2 id="home-project-title">Community donation drive</h2><span>Fictional example</span></div>
          <div className="home-canvas" ref={canvas} aria-label="Explore a donation-drive project">
            <svg className="home-connections" aria-hidden="true">
              <defs><marker id="home-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1 6 4 1 7" fill="none" stroke="#87947C" strokeWidth="1.5" /></marker></defs>
              {connections.map((path, index) => <path key={index} d={path} markerEnd="url(#home-arrow)" />)}
            </svg>
            {donation.tasks.map((task) => (
              <button key={task.id} type="button" data-task={task.id} className={`home-task home-task-${task.id}${selected === task.id ? " selected" : ""}`} aria-pressed={selected === task.id} aria-controls="home-task-details" onClick={() => setSelected(task.id)}>
                <strong>{task.name}</strong><span>{formatTime(task.start)}–{formatTime(task.end)}</span>
              </button>
            ))}
          </div>
          <div className="home-result"><CircleCheck size={20} /><strong>{example.filledSlots} of {example.totalSlots} roles covered</strong><span>{verified ? "Independently checked" : "Review needed"}</span></div>
          <div className="home-details" id="home-task-details" aria-live="polite">
            <p className="home-detail-title">{active.roles.map((role) => `${role.count} ${role.name.toLowerCase()}${role.count > 1 ? "s" : ""}`).join(" · ")}</p>
            <p>{active.resources.length ? active.resources.map((need) => `${need.quantity} ${donation.resources.find((resource) => resource.id === need.resourceId)!.name.toLowerCase()}`).join(" · ") : "No supplies required"}</p>
          </div>
        </section>
      </section>
      <section className="how-it-works" id="how-it-works" aria-label="How Catalyst works">
        {[
          ["Make the plan clear.", "Map the work, people, and resources."],
          ["Find a way forward.", "See what’s missing. Test a contribution."],
          ["Build it together.", "Share a room and bring contributions together."],
        ].map(([title, copy]) => <article key={title}><h2>{title}</h2><p>{copy}</p></article>)}
      </section>
    </>
  );
}
