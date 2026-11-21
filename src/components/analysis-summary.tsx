"use client";
import { CheckCheck, CircleAlert, FlaskConical } from "lucide-react";
import type { SolveResult } from "@/engine/model";
import type { Intervention } from "@/engine/interventions";
export function AnalysisSummary({
  result,
  primary,
  onPreview,
}: {
  result: SolveResult;
  primary?: Intervention;
  onPreview: (i: Intervention) => void;
}) {
  const ready = result.status === "feasible";
  return (
    <section
      id="turning-point"
      className={`feasibility-panel analysis-summary ${ready ? "is-feasible" : ""}`}
      aria-live="polite"
    >
      <div className="findings-heading">
        <span>Findings</span>
        <CheckCheck size={17} aria-hidden="true" />
      </div>
      <div className="feasibility-message">
        <span className="result-icon">
          {ready ? <CheckCheck size={25} /> : <CircleAlert size={25} />}
        </span>
        <div>
          <span className="result-eyebrow">
            {ready ? "ALL MODELED REQUIREMENTS PASS" : "FEASIBILITY ANALYSIS"}
          </span>
          <h4>
            {ready
              ? "Verified feasible"
              : result.status === "unknown"
                ? "Search incomplete — no feasibility verdict"
                : result.status === "invalid"
                  ? "Review the project inputs"
                  : "The plan needs support."}
          </h4>
          <p>
            {ready
              ? "A complete assignment passes the independent checker, including budget, supplies, availability, and dependencies."
              : result.issues[0]?.message}
          </p>
          {result.issues.length > 1 && (
            <details className="summary-more">
              <summary>
                {result.issues.length - 1} other unmet requirement(s)
              </summary>
              {result.issues.slice(1).map((i, n) => (
                <p key={n}>{i.message}</p>
              ))}
            </details>
          )}
        </div>
      </div>
      <div className="role-count">
        <strong>
          {result.filledSlots}
          <span>/{result.totalSlots}</span>
        </strong>
        <span>role slots covered</span>
      </div>
      {primary && (
        <div className="summary-intervention">
          <div>
            <strong>{primary.label}</strong>
            <span>
              {primary.resolves
                ? "Re-solved and independently verified"
                : "Tested change; other requirements may remain"}
            </span>
          </div>
          <button
            className="button primary small"
            onClick={() => onPreview(primary)}
          >
            <FlaskConical size={15} />
            Preview this change
          </button>
        </div>
      )}
    </section>
  );
}
