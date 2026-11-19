import { describe, expect, it } from "vitest";
import { compileGoal, CompilerError } from "@/ai/compiler";
import {
  proposalSchema,
  proposalToDraft,
  validateProposal,
  type Proposal,
} from "@/ai/schema";
import { approveProjectDraft, blankProject } from "@/lib/projects";
import { solve } from "@/engine/solver";
const goal = "Run a community reading circle for 12 people with $50.";
const fixture = (): Proposal => ({
  title: "Community reading circle",
  summary: "Read and share together.",
  facts: [
    { statement: "The target audience is 12.", evidenceQuote: "12 people" },
  ],
  assumptions: ["Suggested time is 10:00–11:00; confirm the date and timing."],
  questions: ["Who can facilitate?", "What supplies are already available?"],
  tasks: [
    {
      id: "circle",
      name: "Read together",
      start: 600,
      end: 660,
      dependencies: [],
      roles: [
        {
          id: "reader",
          name: "Facilitator",
          count: 1,
          skills: ["reading"],
          qualifications: [],
        },
      ],
      resources: [{ resourceId: "books", quantity: 12 }],
      costCents: 1000,
      optional: false,
    },
  ],
  resources: [{ id: "books", name: "Books", kind: "reusable" as const }],
});
describe("strict AI proposal boundaries", () => {
  it("accepts a valid structured proposal with explicit assumptions and evidence", () => {
    expect(validateProposal(fixture(), goal).facts[0].evidenceQuote).toBe(
      "12 people",
    );
  });
  it.each(["volunteers", "budgetCents", "inventory", "feasible"])(
    "rejects invented authoritative field %s",
    (field) => {
      expect(
        proposalSchema.safeParse({ ...fixture(), [field]: [] }).success,
      ).toBe(false);
    },
  );
  it("rejects invented inventory inside a proposed supply", () => {
    const f = fixture();
    expect(
      proposalSchema.safeParse({
        ...f,
        resources: [{ ...f.resources[0], quantity: 12 }],
      }).success,
    ).toBe(false);
  });
  it("rejects an unsupported factual quote", () => {
    const f = fixture();
    f.facts[0].evidenceQuote = "We have twelve verified volunteers";
    expect(() => validateProposal(f, goal)).toThrow("quote");
  });
  it("rejects unknown dependencies and resource references", () => {
    const f = fixture();
    f.tasks[0].dependencies = ["missing"];
    expect(() => validateProposal(f, goal)).toThrow("references");
    f.tasks[0].dependencies = [];
    f.tasks[0].resources[0].resourceId = "missing";
    expect(() => validateProposal(f, goal)).toThrow("references");
  });
  it("rejects empty assumptions, invalid intervals, and duplicate IDs", () => {
    const f = fixture();
    expect(proposalSchema.safeParse({ ...f, assumptions: [] }).success).toBe(
      false,
    );
    f.tasks[0].end = 500;
    expect(proposalSchema.safeParse(f).success).toBe(false);
    f.tasks[0].end = 660;
    f.tasks.push(structuredClone(f.tasks[0]));
    expect(() => validateProposal(f, goal)).toThrow("references");
  });
  it("converts to an unapproved draft without inventing budget, volunteers, inventory, or date", () => {
    const base = {
      ...blankProject("custom-ai"),
      brief: goal,
      date: "2026-11-21",
      timezone: "America/New_York",
      budgetCents: 5000,
    };
    const draft = proposalToDraft(validateProposal(fixture(), goal), base);
    expect(draft.budgetCents).toBe(5000);
    expect(draft.date).toBe(base.date);
    expect(draft.volunteers).toEqual([]);
    expect(draft.resources[0].quantity).toBe(0);
    expect(draft.planningNotes?.source).toBe("gemini");
    expect(() => approveProjectDraft(draft, false)).toThrow();
    const approved = approveProjectDraft(draft, true);
    expect(solve(approved).status).toBe("infeasible");
    expect(solve(approved).issues.some((i) => i.kind === "resource")).toBe(
      true,
    );
  });
});
describe("compiler pipeline with explicit test doubles (no live API calls)", () => {
  it("parses and validates provider text", async () => {
    const out = await compileGoal({ goal }, async () =>
      JSON.stringify(fixture()),
    );
    expect(out.title).toBe("Community reading circle");
  });
  it.each([
    undefined,
    "",
    "not json",
    "{}",
    '{"tasks":[]}',
    "```json\n{}\n```",
  ])("rejects missing or invalid provider output %s", async (text) => {
    await expect(compileGoal({ goal }, async () => text)).rejects.toMatchObject(
      { code: "invalid_output" },
    );
  });
  it("does not call a provider on an invalid input", async () => {
    let called = false;
    await expect(
      compileGoal({ goal: "x" }, async () => {
        called = true;
        return "";
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
    expect(called).toBe(false);
  });
  it("preserves an honest unavailable error", async () => {
    await expect(
      compileGoal({ goal }, async () => {
        throw new CompilerError("unavailable", "No key configured", 503);
      }),
    ).rejects.toMatchObject({ code: "unavailable", status: 503 });
  });
  it.each([
    [429, "rate_limit"],
    [401, "credentials"],
    [403, "credentials"],
    [500, "provider"],
  ])(
    "handles provider status %s without leaking the raw error",
    async (status, code) => {
      let caught: unknown;
      try {
        await compileGoal({ goal }, async () => {
          throw { status, message: "fixture-secret-DO-NOT-RETURN" };
        });
      } catch (e) {
        caught = e;
      }
      expect(caught).toMatchObject({ code });
      expect(String(caught)).not.toContain("fixture-secret");
    },
  );
  it("handles timeouts explicitly", async () => {
    await expect(
      compileGoal({ goal }, async () => {
        const e = new Error("secret");
        e.name = "TimeoutError";
        throw e;
      }),
    ).rejects.toMatchObject({ code: "timeout", status: 504 });
  });
});
