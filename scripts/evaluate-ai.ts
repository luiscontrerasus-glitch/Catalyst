import { mkdirSync, writeFileSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { aiEvaluationSet } from "../src/evaluation/fixtures";
import { compileGoal, CompilerError } from "../src/ai/compiler";
import { proposalToDraft } from "../src/ai/schema";
import { approveProjectDraft, blankProject } from "../src/lib/projects";
import { solve } from "../src/engine/solver";
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
async function main() {
  const configured = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  );
  const records: Record<string, unknown>[] = [];
  let providerResponses = 0;
  if (configured) {
    const { generateProposal, providerStatus } = await import(
      "../src/ai/provider.server"
    );
    for (const f of aiEvaluationSet) {
      const start = performance.now();
      try {
        const proposal = await compileGoal({ goal: f.goal }, async (goal) => {
          const response = await generateProposal(goal);
          providerResponses++;
          return response;
        });
        let approvalBlocked = false;
        const draft = proposalToDraft(proposal, {
          ...blankProject(`ai-evaluation-${f.id}`),
          brief: f.goal,
        });
        try {
          approveProjectDraft(draft, false);
        } catch {
          approvalBlocked = true;
        }
        const approved = approveProjectDraft(draft, true),
          result = solve(approved);
        records.push({
          id: f.id,
          model: providerStatus().model,
          status: "success",
          durationMs: performance.now() - start,
          tasks: proposal.tasks.length,
          facts: proposal.facts,
          assumptions: proposal.assumptions,
          questions: proposal.questions,
          proposal,
          hasExpectedQuestions:
            !f.expectsQuestions || proposal.questions.length > 0,
          approvalBlocked,
          volunteersInvented: draft.volunteers.length > 0,
          inventoryInvented: draft.resources.some((r) => r.quantity !== 0),
          actualFeasibilityAfterApproval: result.status,
        });
      } catch (error) {
        records.push({
          id: f.id,
          status: "error",
          code:
            error instanceof CompilerError ? error.code : "evaluation_error",
          message:
            error instanceof CompilerError
              ? error.message
              : "The evaluation could not complete; no raw provider error is recorded.",
          durationMs: performance.now() - start,
        });
      }
    }
  }
  const report = {
    generatedAt: new Date().toISOString(),
    status: configured ? "executed" : "not_run_missing_credentials",
    sdk: "@google/genai",
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    successfulLiveRequests: records.filter((r) => r.status === "success")
      .length,
    providerResponses,
    failedCalls: records.filter((r) => r.status === "error").length,
    records,
    instructions: configured
      ? "These are actual provider outcomes, not mocked responses."
      : "Set GEMINI_API_KEY in Catalyst .env.local and restart or rerun this evaluation. No provider request was attempted.",
  };
  mkdirSync("docs/evaluations", { recursive: true });
  writeFileSync(
    "docs/evaluations/ai-latest.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      status: report.status,
      successfulLiveRequests: report.successfulLiveRequests,
      requests: records.length,
    }),
  );
  if (
    configured &&
    records.some(
      (r) =>
        r.status !== "success" ||
        !r.approvalBlocked ||
        r.volunteersInvented ||
        r.inventoryInvented ||
        !r.hasExpectedQuestions,
    )
  )
    process.exitCode = 1;
}
void main().catch(() => {
  console.error(
    "AI evaluation could not start. No raw provider error is printed.",
  );
  process.exitCode = 1;
});
