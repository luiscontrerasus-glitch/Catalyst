"use client";
import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  GitBranch,
  Layers3,
  Leaf,
  Play,
  ScanLine,
  Users,
  Wallet,
} from "lucide-react";
import { CatalystMark } from "./brand";

const dimensions = [
  {
    id: "people",
    title: "People & skills",
    detail:
      "Match each role to someone with the stated skills and qualifications.",
    icon: Users,
  },
  {
    id: "supplies",
    title: "Supplies",
    detail:
      "Check shared inventory against simultaneous demand and consumable needs.",
    icon: Layers3,
  },
  {
    id: "budget",
    title: "Budget",
    detail:
      "Compare the project’s planned expenses with the available funding.",
    icon: Wallet,
  },
  {
    id: "time",
    title: "Availability",
    detail:
      "Respect fixed task times, volunteer availability and workload limits.",
    icon: CalendarDays,
  },
  {
    id: "dependencies",
    title: "Dependencies",
    detail: "Make sure each prerequisite finishes before the next task begins.",
    icon: GitBranch,
  },
  {
    id: "verification",
    title: "Verification",
    detail:
      "Independently check a complete assignment before calling the modeled plan feasible.",
    icon: CheckCheck,
  },
] as const;

export function MarketingIntro({ onCreate }: { onCreate: () => void }) {
  const [selected, setSelected] = useState<string>("people");
  const active = dimensions.find((d) => d.id === selected)!;
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">COMMUNITY PROJECT PLANNING</p>
          <h1 id="hero-title">
            Turn community
            <br />
            ideas into
            <br />
            <em>feasible plans.</em>
          </h1>
          <p>
            Bring people, time, and resources into one clear picture. Find
            what’s missing—and test the contribution that could move your
            project forward.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={onCreate}>
              Plan a project <ArrowRight size={17} />
            </button>
            <a className="button secondary" href="#workspace">
              <Play size={13} fill="currentColor" /> Explore the demo
            </a>
          </div>
          <p className="hero-footnote">
            AI suggests. Catalyst verifies. You decide.
          </p>
        </div>
        <div className="model-illustration">
          <div className="model-caption">
            <span>ONE CONNECTED PLAN</span>
            <span>
              Explore the model <ArrowUpRight size={13} />
            </span>
          </div>
          <div
            className="model-canvas"
            aria-label="Interactive explanation of the Catalyst project model"
          >
            <svg
              className="model-lines"
              viewBox="0 0 600 390"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M130 68 C230 68 190 193 300 193 M111 193 H300 M130 318 C230 318 190 193 300 193 M470 68 C370 68 410 193 300 193 M489 193 H300 M470 318 C370 318 410 193 300 193" />
            </svg>
            <div className="model-center">
              <CatalystMark size={37} />
              <strong>
                Your community
                <br />
                project
              </strong>
              <span>A plan to test, together</span>
            </div>
            {dimensions.map(({ id, title, icon: Icon }) => (
              <button
                key={id}
                className={`model-node model-node-${id} ${selected === id ? "selected" : ""}`}
                onClick={() => setSelected(id)}
                aria-pressed={selected === id}
                aria-controls="model-explanation"
              >
                <Icon size={20} />
                <span>{title}</span>
              </button>
            ))}
          </div>
          <div
            className="model-explanation"
            id="model-explanation"
            aria-live="polite"
          >
            <active.icon size={17} />
            <p>
              <strong>{active.title}.</strong> {active.detail}
            </p>
          </div>
        </div>
      </section>
      <section
        id="how-it-works"
        className="principles"
        aria-label="How Catalyst works"
      >
        {[
          {
            title: "Model the project",
            text: "Map the tasks, people, supplies, and budget your idea needs.",
            icon: GitBranch,
          },
          {
            title: "Test feasibility",
            text: "See which requirements are satisfied—and which are not.",
            icon: ScanLine,
          },
          {
            title: "Find a way forward",
            text: "Preview a specific repair, re-solved and independently checked.",
            icon: CheckCheck,
          },
          {
            title: "Bring people together",
            text: "Share a room and turn individual contributions into model inputs.",
            icon: Users,
          },
        ].map(({ title, text, icon: Icon }, i) => (
          <article key={title}>
            <div className="principle-top">
              <Icon size={25} strokeWidth={1.5} />
              <span>0{i + 1}</span>
            </div>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>
      <section className="community-story" aria-labelledby="community-title">
        <figure>
          <Image
            src="/images/community-garden.png"
            alt="Original illustration of neighbors discussing a garden plan and tending raised beds together"
            width={1774}
            height={887}
            sizes="(max-width: 760px) 100vw, 55vw"
            loading="eager"
          />
          <figcaption>
            Original illustration · an imagined community garden
          </figcaption>
        </figure>
        <div>
          <p className="eyebrow">FROM AN IDEA TO A SHARED PLAN</p>
          <h2 id="community-title">
            Good plans start
            <br />
            with people.
          </h2>
          <p>
            A workshop needs an instructor. A cleanup needs shared tools. A
            donation drive needs a driver. Catalyst helps you see the
            contribution in the context of the whole plan.
          </p>
          <a className="text-link" href="#workspace">
            Find your project’s turning point <ArrowRight size={16} />
          </a>
          <Leaf
            className="story-leaf"
            size={55}
            strokeWidth={1}
            aria-hidden="true"
          />
        </div>
      </section>
    </>
  );
}
