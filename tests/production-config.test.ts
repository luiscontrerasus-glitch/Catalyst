import { afterEach, expect, it, vi } from 'vitest';
import { databaseSettings, publicOrigin } from '@/rooms/config';
vi.mock('server-only', () => ({}));
afterEach(() => vi.unstubAllEnvs());

it('requires managed storage on Vercel even when the optional flag was omitted or false', () => {
  for (const flag of [undefined, 'false'])
    expect(() => databaseSettings({ VERCEL: '1', REQUIRE_MANAGED_ROOMS: flag })).toThrow('Managed rooms are required');
});
it('requires an explicit HTTPS browser origin on Vercel', () => {
  const env = { VERCEL: '1', TURSO_DATABASE_URL: 'libsql://fictional.turso.io', TURSO_AUTH_TOKEN: 'synthetic' };
  for (const APP_ORIGIN of ['', 'http://example.com', 'https://example.com/path', 'https://user:pass@example.com', 'https://example.com?x=1'])
    expect(() => databaseSettings({ ...env, APP_ORIGIN })).toThrow();
  expect(databaseSettings({ ...env, APP_ORIGIN: 'https://catalyst.example' }).remote).toBe(env.TURSO_DATABASE_URL);
  expect(publicOrigin('https://catalyst.example/')).toBe('https://catalyst.example');
});
it('rejects transport downgrades, local files and URL-embedded credentials', () => {
  for (const TURSO_DATABASE_URL of ['libsql://fictional.turso.io?tls=0', 'file:/tmp/data.db', 'http://fictional.invalid', 'https://secret@fictional.invalid'])
    expect(() => databaseSettings({ TURSO_DATABASE_URL, TURSO_AUTH_TOKEN: 'synthetic' })).toThrow();
});
it('fails actual runtime health closed on Vercel without creating local storage', async () => {
  vi.resetModules();
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv('REQUIRE_MANAGED_ROOMS', 'false');
  vi.stubEnv('TURSO_DATABASE_URL', '');
  const { GET } = await import('@/app/api/health/route');
  const response = await GET();
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: 'rooms-unavailable' });
});
