import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ generate: vi.fn(), consumeRate: vi.fn() }));
vi.mock('@/ai/provider.server', () => ({
  providerStatus: () => ({ configured: true, provider: 'Gemini', model: 'mocked' }),
  generateProposal: mocks.generate,
}));
vi.mock('@/rooms/runtime.server', () => ({ roomStore: async () => ({ consumeRate: mocks.consumeRate }) }));
beforeEach(() => {
  vi.resetModules(); mocks.generate.mockReset(); mocks.consumeRate.mockReset();
  vi.stubEnv('VERCEL', '1'); vi.stubEnv('APP_ORIGIN', 'https://catalyst.example');
});
afterEach(() => vi.unstubAllEnvs());
function request(body = JSON.stringify({ goal: 'A fictional community event' }), origin?: string, type = 'application/json') {
  return new Request('https://catalyst.example/api/compile', { method: 'POST', body,
    headers: { ...(origin ? { origin } : {}), 'content-type': type } });
}
it('rejects missing origins and non-JSON content before touching provider or quota', async () => {
  const { POST } = await import('@/app/api/compile/route');
  expect((await POST(request())).status).toBe(403);
  expect((await POST(request('{}', 'https://catalyst.example', 'text/plain'))).status).toBe(415);
  expect(mocks.generate).not.toHaveBeenCalled(); expect(mocks.consumeRate).not.toHaveBeenCalled();
});
it('bounds streamed UTF-8 bytes even without Content-Length', async () => {
  const { POST } = await import('@/app/api/compile/route');
  expect((await POST(request('界'.repeat(9000), 'https://catalyst.example'))).status).toBe(413);
  expect(mocks.generate).not.toHaveBeenCalled();
});
it('retains valid multibyte briefs within the existing character allowance', async () => {
  mocks.consumeRate.mockResolvedValue(false);
  const { POST } = await import('@/app/api/compile/route');
  const response = await POST(request(JSON.stringify({ goal: '界'.repeat(4000) }), 'https://catalyst.example'));
  expect(response.status).toBe(429);
  expect(mocks.consumeRate).toHaveBeenCalled();
});
it('fails closed when distributed quota storage is unavailable and redacts its error', async () => {
  mocks.consumeRate.mockRejectedValue(new Error('synthetic-database-secret'));
  const { POST } = await import('@/app/api/compile/route');
  const response = await POST(request(undefined, 'https://catalyst.example'));
  expect(response.status).toBe(503); expect(await response.text()).not.toContain('synthetic-database-secret');
  expect(mocks.generate).not.toHaveBeenCalled();
});
it('honors the shared quota without calling Gemini', async () => {
  mocks.consumeRate.mockResolvedValue(false);
  const { POST, maxDuration } = await import('@/app/api/compile/route');
  const response = await POST(request(undefined, 'https://catalyst.example'));
  expect(response.status).toBe(429); expect(response.headers.get('retry-after')).toBe('60');
  expect(mocks.consumeRate).toHaveBeenCalledWith('ai-drafts', 5);
  expect(mocks.generate).not.toHaveBeenCalled(); expect(maxDuration).toBe(60);
});
it('returns a safe unavailable response when Vercel origin configuration is missing', async () => {
  vi.stubEnv('APP_ORIGIN', '');
  const { POST } = await import('@/app/api/compile/route');
  expect((await POST(request(undefined, 'https://catalyst.example'))).status).toBe(503);
  expect(mocks.generate).not.toHaveBeenCalled();
});
