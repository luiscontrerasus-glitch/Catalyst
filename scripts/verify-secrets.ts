import { loadEnvConfig } from '@next/env';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const secrets = [process.env.GEMINI_API_KEY, process.env.GOOGLE_API_KEY, process.env.TURSO_AUTH_TOKEN].filter((s): s is string => Boolean(s && s.length >= 8));
function containsSecret(text: string) {
  return secrets.some(s => text.includes(s)) || /\bAIza[0-9A-Za-z_-]{35}\b/.test(text);
}
const tracked = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const presentTracked = tracked.filter(file => existsSync(file));
const pending = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const browserFiles: string[] = [];
function walk(directory: string) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path); else browserFiles.push(path);
  }
}
walk('.next/static');
const history = execFileSync('git', ['log', '--all', '-p', '--format=', '--no-ext-diff'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const result = {
  date: new Date().toISOString(),
  configuredSecretCount: secrets.length,
  trackedFilesScanned: presentTracked.length,
  deletedTrackedFilesSkipped: tracked.length - presentTracked.length,
  pendingFilesScanned: pending.length,
  browserFilesScanned: browserFiles.length,
  configuredSecretOrGoogleKeyMatches: [...presentTracked, ...pending, ...browserFiles].filter(file => containsSecret(readFileSync(file, 'utf8'))).length,
  historyMatched: containsSecret(history),
  forbiddenTrackedPaths: tracked.filter(p => /^(\.env(?!\.example$)|data\/|\.room-secrets\/|\.runtime\/)/.test(p)).length,
};
console.log(JSON.stringify(result, null, 2));
writeFileSync('docs/evaluations/security-release.json', JSON.stringify(result, null, 2) + '\n');
if (result.configuredSecretOrGoogleKeyMatches || result.historyMatched || result.forbiddenTrackedPaths) process.exitCode = 1;
