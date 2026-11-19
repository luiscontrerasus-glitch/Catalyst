"use client";
import {
  CheckCheck,
  CircleAlert,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { money, type Project, type SolveResult } from "@/engine/model";
import {
  applyIntervention,
  rankingExplanation,
  type Intervention,
} from "@/engine/interventions";
import { Modal } from "./dialog";
const labels = {
  verified: "Verified feasible",
  promising: "Promising · incomplete",
  blocked: "Still blocked",
  unknown: "Search incomplete",
};
export function InterventionOptions({
  interventions,
  onPreview,
}: {
  interventions: Intervention[];
  onPreview: (i: Intervention) => void;
}) {
  const card = (i: Intervention) => (
    <article className={`candidate-card candidate-${i.outcome}`} key={i.id}>
      <span className="candidate-state">
        {i.resolves ? <ShieldCheck size={14} /> : <CircleAlert size={14} />}
        {labels[i.outcome ?? "blocked"]}
      </span>
      <strong>{i.label}</strong>
      <p>
        {i.metrics?.changes} modeled change{i.metrics?.changes === 1 ? "" : "s"}{" "}
        · {money(i.metrics?.addedCostCents ?? 0)} known added expenses
        {i.metrics?.unpriced ? " · some costs unknown" : ""}
      </p>
      <p>
        Score {i.metrics?.score.toFixed(1)} · {i.metrics?.disruptedAssignments}{" "}
        previous assignments changed
      </p>
      <button className="button secondary small" onClick={() => onPreview(i)}>
        Preview intervention
      </button>
    </article>
  );
  return (
    <section className="candidate-section">
      <div className="panel-heading">
        <div>
          <h4>Tested paths forward</h4>
          <p>
            {interventions.length}{" "}
            {interventions.length === 1 ? "candidate" : "candidates"} re-solved
            against this exact project.
          </p>
        </div>
        <FlaskConical size={20} />
      </div>
      <div className="candidate-grid">
        {interventions.slice(0, 3).map(card)}
      </div>
      {interventions.length > 3 && (
        <details className="more-candidates">
          <summary>
            View {interventions.length - 3} other tested candidates
          </summary>
          <div className="candidate-grid">
            {interventions.slice(3).map(card)}
          </div>
        </details>
      )}
      <details className="ranking-details">
        <summary>How candidates are ranked</summary>
        <p>{rankingExplanation}</p>
        <p>
          Search includes up to 12 individual candidates, pairs among the first
          six, and funding repairs for resulting purchase costs. Reassignment
          within capabilities is performed by every solve. Equal scores are
          ordered by stable candidate ID.
        </p>
      </details>
    </section>
  );
}
export function InterventionPreview({
  project,
  baseline,
  intervention: i,
  onClose,
  onApply,
}: {
  project: Project;
  baseline: SolveResult;
  intervention: Intervention;
  onClose: () => void;
  onApply: () => void;
}) {
  const next = applyIntervention(project, i);
  return (
    <Modal title="See the change before you make it." onClose={onClose} wide>
      <span className={`preview-state candidate-${i.outcome}`}>
        {i.resolves ? <CheckCheck size={18} /> : <CircleAlert size={18} />}
        {labels[i.outcome ?? "blocked"]}
      </span>
      <h4 className="preview-title">{i.label}</h4>
      <p className="modal-intro">{i.explanation}</p>
      <div className="comparison intervention-comparison">
        <div>
          <span>CURRENT PLAN</span>
          <strong>
            {baseline.filledSlots}
            <small> / {baseline.totalSlots} roles</small>
          </strong>
          <p>{baseline.status}</p>
        </div>
        <span className="compare-symbol">⇢</span>
        <div className={i.resolves ? "comparison-ready" : ""}>
          <span>PREVIEW · NOT APPLIED</span>
          <strong>
            {i.result.filledSlots}
            <small> / {i.result.totalSlots} roles</small>
          </strong>
          <p>{i.result.status}</p>
        </div>
      </div>
      <div className="preview-metrics">
        <span>Model edits: {i.metrics?.changes}</span>
        <span>{money(i.metrics?.addedCostCents ?? 0)} added known cost</span>
        <span>Budget: {money(next.budgetCents)}</span>
        <span>+{i.metrics?.addedMinutes} assigned workload minutes</span>
        <span>{i.metrics?.disruptedAssignments} assignments changed</span>
      </div>
      {i.metrics?.unpriced && (
        <p className="editor-warning">
          Some supply acquisition costs are unknown. The result assumes that
          inventory change can be made within the modeled expenses; confirm
          costs before acting.
        </p>
      )}
      {i.changes?.some((c) => c.kind === "scope") && (
        <p className="editor-warning">
          This intervention reduces optional project scope. Feasibility applies
          to the remaining requirements.
        </p>
      )}
      <div
        className={i.resolves ? "preview-verification" : "preview-bottlenecks"}
      >
        <strong>
          {i.resolves
            ? "Complete assignment independently verified"
            : "Remaining bottlenecks"}
        </strong>
        {i.resolves ? (
          <p>
            All modeled roles, skills, qualifications, availability, workloads,
            inventory, budget, and dependency constraints pass. The current
            project is unchanged until you apply.
          </p>
        ) : (
          <ul>
            {i.result.issues.map((issue, index) => (
              <li key={index}>{issue.message}</li>
            ))}
          </ul>
        )}
      </div>
      <details className="ranking-details">
        <summary>Ranking & proof limits</summary>
        <p>{rankingExplanation}</p>
        <p>
          Full certificate valid: {String(i.verification?.valid ?? false)}. A
          partial staffing assignment is not a valid full-project certificate.
        </p>
      </details>
      <div className="editor-footer">
        <button className="quiet-button" onClick={onClose}>
          Keep current plan
        </button>
        <button className="button primary small" onClick={onApply}>
          Apply{" "}
          {i.metrics?.changes === 1 ? "modeled change" : "modeled changes"}
        </button>
      </div>
    </Modal>
  );
}
