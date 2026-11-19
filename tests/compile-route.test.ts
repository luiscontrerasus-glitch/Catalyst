import { beforeEach, describe, expect, it, vi } from "vitest";
const provider = vi.hoisted(() => ({ configured: false, generate: vi.fn() }));
vi.mock("@/ai/provider.server", () => ({
  providerStatus: () => ({
    configured: provider.configured,
    provider: "Google Gemini",
    model: "test-model",
  }),
  generateProposal: provider.generate,
}));
const fixture = {
  title: "Test circle",
  summary: "Test fixture only",
  facts: [],
  assumptions: ["Confirm all requirements"],
  questions: [],
  tasks: [
    {
      id: "task",
      name: "Task",
      start: 600,
      end: 660,
      dependencies: [],
      roles: [
        {
          id: "role",
          name: "Helper",
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
  resources: [],
};
beforeEach(() => {
  vi.resetModules();
  provider.configured = false;
  provider.generate.mockReset();
  provider.generate.mockResolvedValue(JSON.stringify(fixture));
});
const req = (body: string, origin = "http://localhost:3100") =>
  new Request("http://localhost:3100/api/compile", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body,
  });
describe("server compiler HTTP boundary with mocked provider", () => {
  it("reports configuration without returning credentials", async () => {
    const { GET } = await import("@/app/api/compile/route");
    const r = GET();
    expect(await r.json()).toEqual({
      configured: false,
      provider: "Google Gemini",
      model: "test-model",
    });
    expect(r.headers.get("cache-control")).toBe("no-store");
  });
  it("returns an honest unavailable response and never calls the provider without a key", async () => {
    const { POST } = await import("@/app/api/compile/route");
    const r = await POST(
      req(JSON.stringify({ goal: "Plan a reading circle" })),
    );
    expect(r.status).toBe(503);
    expect((await r.json()).code).toBe("unavailable");
    expect(provider.generate).not.toHaveBeenCalled();
  });
  it("rejects cross-origin requests", async () => {
    const { POST } = await import("@/app/api/compile/route");
    expect((await POST(req("{}", "https://outside.example"))).status).toBe(403);
  });
  it("rejects malformed and oversized requests before a provider call", async () => {
    const { POST } = await import("@/app/api/compile/route");
    expect((await POST(req("{bad"))).status).toBe(400);
    expect((await POST(req("x".repeat(12001)))).status).toBe(413);
    expect(provider.generate).not.toHaveBeenCalled();
  });
  it("returns a strictly validated proposal when configured", async () => {
    provider.configured = true;
    const { POST } = await import("@/app/api/compile/route");
    const r = await POST(
      req(JSON.stringify({ goal: "Plan a community reading circle" })),
    );
    expect(r.status).toBe(200);
    expect((await r.json()).proposal.title).toBe("Test circle");
  });
  it("rejects malformed provider output and redacts provider errors", async () => {
    provider.configured = true;
    const { POST } = await import("@/app/api/compile/route");
    provider.generate.mockResolvedValueOnce("not json");
    expect(
      (
        await POST(
          req(JSON.stringify({ goal: "Plan a community reading circle" })),
        )
      ).status,
    ).toBe(502);
    provider.generate.mockRejectedValueOnce({
      status: 403,
      message: "fixture-secret-DO-NOT-RETURN",
    });
    const r = await POST(
      req(JSON.stringify({ goal: "Plan a community reading circle" })),
    );
    expect(r.status).toBe(503);
    expect(await r.text()).not.toContain("fixture-secret");
  });
  it("enforces a bounded local request rate", async () => {
    provider.configured = true;
    const { POST } = await import("@/app/api/compile/route");
    for (let i = 0; i < 5; i++)
      expect(
        (
          await POST(
            req(JSON.stringify({ goal: "Plan a community reading circle" })),
          )
        ).status,
      ).toBe(200);
    const r = await POST(
      req(JSON.stringify({ goal: "Plan a community reading circle" })),
    );
    expect(r.status).toBe(429);
    expect(r.headers.get("retry-after")).toBe("60");
    expect(provider.generate).toHaveBeenCalledTimes(5);
  });
});
