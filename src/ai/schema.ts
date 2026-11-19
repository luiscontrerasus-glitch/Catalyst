import { z } from "zod";
import { roleSchema, type Project } from "@/engine/model";
const identifier = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+$/)
  .max(100);
const suggestedTaskSchema = z
  .object({
    id: identifier,
    name: z.string().min(1).max(160),
    start: z.number().int().min(0).max(1439),
    end: z.number().int().min(1).max(1440),
    dependencies: z.array(identifier).max(8),
    roles: z.array(roleSchema.strict()).min(1).max(4),
    resources: z
      .array(
        z
          .object({
            resourceId: identifier,
            quantity: z.number().int().min(1).max(10000),
          })
          .strict(),
      )
      .max(15),
    costCents: z.number().int().min(0).max(100000000),
    optional: z.boolean(),
  })
  .strict()
  .refine(
    (t) => t.end > t.start,
    "Suggested task must have a positive duration",
  );
export const proposalSchema = z
  .object({
    title: z.string().min(1).max(160),
    summary: z.string().min(1).max(3000),
    facts: z
      .array(
        z
          .object({
            statement: z.string().min(1).max(500),
            evidenceQuote: z.string().min(1).max(500),
          })
          .strict(),
      )
      .max(15),
    assumptions: z.array(z.string().min(1).max(500)).min(1).max(20),
    questions: z.array(z.string().min(1).max(500)).max(20),
    tasks: z.array(suggestedTaskSchema).min(1).max(8),
    resources: z
      .array(
        z
          .object({
            id: identifier,
            name: z.string().min(1).max(160),
            kind: z.enum(["reusable", "consumable"]),
          })
          .strict(),
      )
      .max(15),
  })
  .strict();
export type Proposal = z.infer<typeof proposalSchema>;
export const goalSchema = z
  .object({
    goal: z
      .string()
      .trim()
      .min(12, "Describe your project in at least 12 characters.")
      .max(5000, "Keep your idea under 5,000 characters."),
  })
  .strict();
export function validateProposal(input: unknown, goal: string): Proposal {
  const proposal = proposalSchema.parse(input);
  if (proposal.facts.some((f) => !goal.includes(f.evidenceQuote)))
    throw new Error("A claimed fact does not quote the supplied brief.");
  const taskIds = proposal.tasks.map((t) => t.id),
    resourceIds = proposal.resources.map((r) => r.id);
  if (
    new Set(taskIds).size !== taskIds.length ||
    new Set(resourceIds).size !== resourceIds.length ||
    proposal.tasks.some(
      (t) =>
        t.dependencies.some((id) => !taskIds.includes(id)) ||
        t.resources.some((r) => !resourceIds.includes(r.resourceId)),
    )
  )
    throw new Error(
      "The proposal contains duplicate or unknown task/resource references.",
    );
  return proposal;
}
/** Produces an unapproved editor draft, never a feasibility result or commitment. */
export function proposalToDraft(proposal: Proposal, base: Project): Project {
  return {
    ...structuredClone(base),
    name: proposal.title,
    brief: base.brief,
    tasks: structuredClone(proposal.tasks),
    volunteers: [],
    resources: proposal.resources.map((r) => ({ ...r, quantity: 0 })),
    planningNotes: {
      source: "gemini",
      assumptions: [...proposal.assumptions],
      questions: [...proposal.questions],
    },
  };
}
