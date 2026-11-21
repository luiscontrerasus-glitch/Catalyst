"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Copy,
  Download,
  FlaskConical,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { type Project, formatTime, money, slotsFor } from "@/engine/model";
import { solve } from "@/engine/solver";
import { verifyAssignment } from "@/engine/verify";
import {
  analyzeInterventions,
  applyIntervention,
  type Intervention,
} from "@/engine/interventions";
import { type RoomAction, type RoomView } from "@/rooms/model";
import { tokens } from "@/lib/projects";
import { ProjectGraph } from "./project-graph";
import { ProjectEditor } from "./project-editor";
import { Modal } from "./dialog";
import { Brand } from "./brand";
import { InterventionPreview, InterventionOptions } from "./intervention-lab";

const subscribe = () => () => {};
const offlineMessage =
  "Connection interrupted. You are viewing the last received revision. Refresh before making a change.";
export default function SharedRoom({ id }: { id: string }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return hydrated ? (
    <RoomClient key={id} id={id} />
  ) : (
    <div className="room-loading">Opening the shared project…</div>
  );
}
function RoomClient({ id }: { id: string }) {
  const [roomView, setRoomView] = useState<"plan" | "collaboration">("plan");
  const [invitation, setInvitation] = useState(
    () =>
      new URLSearchParams(window.location.hash.slice(1)).get("invite") ?? "",
  );
  const [inviteLink, setInviteLink] = useState(() => {
    try {
      return sessionStorage.getItem(`catalyst:invite:${id}`) ?? "";
    } catch {
      return "";
    }
  });
  const [room, setRoom] = useState<RoomView | null>(null),
    [connection, setConnection] = useState<
      "connecting" | "live" | "offline" | "unauthorized"
    >("connecting"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [name, setName] = useState("Fictional contributor");
  const [editor, setEditor] = useState<{
      project: Project;
      revision: number;
    } | null>(null),
    [editorError, setEditorError] = useState(""),
    [contribute, setContribute] = useState<{
      kind: "volunteer" | "stock";
      revision: number;
    } | null>(null),
    [preview, setPreview] = useState<{
      intervention: Intervention;
      project: Project;
      revision: number;
    } | null>(null),
    [selected, setSelected] = useState(""),
    [showCandidates, setShowCandidates] = useState(false);
  const revision = useRef(0),
    pending = useRef<{
      id: string;
      fingerprint: string;
      revision: number;
    } | null>(null),
    active = useRef(true);
  const accept = useCallback((next: RoomView) => {
    if (!active.current) return;
    revision.current = Math.max(revision.current, next.revision);
    setRoom((current) =>
      !current || next.revision >= current.revision ? next : current,
    );
    setConnection("live");
    setMessage((current) => (current === offlineMessage ? "" : current));
  }, []);
  const refresh = useCallback(
    () =>
      fetch(`/api/rooms/${id}`, {
        headers: revision.current
          ? { "If-None-Match": `"room-${revision.current}"` }
          : {},
        cache: "no-store",
      })
        .then(async (response) => {
          if (!active.current) return;
          if (response.status === 304) {
            setConnection("live");
            setMessage((current) =>
              current === offlineMessage ? "" : current,
            );
            return;
          }
          const data = await response.json();
          if (!response.ok) {
            setConnection(response.status === 401 ? "unauthorized" : "offline");
            setMessage(data.error ?? "The room could not be refreshed.");
            return;
          }
          accept(data.room);
        })
        .catch(() => {
          if (active.current) {
            setConnection("offline");
            setMessage(offlineMessage);
          }
        }),
    [accept, id],
  );
  useEffect(() => {
    active.current = true;
    // Pasting an invitation while already on this room only changes the hash.
    // Reload so the initial invitation gate runs, including for expired sessions;
    // the token stays in the fragment and never enters the server request URL.
    const receiveInvitation = () => {
      if (new URLSearchParams(window.location.hash.slice(1)).get("invite"))
        window.location.reload();
    };
    window.addEventListener("hashchange", receiveInvitation);
    if (window.location.hash)
      history.replaceState(null, "", window.location.pathname);
    return () => {
      active.current = false;
      window.removeEventListener("hashchange", receiveInvitation);
    };
  }, []);
  useEffect(() => {
    if (invitation) return;
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 2000);
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, [invitation, refresh]);
  const result = useMemo(() => (room ? solve(room.project) : null), [room]);
  const verified = useMemo(
    () =>
      Boolean(
        room &&
        result?.status === "feasible" &&
        verifyAssignment(room.project, result.assignments).valid,
      ),
    [room, result],
  );
  const interventions = useMemo(
    () =>
      room && result
        ? analyzeInterventions(room.project, result, { combinations: true })
        : [],
    [room, result],
  );
  async function join(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/rooms/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, invite: invitation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not join.");
      accept(data.room);
      setInvitation("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not join this room.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function mutate(
    action: RoomAction,
    base = room?.revision,
  ): Promise<boolean> {
    if (base === undefined) return false;
    setBusy(true);
    setMessage("");
    const fingerprint = JSON.stringify(action);
    if (pending.current?.fingerprint !== fingerprint)
      pending.current = {
        id: crypto.randomUUID(),
        fingerprint,
        revision: base,
      };
    const request = pending.current!;
    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseRevision: request.revision,
          requestId: request.id,
          action,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        pending.current = null;
        setMessage(data.error ?? "The change was not applied.");
        setEditorError(data.error ?? "The change was not applied.");
        await refresh();
        return false;
      }
      pending.current = null;
      accept(data.room);
      if (data.invite) {
        const link = `${window.location.origin}/rooms/${id}#invite=${data.invite}`;
        setInviteLink(link);
        try {
          sessionStorage.setItem(`catalyst:invite:${id}`, link);
        } catch {}
      } else if (action.kind === "rotate-invite" && data.replayed) {
        // A lost rotation response cannot recover a secret stored only as a
        // digest. Never keep offering the now-invalid previous invitation.
        setInviteLink("");
        try {
          sessionStorage.removeItem(`catalyst:invite:${id}`);
        } catch {}
      }
      setMessage(
        data.replayed
          ? "The previously committed change was confirmed; it was not applied twice."
          : "Shared change saved. Everyone’s model will refresh.",
      );
      setEditorError("");
      return true;
    } catch {
      setMessage(
        "The connection ended before confirmation. Refresh, then retry the same change to safely confirm it without adding it twice.",
      );
      await refresh();
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setMessage(
        "Invitation copied. It grants contributor access; share it privately.",
      );
    } catch {
      setMessage(
        "Clipboard unavailable. Select and copy the invitation field.",
      );
    }
  }
  function exportPlan() {
    if (!room || !result) return;
    const blob = new Blob(
      [
        JSON.stringify(
          {
            project: room.project,
            revision: room.revision,
            result,
            verification: verifyAssignment(room.project, result.assignments),
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
    a.download = "catalyst-shared-project.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (invitation && !room)
    return (
      <main className="join-shell">
        <Brand href="/" />
        <section className="join-card">
          <span className="eyebrow">YOU’RE INVITED TO MAKE IT POSSIBLE</span>
          <h1>
            One shared idea.
            <br />
            <em>Your contribution.</em>
          </h1>
          <p>
            Join with a display name to see the project and contribute your
            skills, availability, or supplies. No account or email is needed.
          </p>
          <form onSubmit={join}>
            <label>
              Display name
              <input
                value={name}
                maxLength={40}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <p className="editor-note">
              Use fictional details for the demo. The invitation grants room
              access and has been removed from the address bar.
            </p>
            {message && (
              <p className="editor-error" role="alert">
                {message}
              </p>
            )}
            <button
              className="button primary"
              type="submit"
              disabled={busy || !name.trim()}
            >
              {busy ? "Joining…" : "Join project room"}
            </button>
          </form>
        </section>
      </main>
    );
  if (!room || !result)
    return (
      <main className="room-loading">
        <Brand href="/" />
        <h1>
          {connection === "unauthorized"
            ? "This room needs an invitation."
            : "Opening the shared project…"}
        </h1>
        <p>{message || "Connecting to durable shared storage."}</p>
        <Link href="/" className="button secondary">
          Return to local workspace
        </Link>
      </main>
    );
  const owner = room.self.role === "owner",
    project = room.project,
    slots = slotsFor(project),
    task = project.tasks.find((t) => t.id === selected) ?? project.tasks[0];
  return (
    <>
      <header className="room-header">
        <Brand href="/" />
        <Link href="/" className="quiet-button">
          <ArrowLeft size={15} />
          Local workspace
        </Link>
        <span className="room-role">
          <ShieldCheck size={15} />
          {owner ? "Organizer" : "Contributor"} · {room.self.name}
        </span>
      </header>
      <main className="room-shell">
        <div className="room-heading">
          <div>
            <div className="eyebrow">SHARED PROJECT ROOM</div>
            <h1>{project.name}</h1>
            <p>
              {project.audience} planned participants · {project.date} ·{" "}
              {project.timezone}
            </p>
          </div>
          <div className="room-actions">
            <button className="button secondary small" onClick={exportPlan}>
              <Download size={15} />
              Export plan
            </button>
            {owner && (
              <button
                className="button secondary small"
                onClick={() => {
                  setEditorError("");
                  setEditor({
                    project: structuredClone(project),
                    revision: room.revision,
                  });
                }}
              >
                Edit requirements
              </button>
            )}
          </div>
        </div>
        <div
          className={`room-sync ${connection !== "live" ? "room-offline" : ""}`}
          role="status"
        >
          <span>
            {connection === "live"
              ? "Connected · checks for updates every 2 seconds"
              : "Connection interrupted · last received model"}
          </span>
          <span>
            Revision {room.revision} ·{" "}
            {room.storage === "managed"
              ? "Managed shared storage"
              : "Durable storage on this server"}
          </span>
          <button className="quiet-button" onClick={() => void refresh()}>
            <RefreshCw size={13} />
            Refresh now
          </button>
        </div>
        {message && (
          <div className="room-notice" role="status">
            {message}
            <button
              className="icon-button"
              aria-label="Dismiss room message"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}
        <nav className="room-tabs" aria-label="Shared room views">
          <button
            aria-current={roomView === "plan" ? "page" : undefined}
            onClick={() => setRoomView("plan")}
          >
            Plan & analysis
          </button>
          <button
            aria-current={roomView === "collaboration" ? "page" : undefined}
            onClick={() => setRoomView("collaboration")}
          >
            Collaboration
          </button>
          <p>
            <Users size={14} /> {room.members.length}{" "}
            {room.members.length === 1 ? "member" : "members"} · declarations,
            not confirmed commitments
          </p>
        </nav>
        {roomView === "collaboration" && (
          <div className="collaboration-intro">
            <h2>Activity & contributions</h2>
            <div className="collaboration-result" aria-live="polite">
              <span>
                {verified ? <Check size={14} /> : <CircleAlert size={14} />}
                {verified ? "Verified feasible" : "Requirements need review"}
              </span>
              <strong>
                {result.filledSlots}
                <span>/{result.totalSlots}</span>
                <small>roles covered</small>
              </strong>
              <button className="text-link" onClick={() => setRoomView("plan")}>
                View the analysis →
              </button>
            </div>
          </div>
        )}
        <div className={`room-layout room-view-${roomView}`}>
          <section className="room-main">
            <div
              className={`room-result ${verified ? "ready" : ""}`}
              aria-live="polite"
            >
              <span className="eyebrow">
                {verified
                  ? "MODELED REQUIREMENTS SATISFIED"
                  : "WHAT WOULD MAKE THIS POSSIBLE?"}
              </span>
              <h2>
                {verified
                  ? "The modeled plan is feasible."
                  : result.status === "unknown"
                    ? "Search incomplete."
                    : result.status === "invalid"
                      ? "Review these requirements."
                      : "A contribution can change the plan."}
              </h2>
              <p>
                {verified
                  ? "The complete assignment is independently verified; budget, supplies, availability, and dependencies pass."
                  : result.issues[0]?.message}
              </p>
              <strong>
                {result.filledSlots}
                <small>/{result.totalSlots} role slots covered</small>
              </strong>
            </div>
            {result.issues.length > 1 && (
              <div className="additional-issues">
                {result.issues.slice(1).map((i, n) => (
                  <p key={n}>{i.message}</p>
                ))}
              </div>
            )}
            <div className="graph-heading">
              <div>
                <h4>How the project fits together</h4>
                <p>Select a task to inspect the actual assignments.</p>
              </div>
              <span>
                {project.tasks.length} tasks · {money(result.costCents)}{" "}
                expenses / {money(project.budgetCents)} limit
              </span>
            </div>
            <ProjectGraph
              key={`${id}-${project.tasks.length}`}
              project={project}
              result={result}
              selectedTask={task.id}
              onSelect={setSelected}
            />
            <div className="task-access">
              <label htmlFor="shared-task">Inspect a task</label>
              <select
                id="shared-task"
                value={task.id}
                onChange={(e) => setSelected(e.target.value)}
              >
                {project.tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="shared-assignments">
              <h4>
                {task.name} · {formatTime(task.start)}–{formatTime(task.end)}
              </h4>
              {slots
                .filter((s) => s.task.id === task.id)
                .map((s) => {
                  const assignment = result.assignments.find(
                      (a) => a.slotId === s.id,
                    ),
                    v = project.volunteers.find(
                      (v) => v.id === assignment?.volunteerId,
                    );
                  return (
                    <p key={s.id} className={v ? "" : "unfilled"}>
                      {s.role.name}: <strong>{v?.name ?? "Unfilled"}</strong>
                    </p>
                  );
                })}
            </div>
            {interventions[0] && (
              <div className="room-turning-point">
                <Zap size={22} />
                <div>
                  <strong>{interventions[0].label}</strong>
                  <p>
                    {interventions[0].resolves
                      ? "Re-solved and independently verified against this room revision."
                      : "Tested change; other requirements remain unmet."}
                  </p>
                </div>
                <button
                  className="button primary small"
                  onClick={() => {
                    setEditorError("");
                    setPreview({
                      intervention: interventions[0],
                      project: structuredClone(project),
                      revision: room.revision,
                    });
                  }}
                >
                  Preview contribution
                </button>
              </div>
            )}
            {interventions.length > 0 && (
              <>
                <button
                  className="quiet-button"
                  onClick={() => setShowCandidates(!showCandidates)}
                >
                  <FlaskConical size={15} />
                  {showCandidates
                    ? "Hide alternative repairs"
                    : "Compare tested repairs"}
                </button>
                {showCandidates && (
                  <InterventionOptions
                    interventions={interventions}
                    onPreview={(intervention) => {
                      setEditorError("");
                      setPreview({
                        intervention,
                        project: structuredClone(project),
                        revision: room.revision,
                      });
                    }}
                  />
                )}
              </>
            )}
            <div className="solver-footer">
              <span>
                Deterministic solver · {result.exploredNodes} search nodes
              </span>
              <span>
                {verified
                  ? "Independent verification passed"
                  : "Partial assignments are diagnostic"}{" "}
                · Model satisfiability is not a real-world guarantee.
              </span>
            </div>
          </section>
          <aside className="room-aside">
            <section className="room-side-card room-contribute">
              <h3>
                <Users size={19} />
                Make your contribution
              </h3>
              <p>
                Your declarations become explicit model inputs. Qualifications
                are participant-provided, not credential checks.
              </p>
              <button
                className="button primary small"
                disabled={busy || connection !== "live"}
                onClick={() => {
                  setMessage("");
                  setContribute({ kind: "volunteer", revision: room.revision });
                }}
              >
                Contribute my availability
              </button>
              <button
                className="button secondary small"
                disabled={
                  busy || connection !== "live" || !project.resources.length
                }
                onClick={() => {
                  setMessage("");
                  setContribute({ kind: "stock", revision: room.revision });
                }}
              >
                <Layers3 size={15} />
                Contribute supplies
              </button>
              {project.volunteers.some(
                (v) => v.id === room.self.volunteerId,
              ) && (
                <button
                  className="quiet-button"
                  disabled={busy || connection !== "live"}
                  onClick={() => void mutate({ kind: "withdraw" })}
                >
                  Withdraw my volunteer contribution
                </button>
              )}
            </section>
            {owner && (
              <section className="room-side-card room-invite">
                <h3>Invite a contributor</h3>
                <p>
                  Anyone with the invitation can join as a contributor. Only
                  your organizer session can edit the whole plan.
                </p>
                <p className="editor-note">
                  No member removal or account-based organizer recovery is
                  available.
                </p>
                <details className="room-access-limits">
                  <summary>Invitation & session limits</summary>
                  <p className="editor-note">
                    Replacing the invitation stops new joins with the old link.
                    Existing members keep access for up to 30 days; individual
                    member revocation is not available. Organizer access belongs
                    to this browser session and cannot be recovered through an
                    account. Use fictional, low-sensitivity planning data.
                  </p>
                </details>
                {inviteLink && (
                  <>
                    <button
                      className="button secondary small"
                      onClick={() => void copyInvite()}
                    >
                      <Copy size={15} />
                      Copy invitation
                    </button>
                    <details>
                      <summary>Show invitation for manual copy</summary>
                      <input
                        aria-label="Room invitation"
                        readOnly
                        value={inviteLink}
                        onFocus={(e) => e.target.select()}
                      />
                    </details>
                  </>
                )}
                <button
                  className="quiet-button"
                  disabled={busy || connection !== "live"}
                  onClick={() => void mutate({ kind: "rotate-invite" })}
                >
                  {inviteLink
                    ? "Replace invitation link"
                    : "Generate invitation link"}
                </button>
                {["127.0.0.1", "localhost"].includes(
                  window.location.hostname,
                ) && (
                  <p className="editor-note">
                    Local preview: this link works across browsers on this
                    computer. Remote participants need a hosted application.
                  </p>
                )}
              </section>
            )}
            <section className="room-side-card room-people">
              <h3>People in this room</h3>
              {room.members.map((m) => (
                <div className="room-member" key={m.id}>
                  <span className="member-identity">
                    <span className="member-initial" aria-hidden="true">
                      {m.name
                        .split(" ")
                        .filter(Boolean)
                        .slice(-2)
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    {m.name}
                  </span>
                  <small>
                    {m.role === "owner" ? "Organizer" : "Contributor"}
                  </small>
                </div>
              ))}
              <p className="editor-note">
                Room membership does not imply availability. Only an explicit
                volunteer contribution enters the solver.
              </p>
            </section>
            <section className="room-side-card room-history">
              <h3>Activity history</h3>
              {room.activity.map((a) => (
                <article key={a.id}>
                  <strong>{a.actor}</strong>
                  <p>{a.summary}</p>
                  <small>
                    Revision {a.revision} ·{" "}
                    {new Date(a.at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </article>
              ))}
            </section>
          </aside>
        </div>
      </main>
      {editor && (
        <ProjectEditor
          initial={editor.project}
          editing
          externalError={editorError}
          onClose={() => setEditor(null)}
          onApprove={async (p) => {
            if (await mutate({ kind: "replace", project: p }, editor.revision))
              setEditor(null);
          }}
        />
      )}
      {preview && (
        <InterventionPreview
          project={preview.project}
          baseline={solve(preview.project)}
          intervention={preview.intervention}
          onClose={() => setPreview(null)}
          applyDisabled={!owner || busy || connection !== "live"}
          externalError={editorError}
          applyLabel={
            owner
              ? "Apply shared change"
              : "Only the organizer can apply this repair"
          }
          onApply={async () => {
            if (
              owner &&
              (await mutate(
                {
                  kind: "replace",
                  project: applyIntervention(
                    preview.project,
                    preview.intervention,
                  ),
                },
                preview.revision,
              ))
            )
              setPreview(null);
          }}
        />
      )}
      {contribute && (
        <ContributionDialog
          room={room}
          kind={contribute.kind}
          busy={busy}
          message={message}
          onClose={() => setContribute(null)}
          onSave={async (action) => {
            if (await mutate(action, contribute.revision)) setContribute(null);
          }}
        />
      )}
    </>
  );
}
function ContributionDialog({
  room,
  kind,
  busy,
  message,
  onClose,
  onSave,
}: {
  room: RoomView;
  kind: "volunteer" | "stock";
  busy: boolean;
  message: string;
  onClose: () => void;
  onSave: (action: RoomAction) => Promise<void>;
}) {
  const existing = room.project.volunteers.find(
      (v) => v.id === room.self.volunteerId,
    ),
    needed = solve(room.project).issues.find((i) => i.kind === "staffing"),
    slot = slotsFor(room.project).find((s) => s.id === needed?.slotId);
  const [skills, setSkills] = useState(existing?.skills.join(", ") ?? ""),
    [qualifications, setQualifications] = useState(
      existing?.qualifications.join(", ") ?? "",
    ),
    [windows, setWindows] = useState(
      existing?.availability ?? [
        {
          start: Math.min(...room.project.tasks.map((t) => t.start)),
          end: Math.max(...room.project.tasks.map((t) => t.end)),
        },
      ],
    ),
    [capacity, setCapacity] = useState(existing?.maxMinutes ?? 120),
    [resourceId, setResourceId] = useState(room.project.resources[0]?.id ?? ""),
    [quantity, setQuantity] = useState(1),
    [reviewed, setReviewed] = useState(false),
    [error, setError] = useState("");
  const toMinute = (value: string) => {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m;
  };
  return (
    <Modal
      title={
        kind === "volunteer"
          ? "Show up where it matters."
          : "Share what you can contribute."
      }
      onClose={onClose}
    >
      <form
        className="volunteer-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!reviewed) {
            setError(
              "Confirm that these are the inputs you want to contribute.",
            );
            return;
          }
          if (kind === "stock") {
            void onSave({ kind: "stock", resourceId, quantity });
            return;
          }
          if (
            windows.some(
              (w) =>
                !Number.isFinite(w.start) ||
                !Number.isFinite(w.end) ||
                w.end <= w.start,
            )
          ) {
            setError("Each availability window must end after it starts.");
            return;
          }
          void onSave({
            kind: "volunteer",
            profile: {
              skills: tokens(skills),
              qualifications: tokens(qualifications),
              availability: windows,
              maxMinutes: capacity,
            },
          });
        }}
      >
        <p className="modal-intro">
          Contributing as <strong>{room.self.name}</strong>. Use fictional
          inputs for the hackathon demonstration.
        </p>
        {kind === "volunteer" ? (
          <>
            {slot && (
              <p className="room-needed">
                Current gap: {slot.role.name}. Skills:{" "}
                {slot.role.skills.join(", ") || "general support"}.
                Qualifications: {slot.role.qualifications.join(", ") || "none"}.
              </p>
            )}
            <label>
              My skills (comma-separated)
              <input
                value={skills}
                onChange={(e) => {
                  setSkills(e.target.value);
                  setReviewed(false);
                }}
                placeholder="e.g. robotics"
              />
            </label>
            <label>
              My declared qualifications (comma-separated)
              <input
                value={qualifications}
                onChange={(e) => {
                  setQualifications(e.target.value);
                  setReviewed(false);
                }}
                placeholder="e.g. robotics_instruction"
              />
            </label>
            <p className="editor-note">
              Names are normalized consistently with project roles. Declared
              qualifications are not independently authenticated.
            </p>
            {windows.map((w, i) => (
              <div className="availability-editor" key={i}>
                <label>
                  Available from
                  <input
                    type="time"
                    required
                    value={formatTime(w.start)}
                    onChange={(e) => {
                      setWindows(
                        windows.map((x, j) =>
                          j === i
                            ? { ...x, start: toMinute(e.target.value) }
                            : x,
                        ),
                      );
                      setReviewed(false);
                    }}
                  />
                </label>
                <label>
                  Available until
                  <input
                    type="time"
                    required
                    value={formatTime(w.end)}
                    onChange={(e) => {
                      setWindows(
                        windows.map((x, j) =>
                          j === i ? { ...x, end: toMinute(e.target.value) } : x,
                        ),
                      );
                      setReviewed(false);
                    }}
                  />
                </label>
                {windows.length > 1 && (
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Remove contribution window ${i + 1}`}
                    onClick={() => {
                      setWindows(windows.filter((_, j) => i !== j));
                      setReviewed(false);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              className="quiet-button"
              type="button"
              disabled={windows.length >= 10}
              onClick={() => {
                setWindows([...windows, { start: 540, end: 1020 }]);
                setReviewed(false);
              }}
            >
              Add availability window
            </button>
            <label>
              Maximum workload (minutes)
              <input
                type="number"
                min="0"
                max="1440"
                value={capacity}
                required
                onChange={(e) => {
                  setCapacity(e.target.valueAsNumber);
                  setReviewed(false);
                }}
              />
            </label>
            <p className="editor-note">
              Times use {room.project.timezone} on {room.project.date}. Default
              times and capacity are placeholders; review them before
              contributing.
            </p>
          </>
        ) : (
          <>
            <label>
              Supply to contribute
              <select
                value={resourceId}
                onChange={(e) => {
                  setResourceId(e.target.value);
                  setReviewed(false);
                }}
              >
                {room.project.resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.quantity} currently available
                  </option>
                ))}
              </select>
            </label>
            <label>
              Additional quantity I can provide
              <input
                type="number"
                min="1"
                max="10000"
                required
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.valueAsNumber);
                  setReviewed(false);
                }}
              />
            </label>
            <p className="editor-note">
              This adds existing, donated stock to shared inventory. It does not
              spend the project budget or change task requirements.
            </p>
          </>
        )}
        <label className="check-label">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
          />
          I reviewed these inputs and want to contribute them to this model.
        </label>
        {(error || message) && (
          <p className="editor-error" role="alert">
            {error || message}
          </p>
        )}
        <button
          className="button primary"
          type="submit"
          disabled={busy || !reviewed}
        >
          <Check size={16} />
          {busy ? "Saving…" : "Save my contribution"}
        </button>
      </form>
    </Modal>
  );
}
