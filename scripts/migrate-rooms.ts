import { loadEnvConfig } from '@next/env';
import { createClient } from '@libsql/client/web';
import { databaseSettings } from '../src/rooms/config';
import { migrateRooms, migrations } from '../src/rooms/migrations';
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
async function main() {
  const { remote, authToken } = databaseSettings({ ...process.env, REQUIRE_MANAGED_ROOMS: 'true' });
  const db = createClient({ url: remote!, authToken });
  try {
    await migrateRooms(db);
    console.log(JSON.stringify({ schemaReady: true, version: migrations.at(-1)!.version }));
  } finally { db.close(); }
}
main().catch(() => {
  console.error('Schema preparation failed. Check the managed URL, credential, network and database access. No credentials or provider errors are printed.');
  process.exitCode = 1;
});
