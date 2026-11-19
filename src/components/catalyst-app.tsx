"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Activity,
  Beaker,
  Check,
  CircleAlert,
  Clock3,
  Code2,
  Download,
  FlaskConical,
  GitBranch,
  HeartHandshake,
  Layers3,
  Leaf,
  Menu,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { ProjectGraph } from "./project-graph";
import { CreateRoomDialog } from "./create-room";
import { AnalysisSummary } from "./analysis-summary";
import { scenarioFor } from "@/data/scenarios";
import { blankProject } from "@/lib/projects";
import { Modal } from "./dialog";
import { ProjectEditor } from "./project-editor";
import { InterventionOptions, InterventionPreview } from "./intervention-lab";
import {
  formatTime,
  money,
  slotsFor,
  type Project,
  type SolveResult,
  type Volunteer,
} from "@/engine/model";
import {
  analyzeInterventions,
  applyIntervention,
  type Intervention,
} from "@/engine/interventions";
import { resourceDemand, solve } from "@/engine/solver";
import { verifyAssignment } from "@/engine/verify";
import {
  getProjectSnapshot,
  getServerSnapshot,
  persistProject,
  subscribeProject,
  dispatchWorkspace,
} from "@/lib/persistence";

type Tab = "overview" | "people" | "resources" | "lab";
const skillName = (s: string) => s.replaceAll("_", " ");

function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`brand ${light ? "light" : ""}`}
      href="#"
      aria-label="Catalyst home"
    >
      <span className="brand-mark">
        <Zap size={22} fill="currentColor" />
      </span>
      catalyst<span className="brand-period">.</span>
    </a>
  );
}

export default function CatalystApp() {
  const stored = useSyncExternalStore(
    subscribeProject,
    getProjectSnapshot,
    getServerSnapshot,
  );
  const project = stored.project;
  const scenario = scenarioFor(project.id);
  const baselineProject = stored.workspace.baselines[project.id];
  const [editor, setEditor] = useState<Project | null>(null);
  const [editorStep, setEditorStep] = useState(0);
  const [preview, setPreview] = useState<Intervention | null>(null);
  function createProject() {
    if (stored.workspace.projects.length >= 30) {
      setNotice(
        "This local workspace supports up to 30 projects. You can continue editing existing projects.",
      );
      return;
    }
    setEditorStep(0);
    setEditor(blankProject(`project-${crypto.randomUUID()}`));
  }
  function editProject(step = 0) {
    setEditorStep(step);
    setEditor(project);
  }
  function switchProject(id: string) {
    dispatchWorkspace({ type: "select", id });
    setBefore(null);
    setLastAction("No experiments in this session yet.");
    setSelectedTask("");
    setTab("overview");
    setNotice("Project switched. Its saved model has been re-solved.");
  }
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedTask, setSelectedTask] = useState("lab-b");
  const [before, setBefore] = useState<SolveResult | null>(null);
  const [lastAction, setLastAction] = useState(
    "No experiments in this session yet.",
  );
  const [notice, setNotice] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showRoom, setShowRoom] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const result = useMemo(() => solve(project), [project]);
  const comparison = before ?? result;
  const interventions = useMemo(
    () => analyzeInterventions(project, result, { combinations: true }),
    [project, result],
  );
  const verified = useMemo(
    () =>
      result.status === "feasible" &&
      verifyAssignment(project, result.assignments).valid,
    [project, result],
  );
  const slots = useMemo(() => slotsFor(project), [project]);
  function update(next: Project, action: string) {
    setBefore(result);
    persistProject(next);
    setLastAction(action);
    setNotice(action);
  }
  function simulate(i: Intervention) {
    update(
      applyIntervention(project, i),
      `Simulated: ${i.label.toLowerCase()}`,
    );
  }
  function withdraw(v: Volunteer) {
    update(
      {
        ...project,
        volunteers: project.volunteers.filter((x) => x.id !== v.id),
      },
      `${v.name} withdrew. Plan recomputed.`,
    );
  }
  function reset() {
    setBefore(result);
    dispatchWorkspace({ type: "reset" });
    setLastAction("Approved baseline restored");
    setNotice("Approved baseline restored. Plan recomputed.");
    setSelectedTask("");
  }
  function exportPlan() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "catalyst-certificate-v1",
            project,
            result,
            verification: verifyAssignment(project, result.assignments),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `catalyst-${project.id}-plan.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Project, solver result, and verification exported as JSON.");
  }
  const selected =
    project.tasks.find((t) => t.id === selectedTask) ?? project.tasks[0];
  const primary = interventions[0];
  const allOriginalPresent = baselineProject.volunteers.every((v) =>
    project.volunteers.some((x) => x.id === v.id),
  );

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav
            className={mobileMenu ? "nav open" : "nav"}
            aria-label="Main navigation"
          >
            <a href="#how-it-works" onClick={() => setMobileMenu(false)}>
              The idea
            </a>
            <a href="#workspace" onClick={() => setMobileMenu(false)}>
              Explore the demo
            </a>
            <button
              onClick={() => {
                setShowMethod(true);
                setMobileMenu(false);
              }}
            >
              Under the hood <Code2 size={14} />
            </button>
          </nav>
          <button className="header-cta" onClick={createProject}>
            Create a project <Plus size={16} />
          </button>
          <button
            className="mobile-toggle icon-button"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="small-spark">✳</span> GOOD IDEAS DESERVE A WAY
              FORWARD
            </div>
            <h1>
              Big ideas.
              <br />
              Real people.
              <br />
              <span>Possible, together.</span>
            </h1>
            <p>
              Turn ideas into collective action. Find what your community
              project needs, see what’s holding it back, and discover the
              contribution that changes everything.
            </p>
            <div className="hero-actions">
              <button className="button primary" onClick={createProject}>
                <Plus size={18} />
                Create a project
              </button>
              <a className="button secondary" href="#turning-point">
                <FlaskConical size={18} /> Try the live demo
              </a>
              <a className="text-link" href="#how-it-works">
                Meet your possibility engine
              </a>
            </div>
            <div className="hero-footnote">
              <ShieldCheck size={16} /> Real constraints. Verifiable answers.
              Human possibilities.
            </div>
          </div>
          <div
            className="hero-visual"
            aria-label="Illustration of people and resources connecting around a community project"
          >
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <svg
              className="hero-connections"
              viewBox="0 0 600 480"
              aria-hidden="true"
            >
              <path d="M145 115 Q300 115 300 235 T470 350 M455 100 Q455 235 300 235 T120 360 M300 235 L490 235" />
            </svg>
            <div className="floating-label label-people">
              <span className="float-icon">
                <Users size={18} />
              </span>
              <div>
                <strong>People with purpose</strong>
                <small>A little time. The right skills.</small>
              </div>
            </div>
            <div className="mini-person person-one">MP</div>
            <div className="mini-person person-two">JL</div>
            <div className="mini-person person-three">SR</div>
            <div className="idea-center">
              <span className="center-spark">✳</span>
              <strong>
                What if
                <br />
                we could?
              </strong>
              <span>YOUR NEXT BIG IDEA</span>
            </div>
            <div className="floating-label label-resources">
              <span className="float-icon">
                <Layers3 size={18} />
              </span>
              <div>
                <strong>Resources that add up</strong>
                <small>Every contribution counts.</small>
              </div>
            </div>
            <div className="possibility-card">
              <span className="possibility-icon">
                <Check size={22} />
              </span>
              <div>
                <small>THE RIGHT CONTRIBUTION</small>
                <strong>Changes what’s possible.</strong>
              </div>
              <div className="card-rays">✳</div>
            </div>
            <span className="visual-note">
              Less “maybe someday.”
              <br />
              More “here’s how.”
            </span>
            <span className="decor-plus plus-one">+</span>
            <span className="decor-plus plus-two">+</span>
          </div>
        </section>
        <section
          id="how-it-works"
          className="principles"
          aria-label="How Catalyst works"
        >
          <div>
            <span className="principle-icon">
              <HeartHandshake />
            </span>
            <p>
              <strong>Start with a shared idea</strong>
              <span>A workshop. A cleanup. A little good.</span>
            </p>
          </div>
          <div>
            <span className="principle-icon">
              <GitBranch />
            </span>
            <p>
              <strong>See the whole picture</strong>
              <span>People, time, supplies, and dependencies.</span>
            </p>
          </div>
          <div>
            <span className="principle-icon">
              <Zap />
            </span>
            <p>
              <strong>Find your turning point</strong>
              <span>Test the change that makes it possible.</span>
            </p>
          </div>
        </section>

        <section className="workspace-section" id="workspace">
          <div className="section-intro">
            <div>
              <div className="eyebrow">THE POSSIBILITY ENGINE, IN ACTION</div>
              <h2>
                One more person. <span>A whole new possibility.</span>
              </h2>
              <p>
                Build your own plan or explore three fictional community
                projects. Make a change. See the real result.
              </p>
            </div>
            <span className="demo-badge">
              <Beaker size={15} />{" "}
              {scenario ? "FICTIONAL SCENARIO" : "YOUR APPROVED PLAN"}
            </span>
          </div>
          <div className="project-toolbar">
            <label>
              Project
              <select
                aria-label="Choose a project"
                value={project.id}
                onChange={(e) => switchProject(e.target.value)}
              >
                {stored.workspace.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {scenarioFor(p.id) ? "Fictional · " : "Your project · "}
                    {scenarioFor(p.id)?.label ?? p.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button secondary small" onClick={createProject}>
              <Plus size={15} />
              Create a project
            </button>
            <button className="quiet-button" onClick={() => editProject()}>
              Edit requirements
            </button>
            <button
              className="button secondary small"
              onClick={() => setShowRoom(true)}
            >
              <Users size={15} />
              Create shared room
            </button>
          </div>
          <div className="workspace">
            <aside className="sidebar">
              <div className="sidebar-title">YOUR PROJECT SPACE</div>
              <div className="project-switch">
                <span className="project-icon">
                  <Activity size={20} />
                </span>
                <div>
                  <strong>{scenario?.label ?? "Your community project"}</strong>
                  <span>{scenario?.theme ?? "Custom project"}</span>
                </div>
              </div>
              <div
                className="sidebar-nav"
                role="tablist"
                aria-label="Workspace sections"
              >
                {(
                  [
                    {
                      id: "overview",
                      label: "Project overview",
                      icon: GitBranch,
                    },
                    { id: "people", label: "People & skills", icon: Users },
                    {
                      id: "resources",
                      label: "Resources & budget",
                      icon: Layers3,
                    },
                    {
                      id: "lab",
                      label: "What-if laboratory",
                      icon: FlaskConical,
                    },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={tab === item.id}
                    aria-controls="workspace-panel"
                    id={`tab-${item.id}`}
                    className={tab === item.id ? "active" : ""}
                    onClick={() => setTab(item.id)}
                  >
                    <item.icon size={18} />
                    {item.label}
                    {item.id === "lab" && (
                      <span className="new-label">TRY IT</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="sidebar-note">
                <Leaf size={23} />
                <strong>
                  Small inputs.
                  <br />
                  Collective impact.
                </strong>
                <p>
                  Every great community project starts with people showing up
                  for each other.
                </p>
              </div>
              <div className="local-label">
                <ShieldCheck size={13} />
                {stored.storage === "saved"
                  ? "Saved on this device"
                  : stored.storage === "session"
                    ? "Session only"
                    : "Local demo"}
                <span>
                  {scenario ? "Fictional people & data" : "Your approved model"}
                </span>
              </div>
            </aside>
            <div className="workspace-main">
              <div className="project-topline">
                <span>
                  {scenario ? "Fictional demo" : "Your project"} <span>/</span>{" "}
                  {scenario?.label ?? project.name}
                </span>
                <div>
                  <button className="quiet-button" onClick={reset}>
                    <RotateCcw size={14} />
                    Reset scenario
                  </button>
                  <button className="quiet-button" onClick={exportPlan}>
                    <Download size={14} />
                    Export plan
                  </button>
                </div>
              </div>
              <div className="project-heading">
                <div>
                  <span className="project-kicker">
                    A LITTLE CURIOSITY GOES A LONG WAY
                  </span>
                  <h3>{project.name}</h3>
                  <p>
                    {project.audience} planned participants ·{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeZone: "UTC",
                    }).format(new Date(`${project.date}T12:00:00Z`))}{" "}
                    · {project.timezone.replaceAll("_", " ")}
                  </p>
                </div>
                <span
                  className={`status-pill ${result.status === "feasible" ? "green" : "amber"}`}
                >
                  {result.status === "feasible" ? (
                    <Check size={14} />
                  ) : (
                    <CircleAlert size={14} />
                  )}
                  {result.status === "feasible"
                    ? "Requirements satisfied"
                    : result.status === "infeasible"
                      ? "Needs support"
                      : result.status === "unknown"
                        ? "Search incomplete"
                        : "Invalid requirements"}
                </span>
              </div>
              <div className="stats-row">
                <div>
                  <Users size={18} />
                  <span>
                    <strong>{project.volunteers.length}</strong> volunteers
                  </span>
                </div>
                <div>
                  <GitBranch size={18} />
                  <span>
                    <strong>{project.tasks.length}</strong> connected tasks
                  </span>
                </div>
                <div>
                  <Wallet size={18} />
                  <span>
                    <strong>{money(project.budgetCents)}</strong> available
                    budget
                  </span>
                </div>
                <div>
                  <Clock3 size={18} />
                  <span>
                    <strong>
                      {formatTime(
                        Math.min(...project.tasks.map((t) => t.start)),
                      )}
                      –
                      {formatTime(Math.max(...project.tasks.map((t) => t.end)))}
                    </strong>{" "}
                    {project.timezone.split("/").at(-1)?.replaceAll("_", " ")}
                  </span>
                </div>
              </div>
              {stored.error && (
                <p className="storage-notice" role="status">
                  {stored.error}
                </p>
              )}
              <AnalysisSummary
                result={result}
                primary={primary}
                onPreview={setPreview}
              />
              <div
                id="workspace-panel"
                role="tabpanel"
                aria-labelledby={`tab-${tab}`}
              >
                {tab === "overview" && (
                  <>
                    <div className="graph-heading">
                      <div>
                        <h4>The path from idea to impact</h4>
                        <p>
                          Connected tasks. Shared resources. One clear picture.
                        </p>
                      </div>
                      <span className="graph-legend">
                        <i className="legend-ready" />
                        Roles covered
                        <i className="legend-blocked" />
                        Needs support
                      </span>
                    </div>
                    <ProjectGraph
                      key={project.id}
                      project={project}
                      result={result}
                      selectedTask={selected.id}
                      onSelect={setSelectedTask}
                    />
                    <div className="task-strip">
                      <div>
                        <strong>{selected.name}</strong>
                        <span>
                          {formatTime(selected.start)}–
                          {formatTime(selected.end)} ·{" "}
                          {money(selected.costCents)} planned expenses
                        </span>
                      </div>
                      <div className="task-chips">
                        {slots
                          .filter((s) => s.task.id === selected.id)
                          .map((s) => {
                            const a = result.assignments.find(
                                (a) => a.slotId === s.id,
                              ),
                              v = project.volunteers.find(
                                (v) => v.id === a?.volunteerId,
                              );
                            return (
                              <span
                                key={s.id}
                                className={
                                  v
                                    ? "assignment-chip"
                                    : "assignment-chip missing"
                                }
                              >
                                {v ? (
                                  <Check size={12} />
                                ) : (
                                  <CircleAlert size={12} />
                                )}
                                {s.role.name}: {v?.name ?? "Unfilled"}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                    <div className="task-access">
                      <label htmlFor="task-picker">Inspect a task</label>
                      <select
                        id="task-picker"
                        value={selected.id}
                        onChange={(e) => setSelectedTask(e.target.value)}
                      >
                        {project.tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                {tab === "people" && (
                  <div className="tab-content">
                    <div className="panel-heading">
                      <div>
                        <h4>The people behind the possibility</h4>
                        <p>
                          {scenario
                            ? "Skills and availability are explicit fictional inputs."
                            : "Capabilities and commitments come from your approved inputs."}
                        </p>
                        <button
                          className="quiet-button"
                          onClick={() => editProject(2)}
                        >
                          Edit roster, skills & availability
                        </button>
                      </div>
                      <button
                        className="button small primary"
                        onClick={() => setShowAdd(true)}
                      >
                        <Plus size={15} />
                        Add volunteer
                      </button>
                    </div>
                    <div className="people-grid">
                      {project.volunteers.map((v, index) => (
                        <VolunteerCard
                          key={v.id}
                          volunteer={v}
                          index={index}
                          project={project}
                          result={result}
                          onWithdraw={() => withdraw(v)}
                        />
                      ))}
                    </div>
                    {project.volunteers.length === 0 && (
                      <p className="empty-state">
                        No volunteers remain. Add a simulated volunteer to
                        explore a possible plan.
                      </p>
                    )}
                    <div className="restore-roster">
                      {baselineProject.volunteers
                        .filter(
                          (v) => !project.volunteers.some((x) => x.id === v.id),
                        )
                        .map((v) => (
                          <button
                            key={v.id}
                            className="quiet-button"
                            onClick={() =>
                              update(
                                {
                                  ...project,
                                  volunteers: [
                                    ...project.volunteers,
                                    structuredClone(v),
                                  ],
                                },
                                `${v.name} restored`,
                              )
                            }
                          >
                            <Plus size={14} />
                            Restore {v.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                {tab === "resources" && (
                  <div className="tab-content">
                    <div className="panel-heading">
                      <div>
                        <h4>Make every resource count</h4>
                        <p>
                          Reusable inventory is checked at peak simultaneous
                          demand.
                        </p>
                        <button
                          className="quiet-button"
                          onClick={() => editProject(3)}
                        >
                          Edit supplies & task requirements
                        </button>
                      </div>
                    </div>
                    <div className="resource-list">
                      {project.resources.map((r) => (
                        <div key={r.id} className="resource-row">
                          <span className="resource-icon">
                            <Layers3 size={20} />
                          </span>
                          <div>
                            <strong>{r.name}</strong>
                            <span>
                              {r.kind === "reusable"
                                ? "Reusable · peak concurrent demand"
                                : "Consumable · total event demand"}
                              : {resourceDemand(project, r.id)}
                            </span>
                          </div>
                          <label>
                            <span className="sr-only">{r.name} available</span>
                            <input
                              aria-label={`${r.name} available`}
                              type="number"
                              min="0"
                              max="10000"
                              value={r.quantity}
                              onChange={(e) => {
                                const quantity = e.target.valueAsNumber;
                                if (
                                  Number.isInteger(quantity) &&
                                  quantity >= 0 &&
                                  quantity <= 10000
                                )
                                  update(
                                    {
                                      ...project,
                                      resources: project.resources.map((x) =>
                                        x.id === r.id ? { ...x, quantity } : x,
                                      ),
                                    },
                                    `${r.name} inventory changed to ${quantity}`,
                                  );
                              }}
                            />
                          </label>
                          <span
                            className={
                              r.quantity >= resourceDemand(project, r.id)
                                ? "inventory-ok"
                                : "inventory-low"
                            }
                          >
                            {r.quantity >= resourceDemand(project, r.id) ? (
                              <Check size={17} />
                            ) : (
                              <CircleAlert size={17} />
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="budget-panel">
                      <div>
                        <h4>A transparent budget</h4>
                        <p>
                          All task expenses:{" "}
                          <strong>{money(result.costCents)}</strong>
                        </p>
                        <p>
                          Inventory is already on hand. Changing quantities does
                          not model purchase costs.
                        </p>
                      </div>
                      <label>
                        Available funding (USD)
                        <input
                          aria-label="Available funding in dollars"
                          type="number"
                          min="0"
                          max="1000000"
                          step="1"
                          value={project.budgetCents / 100}
                          onChange={(e) => {
                            const amount = e.target.valueAsNumber;
                            if (
                              Number.isFinite(amount) &&
                              amount >= 0 &&
                              amount <= 1000000
                            )
                              update(
                                {
                                  ...project,
                                  budgetCents: Math.round(amount * 100),
                                },
                                `Budget changed to ${money(Math.round(amount * 100))}`,
                              );
                          }}
                        />
                      </label>
                    </div>
                    <div className="expense-table">
                      {project.tasks.map((t) => (
                        <div key={t.id}>
                          <span>{t.name}</span>
                          <strong>{money(t.costCents)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {tab === "lab" && (
                  <div className="tab-content">
                    <div className="panel-heading">
                      <div>
                        <h4>What changes what’s possible?</h4>
                        <p>
                          Every experiment runs the constraint solver again.
                        </p>
                      </div>
                      <FlaskConical size={23} className="teal-text" />
                    </div>
                    <div className="comparison">
                      <div>
                        <span>
                          {before
                            ? "BEFORE THE LAST CHANGE"
                            : "SESSION BASELINE"}
                        </span>
                        <strong>
                          {comparison.filledSlots}
                          <small> / {comparison.totalSlots} roles</small>
                        </strong>
                        <p>
                          {comparison.status === "feasible"
                            ? "Requirements satisfied"
                            : comparison.status === "infeasible"
                              ? "Requirements unmet"
                              : "Search incomplete"}
                        </p>
                      </div>
                      <span className="compare-symbol">⇢</span>
                      <div
                        className={
                          result.status === "feasible" ? "comparison-ready" : ""
                        }
                      >
                        <span>CURRENT SCENARIO</span>
                        <strong>
                          {result.filledSlots}
                          <small> / {result.totalSlots} roles</small>
                        </strong>
                        <p>
                          {result.status === "feasible"
                            ? "Requirements satisfied"
                            : result.status === "infeasible"
                              ? "Requirements unmet"
                              : "Search incomplete"}
                        </p>
                      </div>
                    </div>
                    <p className="last-action">{lastAction}</p>
                    <div className="lab-options">
                      <div>
                        <h5>
                          <Plus size={17} /> Bring someone in
                        </h5>
                        <p>
                          Add a fictional person with explicit skills,
                          availability, and workload limits.
                        </p>
                        <button
                          className="button secondary small"
                          onClick={() => setShowAdd(true)}
                        >
                          Build a volunteer profile
                        </button>
                      </div>
                      <div>
                        <h5>
                          <Minus size={17} /> Test a withdrawal
                        </h5>
                        <p>
                          Remove someone from the plan. Discover which
                          contribution you need to replace.
                        </p>
                        <div className="withdraw-buttons">
                          {project.volunteers.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => withdraw(v)}
                              aria-label={`Withdraw ${v.name}`}
                            >
                              {v.name}
                              <X size={13} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => setTab("resources")}
                    >
                      <SlidersHorizontal size={16} /> Experiment with supplies
                      and funding
                    </button>
                    {!allOriginalPresent && (
                      <button className="quiet-button" onClick={reset}>
                        <RotateCcw size={14} />
                        Restore original roster
                      </button>
                    )}
                  </div>
                )}
              </div>
              {tab === "lab" && interventions.length > 0 && (
                <InterventionOptions
                  interventions={interventions}
                  onPreview={setPreview}
                />
              )}
              {result.status === "feasible" && (
                <div className="success-next">
                  <span>
                    <ShieldCheck size={17} />
                    {verified
                      ? "Assignment independently verified"
                      : "Verification needs review"}{" "}
                    · This is a model, not a real-world guarantee.
                  </span>
                  <button className="text-link" onClick={() => setTab("lab")}>
                    Now test a volunteer withdrawal <FlaskConical size={16} />
                  </button>
                </div>
              )}
              <div className="solver-footer">
                <span>
                  <span className="engine-dot" />
                  Deterministic constraint engine
                </span>
                <span>
                  {result.exploredNodes} search nodes ·{" "}
                  {result.exhaustive
                    ? "Search completed"
                    : "Node limit reached"}
                  <button
                    className="text-link"
                    onClick={() => setShowMethod(true)}
                  >
                    How it works
                  </button>
                </span>
              </div>
            </div>
          </div>
          <div className="demo-caption">
            <span>
              <ShieldCheck size={15} />
              {scenario
                ? "Fictional scenario. "
                : "Your approved requirements. "}
              Real computation. No AI-generated feasibility.
            </span>
            <span>Built for people who make things happen.</span>
          </div>
        </section>
        <section className="closing">
          <span className="closing-spark">✳</span>
          <h2>
            Your community has the potential.
            <br />
            <span>Find what brings it together.</span>
          </h2>
          <p>
            A missing skill. An extra hour. A shared resource.
            <br />
            Sometimes the smallest contribution is the catalyst.
          </p>
          <a className="button primary" href="#workspace">
            Explore the possibilities <FlaskConical size={17} />
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <Brand />
        <span>Turn ideas into collective action.</span>
        <span>Local plans & shared project rooms</span>
      </footer>
      <div role="status" className={notice ? "toast" : "sr-only"} key={notice}>
        {notice && (
          <>
            <Check size={16} />
            {notice}
            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </>
        )}
      </div>
      {showRoom && (
        <CreateRoomDialog
          project={project}
          onClose={() => setShowRoom(false)}
        />
      )}
      {showAdd && (
        <AddVolunteerModal
          project={project}
          onClose={() => setShowAdd(false)}
          onAdd={(v) => {
            if (project.volunteers.length >= 24) {
              setShowAdd(false);
              setNotice(
                "This bounded model supports up to 24 volunteers. Edit the roster to replace a person.",
              );
              return;
            }
            let id = `custom-${v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              n = 1;
            while (project.volunteers.some((x) => x.id === id))
              id = `${id}-${n++}`;
            update(
              {
                ...project,
                volunteers: [
                  ...project.volunteers,
                  { ...v, id, simulated: true },
                ],
              },
              `Simulated adding ${v.name}`,
            );
            setShowAdd(false);
          }}
        />
      )}
      {editor && (
        <ProjectEditor
          initial={editor}
          initialStep={editorStep}
          editing={stored.workspace.projects.some((p) => p.id === editor.id)}
          onClose={() => setEditor(null)}
          onApprove={(p) => {
            dispatchWorkspace({ type: "approve", project: p });
            setEditor(null);
            setBefore(null);
            setLastAction(
              "Approved requirements. No experiments in this session yet.",
            );
            setSelectedTask(p.tasks[0].id);
            setTab("overview");
            setNotice(
              "Requirements approved. Analyzed with the constraint engine.",
            );
            requestAnimationFrame(() =>
              document.getElementById("workspace")?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "auto"
                  : "smooth",
                block: "start",
              }),
            );
          }}
        />
      )}
      {preview && (
        <InterventionPreview
          project={project}
          baseline={result}
          intervention={preview}
          onClose={() => setPreview(null)}
          onApply={() => {
            simulate(preview);
            setPreview(null);
          }}
        />
      )}
      {showMethod && (
        <Modal
          title="A possibility engine you can inspect."
          onClose={() => setShowMethod(false)}
        >
          <div className="method-content">
            <span className="method-label">
              <Code2 size={17} /> DETERMINISTIC, BY DESIGN
            </span>
            <p>
              Catalyst solves a finite constraint satisfaction problem using
              backtracking, minimum-domain ordering, and branch-and-bound.
            </p>
            <ul>
              <li>
                Every mandatory role requires a qualified, available volunteer.
              </li>
              <li>
                A volunteer cannot overlap tasks or exceed their workload limit.
              </li>
              <li>
                Dependencies, reusable and consumable supplies, and budget are
                checked separately.
              </li>
              <li>
                Candidate fixes are simulated and solved again before being
                labeled verified.
              </li>
            </ul>
            <p>
              Search is bounded at 200,000 nodes. If a search is cut short,
              Catalyst reports “search incomplete,” not a proof of
              infeasibility. A full assignment is checked by a separate
              verifier.
            </p>
            <p>
              “Roles covered” measures assigned slots, not a probability of
              success. A partial assignment is diagnostic and does not authorize
              executing the plan.
            </p>
            <div className="ai-notice">
              <strong>AI drafts. People approve. The solver verifies.</strong>
              <p>
                Create a project to check live Gemini availability. When
                configured, Gemini proposes editable requirements with explicit
                assumptions and questions. No volunteers or inventory are
                invented. Missing credentials preserve manual planning. Only
                approved requirements enter the solver.
              </p>
            </div>
            <button className="button secondary" onClick={exportPlan}>
              <Download size={16} />
              Export data & assignment certificate
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function VolunteerCard({
  volunteer: v,
  index,
  project,
  result,
  onWithdraw,
}: {
  volunteer: Volunteer;
  index: number;
  project: Project;
  result: SolveResult;
  onWithdraw: () => void;
}) {
  const assignments = result.assignments.filter((a) => a.volunteerId === v.id),
    slots = slotsFor(project),
    minutes = assignments.reduce((n, a) => {
      const t = slots.find((s) => s.id === a.slotId)!.task;
      return n + t.end - t.start;
    }, 0);
  return (
    <article className="volunteer-card">
      <div className="volunteer-card-top">
        <span className={`avatar avatar-${index % 4}`}>
          {v.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <strong>{v.name}</strong>
          <span>
            {v.simulatedAvailability
              ? "Simulated availability"
              : v.simulated
                ? "Simulated addition"
                : scenarioFor(project.id)
                  ? "Fictional volunteer"
                  : "User-entered volunteer"}
          </span>
        </div>
        <button
          className="icon-button remove-volunteer"
          aria-label={`Withdraw ${v.name}`}
          onClick={onWithdraw}
        >
          <X size={15} />
        </button>
      </div>
      <div className="skill-tags">
        {v.skills.map((s) => (
          <span key={s}>{skillName(s)}</span>
        ))}
      </div>
      {v.qualifications.length > 0 && (
        <p className="qualification">
          <ShieldCheck size={13} />
          {v.qualifications.map(skillName).join(", ")}
        </p>
      )}
      <div className="volunteer-meta">
        <span>
          <Clock3 size={13} />
          {v.availability
            .map((w) => `${formatTime(w.start)}–${formatTime(w.end)}`)
            .join(", ")}
        </span>
        <span>
          {minutes}/{v.maxMinutes} min assigned
        </span>
      </div>
      <div className="volunteer-work">
        {assignments.length ? (
          assignments.map((a) => (
            <span key={a.slotId}>
              <Check size={12} />
              {slots.find((s) => s.id === a.slotId)?.task.name}
            </span>
          ))
        ) : (
          <span>No role assigned</span>
        )}
      </div>
    </article>
  );
}

function AddVolunteerModal({
  onClose,
  onAdd,
  project,
}: {
  onClose: () => void;
  onAdd: (v: Omit<Volunteer, "id">) => void;
  project: Project;
}) {
  const profiles = Object.fromEntries(
    project.tasks.flatMap((t) =>
      t.roles.map((r) => [
        `${t.id}/${r.id}`,
        { name: r.name, skills: r.skills, qualifications: r.qualifications },
      ]),
    ),
  );
  const missing = solve(project)
    .issues.find((i) => i.kind === "staffing")
    ?.slotId?.split("/")
    .slice(0, 2)
    .join("/");
  const [name, setName] = useState("Simulated volunteer"),
    [profile, setProfile] = useState(missing ?? Object.keys(profiles)[0]),
    [start, setStart] = useState(
      formatTime(Math.min(...project.tasks.map((t) => t.start))),
    ),
    [end, setEnd] = useState(
      formatTime(Math.max(...project.tasks.map((t) => t.end))),
    ),
    [maxMinutes, setMaxMinutes] = useState(
      Math.max(...project.tasks.map((t) => t.end)) -
        Math.min(...project.tasks.map((t) => t.start)),
    ),
    [error, setError] = useState("");
  const toMinutes = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  };
  return (
    <Modal title="One person can change the plan." onClose={onClose}>
      <p className="modal-intro">
        Create a fictional volunteer to test a contribution. These are
        simulation assumptions, not confirmed availability.
      </p>
      <form
        className="volunteer-form"
        onSubmit={(e) => {
          e.preventDefault();
          const s = toMinutes(start),
            t = toMinutes(end);
          if (
            !name.trim() ||
            !Number.isInteger(s) ||
            !Number.isInteger(t) ||
            s >= t ||
            maxMinutes < 0 ||
            maxMinutes > 1440
          ) {
            setError(
              "Enter a name, a valid time window, and a workload between 0 and 1,440 minutes.",
            );
            return;
          }
          onAdd({
            name: name.trim(),
            skills: profiles[profile].skills,
            qualifications: profiles[profile].qualifications,
            availability: [{ start: s, end: t }],
            maxMinutes,
          });
        }}
      >
        <label>
          Simulated name
          <input
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Skill & qualification profile
          <select value={profile} onChange={(e) => setProfile(e.target.value)}>
            {Object.entries(profiles).map(([id, r]) => (
              <option value={id} key={id}>
                {r.name} ·{" "}
                {[...r.skills, ...r.qualifications]
                  .join(", ")
                  .replaceAll("_", " ") || "general support"}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            Available from ({project.timezone})
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </label>
          <label>
            Available until ({project.timezone})
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </label>
        </div>
        <label>
          Maximum workload (minutes)
          <input
            type="number"
            min="0"
            max="1440"
            value={maxMinutes}
            onChange={(e) => setMaxMinutes(e.target.valueAsNumber)}
            required
          />
        </label>
        <p className="form-error" role="alert">
          {error}
        </p>
        <button className="button primary" type="submit">
          <FlaskConical size={17} />
          Add & recompute
        </button>
      </form>
    </Modal>
  );
}
