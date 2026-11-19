import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("TURSO_DATABASE_URL", "");
  vi.stubEnv("TURSO_AUTH_TOKEN", "");
  vi.stubEnv("REQUIRE_MANAGED_ROOMS", "true");
});
afterEach(() => vi.unstubAllEnvs());
it("fails shared-room health closed instead of using ephemeral local storage when managed persistence is required", async () => {
  const { roomStore } = await import("@/rooms/runtime.server");
  expect(() => roomStore()).toThrow("Managed rooms are required");
  const { GET } = await import("@/app/api/health/route");
  const response = await GET();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: "rooms-unavailable" });
});
it("rejects a managed URL without its server credential before opening a client", async () => {
  vi.stubEnv("TURSO_DATABASE_URL", "libsql://fictional-not-contacted.turso.io");
  const { roomStore } = await import("@/rooms/runtime.server");
  expect(() => roomStore()).toThrow("credential is missing");
});
it("rejects local and insecure schemes configured as a managed backend", async () => {
  vi.stubEnv("TURSO_DATABASE_URL", "http://fictional-not-contacted.invalid");
  vi.stubEnv("TURSO_AUTH_TOKEN", "synthetic-test-only");
  const { roomStore } = await import("@/rooms/runtime.server");
  expect(() => roomStore()).toThrow("must use libsql or HTTPS");
});
