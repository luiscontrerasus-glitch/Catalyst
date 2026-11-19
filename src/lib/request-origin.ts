import { publicOrigin } from '@/rooms/config';
export function applicationOrigin(request: Request) {
  if (process.env.VERCEL === '1') return publicOrigin(process.env.APP_ORIGIN);
  if (process.env.APP_ORIGIN) return new URL(process.env.APP_ORIGIN).origin;
  // Next's internal URL may use localhost when the browser used 127.0.0.1.
  // Host is the actual target. Forwarded headers do not authorize mutations.
  const target = new URL(request.url);
  return `${target.protocol}//${request.headers.get("host") ?? target.host}`;
}
