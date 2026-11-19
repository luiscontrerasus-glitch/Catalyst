import { beforeEach, afterEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const limiter = vi.hoisted(() => vi.fn());
vi.mock('@/rooms/runtime.server', () => ({ roomStore: async () => ({ consumeRate: limiter }) }));
import { roomBody, roomFailure } from '@/rooms/http.server';
beforeEach(() => {
  vi.stubEnv('VERCEL', '1'); vi.stubEnv('APP_ORIGIN', 'https://catalyst.example'); limiter.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
const request = () => new Request('https://catalyst.example/api/rooms', { method: 'POST', body: '{}', headers: { origin: 'https://catalyst.example', 'content-type': 'application/json' } });
it('enforces the deployment-wide room write quota with Retry-After', async () => {
  limiter.mockResolvedValue(false);
  let error: unknown;
  try { await roomBody(request()); } catch (e) { error = e; }
  const response = roomFailure(error);
  expect(response.status).toBe(429); expect(response.headers.get('retry-after')).toBe('60');
  expect(limiter).toHaveBeenCalledWith('room-writes', 120);
});
it('fails room writes closed when quota storage fails without leaking credentials', async () => {
  limiter.mockRejectedValue(new Error('synthetic-database-credential'));
  let error: unknown;
  try { await roomBody(request()); } catch (e) { error = e; }
  const response = roomFailure(error);
  expect(response.status).toBe(503); expect(await response.text()).not.toContain('synthetic-database-credential');
});
