import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/ai/provider.server", () => ({
  providerStatus: () => ({
    configured: false,
    provider: "Google Gemini",
    model: "test",
  }),
  generateProposal: vi.fn(),
}));
import { POST } from "@/app/api/compile/route";
afterEach(() => vi.unstubAllEnvs());
it("reaches graceful missing-key handling when browser Host differs from Next's internal URL", async () => {
  vi.stubEnv("APP_ORIGIN", "");
  const response = await POST(
    new Request("http://localhost:3100/api/compile", {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:3100",
        host: "127.0.0.1:3100",
        "content-type": "application/json",
      },
      body: JSON.stringify({ goal: "A fictional community reading event." }),
    }),
  );
  expect(response.status).toBe(503);
  expect((await response.json()).code).toBe("unavailable");
});
