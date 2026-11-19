import { expect, it } from "vitest";
import { providerProposalSchema } from "@/ai/provider-schema";
import { proposalSchema } from "@/ai/schema";
it("uses a reduced provider grammar while retaining typed required fields and strict objects", () => {
  const text = JSON.stringify(providerProposalSchema);
  expect(text).not.toMatch(/"(?:minItems|maxItems|minimum|maximum|format)":/);
  expect(text).toContain('"pattern"');
  expect(providerProposalSchema.required).toContain("assumptions");
  expect(providerProposalSchema.additionalProperties).toBe(false);
  expect(text).toContain('"integer"');
  expect(text).toContain('"consumable"');
});
it("retains application bounds even though provider decoding omits them", () => {
  const input = {
    title: "Synthetic",
    summary: "Only a test",
    facts: [],
    assumptions: ["Confirm"],
    questions: [],
    resources: [],
    tasks: [
      {
        id: "bad id",
        name: "Task",
        start: -1,
        end: 1500,
        dependencies: [],
        roles: [
          {
            id: "helper",
            name: "Helper",
            skills: [],
            qualifications: [],
            count: 100,
          },
        ],
        resources: [],
        costCents: -1,
        optional: false,
      },
    ],
  };
  const parsed = proposalSchema.safeParse(input);
  expect(parsed.success).toBe(false);
  if (!parsed.success) {
    expect(parsed.error.issues.some((i) => i.path.includes("start"))).toBe(
      true,
    );
    expect(parsed.error.issues.some((i) => i.path.includes("count"))).toBe(
      true,
    );
  }
});
