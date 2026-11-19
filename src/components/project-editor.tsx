"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  CircleAlert,
  ClipboardCheck,
  Layers3,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Modal } from "./dialog";
import {
  formatTime,
  money,
  projectSchema,
  type Project,
  type Role,
  type Task,
  type Volunteer,
} from "@/engine/model";
import { staticIssues } from "@/engine/solver";
import {
  approveProjectDraft,
  nextId,
  removeResource,
  removeTask,
  tokens,
  validationMessages,
} from "@/lib/projects";
import { proposalToDraft, validateProposal, type Proposal } from "@/ai/schema";

const steps = ["The idea", "Tasks & roles", "People", "Supplies", "Review"];
function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="editor-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 1000000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? 0 : e.target.valueAsNumber)
        }
      />
    </Field>
  );
}
function Tags({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Field
      label={label}
      hint="Separate with commas. Spaces become underscores so skills match consistently."
    >
      <input
        defaultValue={values.join(", ")}
        placeholder="e.g. robotics, mentoring"
        onBlur={(e) => onChange(tokens(e.target.value))}
      />
    </Field>
  );
}
const minute = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="time"
        value={value === 1440 ? "23:59" : formatTime(value)}
        onChange={(e) => {
          if (e.target.value) onChange(minute(e.target.value));
        }}
      />
    </Field>
  );
}

export function ProjectEditor({
  initial,
  editing,
  onClose,
  onApprove,
  initialStep = 0,
}: {
  initial: Project;
  editing: boolean;
  onClose: () => void;
  onApprove: (p: Project) => void;
  initialStep?: number;
}) {
  const [draft, setDraft] = useState(() => structuredClone(initial)),
    [step, setStep] = useState(initialStep),
    [expanded, setExpanded] = useState(initial.tasks[0]?.id ?? ""),
    [confirmed, setConfirmed] = useState(false),
    [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<{
      configured: boolean;
      model: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [aiError, setAiError] = useState(""),
    [proposal, setProposal] = useState<Proposal | null>(null),
    [proposalGoal, setProposalGoal] = useState(""),
    [aiUsed, setAiUsed] = useState(false);
  const request = useRef<AbortController | null>(null);
  const editorBody = useRef<HTMLDivElement>(null);
  useEffect(() => {
    editorBody.current?.scrollTo({ top: 0 });
  }, [step]);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/compile", { signal: controller.signal })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
    return () => {
      controller.abort();
      request.current?.abort();
    };
  }, []);
  function change(next: Project) {
    setDraft(next);
    setConfirmed(false);
    setErrors([]);
  }
  const taskChange = (id: string, patch: Partial<Task>) =>
    change({
      ...draft,
      tasks: draft.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  const volunteerChange = (id: string, patch: Partial<Volunteer>) =>
    change({
      ...draft,
      volunteers: draft.volunteers.map((v) =>
        v.id === id ? { ...v, ...patch } : v,
      ),
    });
  function addTask() {
    const id = nextId("task", draft.tasks),
      start = draft.tasks.length
        ? Math.min(1380, Math.max(...draft.tasks.map((t) => t.end)))
        : 540;
    change({
      ...draft,
      tasks: [
        ...draft.tasks,
        {
          id,
          name: "New task",
          start,
          end: start + 60,
          dependencies: [],
          roles: [
            {
              id: "helper",
              name: "General helper",
              count: 1,
              skills: [],
              qualifications: [],
            },
          ],
          resources: [],
          costCents: 0,
          optional: false,
        },
      ],
    });
    setExpanded(id);
  }
  function addVolunteer() {
    const id = nextId("volunteer", draft.volunteers);
    change({
      ...draft,
      volunteers: [
        ...draft.volunteers,
        {
          id,
          name: "New volunteer",
          skills: [],
          qualifications: [],
          availability: [{ start: 540, end: 1020 }],
          maxMinutes: 120,
        },
      ],
    });
  }
  async function compile() {
    request.current?.abort();
    request.current = new AbortController();
    setBusy(true);
    setAiError("");
    setProposal(null);
    const goal = draft.brief;
    try {
      const r = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
        signal: request.current.signal,
      });
      const data = await r.json();
      if (!r.ok)
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : "The compiler is unavailable. Continue manually.",
        );
      setProposal(validateProposal(data.proposal, goal));
      setProposalGoal(goal);
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setAiError(
          error instanceof Error
            ? error.message
            : "The draft could not be created. Continue manually.",
        );
    } finally {
      setBusy(false);
    }
  }
  const parsed = projectSchema.safeParse(draft),
    warnings = parsed.success ? staticIssues(parsed.data) : [];
  function approve() {
    const parsed = projectSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(validationMessages(parsed.error));
      return;
    }
    if (!confirmed) {
      setErrors([
        "Confirm that you reviewed the requirements and assumptions.",
      ]);
      return;
    }
    onApprove(approveProjectDraft(draft, confirmed));
  }
  return (
    <Modal
      title={
        editing
          ? "Shape your project’s next chapter."
          : "What could your community make possible?"
      }
      onClose={onClose}
      wide
    >
      <p className="editor-intro">
        {editing
          ? "Edit a separate draft. Your analyzed project changes only when you approve it."
          : "Start with an idea. Build the requirements. Then let the constraint engine find your turning point."}
      </p>
      <nav className="editor-steps" aria-label="Project creation steps">
        {steps.map((s, i) => (
          <button
            key={s}
            className={step === i ? "active" : ""}
            onClick={() => setStep(i)}
            aria-current={step === i ? "step" : undefined}
          >
            <span>{i < step ? <Check size={12} /> : i + 1}</span>
            {s}
          </button>
        ))}
      </nav>
      <div className="editor-body" ref={editorBody}>
        {step === 0 && (
          <>
            <div className="editor-section-title">
              <Sparkles size={20} />
              <div>
                <h4>A clear idea is a powerful start.</h4>
                <p>
                  Live AI can suggest requirements. You make every commitment.
                </p>
              </div>
            </div>
            <Field
              label="What do you want to make happen?"
              hint="Describe your goal, audience, and any constraints you know. This brief is sent to Google only when you request an AI draft; keep personal information out."
            >
              <textarea
                rows={3}
                maxLength={5000}
                value={draft.brief}
                placeholder="We want to run a free robotics workshop for 60 students with $400 next Saturday."
                onChange={(e) => change({ ...draft, brief: e.target.value })}
              />
            </Field>
            <div className="ai-compiler-row">
              <button
                className="button primary small"
                onClick={compile}
                disabled={
                  busy ||
                  draft.brief.trim().length < 12 ||
                  status?.configured === false
                }
              >
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                {busy
                  ? "Drafting with Gemini…"
                  : "Draft requirements with Gemini"}
              </button>
              <span>
                {status?.configured
                  ? `Live provider configured · ${status.model}`
                  : status === null
                    ? "Checking live AI availability…"
                    : "Live AI unavailable · manual creation is fully available"}
              </span>
            </div>
            {status?.configured === false && (
              <details className="ai-setup">
                <summary>Set up live Gemini drafting</summary>
                <p>
                  Set <code>GEMINI_API_KEY</code> in Catalyst’s{" "}
                  <code>.env.local</code> and restart the server. The key stays
                  on the server. No key is needed for manual creation or
                  fictional demos.
                </p>
              </details>
            )}
            {aiError && (
              <p className="editor-error" role="alert">
                {aiError}
              </p>
            )}
            {proposal && (
              <section className="proposal-card">
                <span className="proposal-label">
                  <Sparkles size={14} /> AI SUGGESTIONS · NOT APPROVED
                </span>
                <h4>{proposal.title}</h4>
                <p>{proposal.summary}</p>
                <div className="proposal-columns">
                  <div>
                    <h5>Provided in your brief</h5>
                    {proposal.facts.length ? (
                      proposal.facts.map((f, i) => (
                        <p key={i}>
                          {f.statement}
                          <q>{f.evidenceQuote}</q>
                        </p>
                      ))
                    ) : (
                      <p>
                        No facts were extracted. All requirements need review.
                      </p>
                    )}
                  </div>
                  <div>
                    <h5>Suggestions & assumptions</h5>
                    <ul>
                      {proposal.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <details>
                  <summary>
                    Preview {proposal.tasks.length} tasks and{" "}
                    {proposal.resources.length} supplies
                  </summary>
                  {proposal.tasks.map((t) => (
                    <p key={t.id}>
                      <strong>{t.name}</strong> · {formatTime(t.start)}–
                      {formatTime(t.end)} ·{" "}
                      {t.roles.map((r) => `${r.count} ${r.name}`).join(", ")} ·{" "}
                      {money(t.costCents)} suggested cost
                    </p>
                  ))}
                  {proposal.resources.map((r) => (
                    <p key={r.id}>
                      {r.name} · {r.kind} · no inventory assumed
                    </p>
                  ))}
                </details>
                <details open={proposal.questions.length > 0}>
                  <summary>
                    Questions to resolve ({proposal.questions.length})
                  </summary>
                  <ul>
                    {proposal.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </details>
                <button
                  className="button secondary small"
                  onClick={() => {
                    if (draft.brief !== proposalGoal) {
                      setAiError(
                        "Your brief changed. Request a fresh proposal before using it.",
                      );
                      return;
                    }
                    change(proposalToDraft(proposal, draft));
                    setAiUsed(true);
                    setExpanded(proposal.tasks[0].id);
                    setStep(1);
                    setProposal(null);
                  }}
                >
                  Use suggestions in my editable draft
                </button>
                <small>
                  Replaces draft tasks and supplies. Clears the draft roster and
                  sets every inventory quantity to zero. Your budget, date, and
                  audience are preserved. Nothing is analyzed yet.
                </small>
              </section>
            )}
            <div className="editor-divider" />
            <div className="editor-grid">
              <Field label="Project title">
                <input
                  value={draft.name}
                  maxLength={160}
                  onChange={(e) => change({ ...draft, name: e.target.value })}
                />
              </Field>
              <Field label="Event date">
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => change({ ...draft, date: e.target.value })}
                />
              </Field>
              <NumberField
                label="Available budget / spending limit (USD)"
                value={draft.budgetCents / 100}
                step={0.01}
                onChange={(n) =>
                  change({ ...draft, budgetCents: Math.round(n * 100) })
                }
              />
              <NumberField
                label="Planned participants"
                min={1}
                value={draft.audience}
                onChange={(n) => change({ ...draft, audience: n })}
              />
            </div>
            <Field
              label="Event time zone"
              hint="All task and volunteer windows use this time zone on the chosen event date."
            >
              <input
                value={draft.timezone}
                placeholder="America/New_York"
                onChange={(e) => change({ ...draft, timezone: e.target.value })}
              />
            </Field>
            <p className="editor-note">
              Defaults are placeholders for review: today’s date, one
              participant, and $0 funding. Task and availability defaults are
              suggestions you must confirm.
            </p>
          </>
        )}
        {step === 1 && (
          <>
            <div className="editor-section-title">
              <ClipboardCheck size={20} />
              <div>
                <h4>Map the work, then the people it needs.</h4>
                <p>
                  Times are fixed. A dependency must finish before its next task
                  starts.
                </p>
              </div>
              <button
                className="button secondary small"
                onClick={addTask}
                disabled={draft.tasks.length >= 16}
              >
                <Plus size={15} />
                Add task
              </button>
            </div>
            {!draft.tasks.length && (
              <div className="editor-empty">
                <p>What needs to happen first?</p>
                <button className="button primary small" onClick={addTask}>
                  <Plus size={15} />
                  Add your first task
                </button>
              </div>
            )}
            {draft.tasks.map((t, index) => (
              <section className="editor-card" key={t.id}>
                <div className="editor-card-header">
                  <button
                    className="editor-expand"
                    onClick={() => setExpanded(expanded === t.id ? "" : t.id)}
                    aria-expanded={expanded === t.id}
                  >
                    <strong>{t.name || `Task ${index + 1}`}</strong>
                    <span>
                      {formatTime(t.start)}–{formatTime(t.end)} ·{" "}
                      {t.roles.reduce((n, r) => n + r.count, 0)} roles
                    </span>
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`Remove task ${t.name}`}
                    onClick={() => change(removeTask(draft, t.id))}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {expanded === t.id && (
                  <div className="editor-card-body">
                    <Field label="Task name">
                      <input
                        value={t.name}
                        onChange={(e) =>
                          taskChange(t.id, { name: e.target.value })
                        }
                      />
                    </Field>
                    <div className="editor-grid three">
                      <TimeField
                        label="Task starts"
                        value={t.start}
                        onChange={(start) => taskChange(t.id, { start })}
                      />
                      <TimeField
                        label="Task ends"
                        value={t.end}
                        onChange={(end) => taskChange(t.id, { end })}
                      />
                      <NumberField
                        label="Planned task expenses (USD)"
                        value={t.costCents / 100}
                        step={0.01}
                        onChange={(cost) =>
                          taskChange(t.id, {
                            costCents: Math.round(cost * 100),
                          })
                        }
                      />
                    </div>
                    <div className="dependency-picker">
                      <span>Must finish before this task</span>
                      {draft.tasks
                        .filter((d) => d.id !== t.id)
                        .map((d) => (
                          <label key={d.id}>
                            <input
                              type="checkbox"
                              checked={t.dependencies.includes(d.id)}
                              onChange={(e) =>
                                taskChange(t.id, {
                                  dependencies: e.target.checked
                                    ? [...t.dependencies, d.id]
                                    : t.dependencies.filter(
                                        (id) => id !== d.id,
                                      ),
                                })
                              }
                            />
                            {d.name}
                          </label>
                        ))}
                      {draft.tasks.length < 2 && (
                        <small>Add another task to create dependencies.</small>
                      )}
                    </div>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={Boolean(t.optional)}
                        onChange={(e) =>
                          taskChange(t.id, { optional: e.target.checked })
                        }
                      />
                      May be dropped in a scope-reduction experiment (still
                      required in this plan)
                    </label>
                    <div className="editor-subheading">
                      <h5>Required people & qualifications</h5>
                      <button
                        className="quiet-button"
                        onClick={() =>
                          taskChange(t.id, {
                            roles: [
                              ...t.roles,
                              {
                                id: nextId("role", t.roles),
                                name: "New role",
                                count: 1,
                                skills: [],
                                qualifications: [],
                              },
                            ],
                          })
                        }
                      >
                        <Plus size={14} />
                        Add role
                      </button>
                    </div>
                    {t.roles.map((r) => {
                      const edit = (patch: Partial<Role>) =>
                        taskChange(t.id, {
                          roles: t.roles.map((x) =>
                            x.id === r.id ? { ...x, ...patch } : x,
                          ),
                        });
                      return (
                        <div className="role-editor" key={r.id}>
                          <div className="editor-grid">
                            <Field label="Role name">
                              <input
                                value={r.name}
                                onChange={(e) => edit({ name: e.target.value })}
                              />
                            </Field>
                            <NumberField
                              label="People required"
                              value={r.count}
                              min={1}
                              max={8}
                              onChange={(count) => edit({ count })}
                            />
                            <Tags
                              label="Required skills"
                              values={r.skills}
                              onChange={(skills) => edit({ skills })}
                            />
                            <Tags
                              label="Required qualifications"
                              values={r.qualifications}
                              onChange={(qualifications) =>
                                edit({ qualifications })
                              }
                            />
                          </div>
                          <button
                            className="quiet-button danger"
                            onClick={() =>
                              taskChange(t.id, {
                                roles: t.roles.filter((x) => x.id !== r.id),
                              })
                            }
                          >
                            Remove role
                          </button>
                        </div>
                      );
                    })}
                    <p className="editor-note">
                      Every listed skill and qualification is mandatory. Leave
                      both blank for a general helper. At least one role per
                      task is required; maximum 32 slots across the project.
                    </p>
                    <div className="editor-subheading">
                      <h5>Supplies this task needs</h5>
                    </div>
                    {draft.resources.length ? (
                      draft.resources.map((r) => (
                        <NumberField
                          key={r.id}
                          label={`${r.name} required for ${t.name}`}
                          value={
                            t.resources.find((x) => x.resourceId === r.id)
                              ?.quantity ?? 0
                          }
                          max={10000}
                          onChange={(quantity) =>
                            taskChange(t.id, {
                              resources:
                                quantity > 0
                                  ? [
                                      ...t.resources.filter(
                                        (x) => x.resourceId !== r.id,
                                      ),
                                      { resourceId: r.id, quantity },
                                    ]
                                  : t.resources.filter(
                                      (x) => x.resourceId !== r.id,
                                    ),
                            })
                          }
                        />
                      ))
                    ) : (
                      <p className="editor-note">
                        Add supply types in Supplies, then return here to set
                        task quantities.
                      </p>
                    )}
                  </div>
                )}
              </section>
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <div className="editor-section-title">
              <Users size={20} />
              <div>
                <h4>Who can actually show up?</h4>
                <p>
                  Enter confirmed availability and capabilities. An empty roster
                  is valid and will expose the people you need.
                </p>
              </div>
              <button
                className="button secondary small"
                onClick={addVolunteer}
                disabled={draft.volunteers.length >= 24}
              >
                <Plus size={15} />
                Add person
              </button>
            </div>
            {!draft.volunteers.length && (
              <div className="editor-empty">
                <p>
                  No volunteers assumed. Add a confirmed person or analyze the
                  gap.
                </p>
                <button
                  className="button secondary small"
                  onClick={addVolunteer}
                >
                  Add your first volunteer
                </button>
              </div>
            )}
            {draft.volunteers.map((v) => (
              <details
                className="editor-card"
                key={v.id}
                open={draft.volunteers.length === 1}
              >
                <summary>
                  {v.name} ·{" "}
                  {v.skills.join(", ").replaceAll("_", " ") ||
                    "Skills to confirm"}
                </summary>
                <div className="editor-card-body">
                  <Field label="Volunteer name">
                    <input
                      value={v.name}
                      maxLength={80}
                      onChange={(e) =>
                        volunteerChange(v.id, { name: e.target.value })
                      }
                    />
                  </Field>
                  <div className="editor-grid">
                    <Tags
                      label="Volunteer skills"
                      values={v.skills}
                      onChange={(skills) => volunteerChange(v.id, { skills })}
                    />
                    <Tags
                      label="Confirmed qualifications"
                      values={v.qualifications}
                      onChange={(qualifications) =>
                        volunteerChange(v.id, { qualifications })
                      }
                    />
                  </div>
                  <NumberField
                    label="Maximum volunteer workload (minutes)"
                    value={v.maxMinutes}
                    max={1440}
                    onChange={(maxMinutes) =>
                      volunteerChange(v.id, { maxMinutes })
                    }
                  />
                  <div className="editor-subheading">
                    <h5>Availability windows</h5>
                    <button
                      className="quiet-button"
                      disabled={v.availability.length >= 10}
                      onClick={() =>
                        volunteerChange(v.id, {
                          availability: [
                            ...v.availability,
                            { start: 540, end: 1020 },
                          ],
                        })
                      }
                    >
                      <Plus size={14} />
                      Add window
                    </button>
                  </div>
                  {v.availability.map((w, i) => (
                    <div className="availability-editor" key={i}>
                      <TimeField
                        label={`Window ${i + 1} starts`}
                        value={w.start}
                        onChange={(start) =>
                          volunteerChange(v.id, {
                            availability: v.availability.map((x, j) =>
                              j === i ? { ...x, start } : x,
                            ),
                          })
                        }
                      />
                      <TimeField
                        label={`Window ${i + 1} ends`}
                        value={w.end}
                        onChange={(end) =>
                          volunteerChange(v.id, {
                            availability: v.availability.map((x, j) =>
                              j === i ? { ...x, end } : x,
                            ),
                          })
                        }
                      />
                      <button
                        className="icon-button"
                        aria-label={`Remove availability window ${i + 1}`}
                        onClick={() =>
                          volunteerChange(v.id, {
                            availability: v.availability.filter(
                              (_, j) => j !== i,
                            ),
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    className="quiet-button danger"
                    onClick={() =>
                      change({
                        ...draft,
                        volunteers: draft.volunteers.filter(
                          (x) => x.id !== v.id,
                        ),
                      })
                    }
                  >
                    Remove volunteer
                  </button>
                </div>
              </details>
            ))}
          </>
        )}
        {step === 3 && (
          <>
            <div className="editor-section-title">
              <Layers3 size={20} />
              <div>
                <h4>Count what you have. Name what you need.</h4>
                <p>
                  Inventory starts at zero. Requirements belong to tasks;
                  inventory is the supply you can commit.
                </p>
              </div>
              <button
                className="button secondary small"
                disabled={draft.resources.length >= 30}
                onClick={() =>
                  change({
                    ...draft,
                    resources: [
                      ...draft.resources,
                      {
                        id: nextId("supply", draft.resources),
                        name: "New supply",
                        kind: "reusable",
                        quantity: 0,
                      },
                    ],
                  })
                }
              >
                <Plus size={15} />
                Add supply
              </button>
            </div>
            {draft.resources.map((r) => (
              <section className="editor-card" key={r.id}>
                <div className="editor-card-body">
                  <div className="editor-grid">
                    <Field label="Supply name">
                      <input
                        value={r.name}
                        onChange={(e) =>
                          change({
                            ...draft,
                            resources: draft.resources.map((x) =>
                              x.id === r.id
                                ? { ...x, name: e.target.value }
                                : x,
                            ),
                          })
                        }
                      />
                    </Field>
                    <Field label="How is this supply used?">
                      <select
                        value={r.kind}
                        onChange={(e) =>
                          change({
                            ...draft,
                            resources: draft.resources.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    kind: e.target.value as
                                      "reusable" | "consumable",
                                  }
                                : x,
                            ),
                          })
                        }
                      >
                        <option value="reusable">
                          Reusable · checked at peak concurrent demand
                        </option>
                        <option value="consumable">
                          Consumable · total used across the event
                        </option>
                      </select>
                    </Field>
                    <NumberField
                      label="Confirmed available quantity"
                      value={r.quantity}
                      max={10000}
                      onChange={(quantity) =>
                        change({
                          ...draft,
                          resources: draft.resources.map((x) =>
                            x.id === r.id ? { ...x, quantity } : x,
                          ),
                        })
                      }
                    />
                    <Field
                      label="Cost per additional unit (USD)"
                      hint="Leave blank if unknown. Intervention ranking will label it unpriced."
                    >
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          r.unitCostCents === undefined
                            ? ""
                            : r.unitCostCents / 100
                        }
                        onChange={(e) =>
                          change({
                            ...draft,
                            resources: draft.resources.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    unitCostCents:
                                      e.target.value === ""
                                        ? undefined
                                        : Math.round(
                                            e.target.valueAsNumber * 100,
                                          ),
                                  }
                                : x,
                            ),
                          })
                        }
                      />
                    </Field>
                  </div>
                  <details className="supply-task-needs">
                    <summary>Set how many each task needs</summary>
                    {draft.tasks.map((t) => (
                      <NumberField
                        key={t.id}
                        label={`${r.name} for ${t.name}`}
                        value={
                          t.resources.find((x) => x.resourceId === r.id)
                            ?.quantity ?? 0
                        }
                        max={10000}
                        onChange={(quantity) =>
                          taskChange(t.id, {
                            resources:
                              quantity > 0
                                ? [
                                    ...t.resources.filter(
                                      (x) => x.resourceId !== r.id,
                                    ),
                                    { resourceId: r.id, quantity },
                                  ]
                                : t.resources.filter(
                                    (x) => x.resourceId !== r.id,
                                  ),
                          })
                        }
                      />
                    ))}
                  </details>
                  <button
                    className="quiet-button danger"
                    onClick={() => change(removeResource(draft, r.id))}
                  >
                    Remove supply and its task requirements
                  </button>
                </div>
              </section>
            ))}
            {!draft.resources.length && (
              <p className="editor-empty">
                No supplies listed. That is fine if your tasks do not need any.
              </p>
            )}
          </>
        )}
        {step === 4 && (
          <>
            <div className="editor-section-title">
              <ClipboardCheck size={20} />
              <div>
                <h4>Make the assumptions yours.</h4>
                <p>
                  {aiUsed
                    ? "AI helped draft requirements. You approve the final inputs; the deterministic engine alone evaluates feasibility."
                    : "Review the final requirements. Approval saves this project and runs the deterministic solver."}
                </p>
              </div>
            </div>
            <div className="review-summary">
              <h4>{draft.name}</h4>
              <p>{draft.brief || "No description entered."}</p>
              <div>
                <span>{draft.tasks.length} tasks</span>
                <span>
                  {draft.tasks.reduce(
                    (n, t) => n + t.roles.reduce((k, r) => k + r.count, 0),
                    0,
                  )}{" "}
                  role slots
                </span>
                <span>{draft.volunteers.length} volunteers</span>
                <span>{draft.resources.length} supplies</span>
                <span>{money(draft.budgetCents)} limit</span>
              </div>
              <p>
                {draft.date} · {draft.timezone} · {draft.audience} planned
                participants
              </p>
            </div>
            {!parsed.success && (
              <div className="editor-error">
                <strong>Complete these requirements before approval:</strong>
                <ul>
                  {validationMessages(parsed.error).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="editor-warning">
                <CircleAlert size={17} />
                <div>
                  <strong>These modeled constraints currently conflict</strong>
                  {warnings.map((w, i) => (
                    <p key={i}>{w.message}</p>
                  ))}
                  <p>
                    You can fix them now or approve the model to investigate
                    interventions.
                  </p>
                </div>
              </div>
            )}
            {draft.planningNotes && (
              <div className="planning-notes">
                <h4>AI drafting notes retained with this model</h4>
                <p className="editor-note">
                  Review or resolve these notes. Unresolved real-world questions
                  remain outside the model and do not become confirmed facts.
                </p>
                <Field label="Assumptions (one per line)">
                  <textarea
                    value={draft.planningNotes.assumptions.join("\n")}
                    rows={3}
                    onChange={(e) =>
                      change({
                        ...draft,
                        planningNotes: {
                          ...draft.planningNotes!,
                          assumptions: e.target.value.split("\n"),
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Unresolved questions (one per line)">
                  <textarea
                    value={draft.planningNotes.questions.join("\n")}
                    rows={3}
                    onChange={(e) =>
                      change({
                        ...draft,
                        planningNotes: {
                          ...draft.planningNotes!,
                          questions: e.target.value.split("\n"),
                        },
                      })
                    }
                  />
                </Field>
              </div>
            )}
            <details className="review-details">
              <summary>Review all task requirements</summary>
              {draft.tasks.map((t) => (
                <article key={t.id}>
                  <strong>
                    {t.name} {t.optional ? "(optional scope)" : ""}
                  </strong>
                  <p>
                    {formatTime(t.start)}–{formatTime(t.end)} ·{" "}
                    {money(t.costCents)} expenses
                  </p>
                  {t.roles.map((r) => (
                    <p key={r.id}>
                      {r.count} × {r.name} · skills:{" "}
                      {r.skills.join(", ") || "general support"} ·
                      qualifications: {r.qualifications.join(", ") || "none"}
                    </p>
                  ))}
                  <p>
                    After:{" "}
                    {t.dependencies
                      .map((id) => draft.tasks.find((x) => x.id === id)?.name)
                      .join(", ") || "no dependencies"}
                  </p>
                </article>
              ))}
            </details>
            <label className="check-label approve-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              I reviewed the task times, roles, qualifications, costs,
              dependencies, inventory, and availability. I accept these as this
              model’s inputs, including any AI suggestions I kept.
            </label>
            <p className="editor-note">
              Approval creates an analyzed model. It does not recruit
              volunteers, purchase supplies, or guarantee real-world success.
            </p>
          </>
        )}
        {errors.length > 0 && (
          <div className="editor-error" role="alert">
            <ul>
              {errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="editor-footer">
        <button
          className="quiet-button"
          onClick={step === 0 ? onClose : () => setStep(step - 1)}
        >
          {step === 0 ? "Cancel draft" : "Back"}
        </button>
        <span>
          Draft only · {step + 1} of {steps.length}
        </span>
        {step < 4 ? (
          <button
            className="button primary small"
            onClick={() => setStep(step + 1)}
          >
            Continue to {steps[step + 1].toLowerCase()}
          </button>
        ) : (
          <button
            className="button primary small"
            disabled={!confirmed || !parsed.success}
            onClick={approve}
          >
            <Check size={16} />
            Approve & analyze project
          </button>
        )}
      </div>
    </Modal>
  );
}
