/** Server configuration only; never import this module into a client component. */
export function databaseSettings(env: Record<string, string | undefined> = process.env) {
  const remote = env.TURSO_DATABASE_URL;
  if (remote) {
    const url = new URL(remote);
    if (!['libsql:', 'https:'].includes(url.protocol) || !url.hostname || url.search || url.username || url.password || url.hash)
      throw new Error('Managed room database must use libsql or HTTPS without URL credentials or transport overrides.');
    if (!env.TURSO_AUTH_TOKEN) throw new Error('Managed room database credential is missing.');
  }
  if ((env.REQUIRE_MANAGED_ROOMS === 'true' || env.VERCEL === '1') && !remote)
    throw new Error('Managed rooms are required by this deployment.');
  if (env.VERCEL === '1') publicOrigin(env.APP_ORIGIN);
  return { remote, authToken: remote ? env.TURSO_AUTH_TOKEN : undefined };
}

export function publicOrigin(value?: string) {
  if (!value) throw new Error('APP_ORIGIN must be the public HTTPS origin.');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password)
    throw new Error('APP_ORIGIN must be the public HTTPS origin without a path or credentials.');
  return url.origin;
}
