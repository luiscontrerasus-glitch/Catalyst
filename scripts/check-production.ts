import { loadEnvConfig } from '@next/env';
import { databaseSettings, publicOrigin } from '../src/rooms/config';
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const checks = {
  node24: process.versions.node.split('.')[0] === '24',
  managedDatabase: false,
  publicHttpsOrigin: false,
  geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
};
try { checks.managedDatabase = Boolean(databaseSettings({ ...process.env, REQUIRE_MANAGED_ROOMS: 'true' }).remote); } catch {}
try { checks.publicHttpsOrigin = Boolean(publicOrigin(process.env.APP_ORIGIN)); } catch {}
console.log(JSON.stringify(checks, null, 2));
if (Object.values(checks).some(value => !value)) process.exitCode = 1;
