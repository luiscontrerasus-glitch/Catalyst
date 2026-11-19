import "server-only";
import { createClient as createWebClient } from "@libsql/client/web";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRoomStore } from "./store";
import { databaseSettings } from './config';
let store: Promise<ReturnType<typeof createRoomStore>> | undefined;
export function roomStore() {
  if (store) return store;
  const { remote, authToken } = databaseSettings();
  store = (async () => {
    if (remote) return createRoomStore(createWebClient({ url: remote, authToken }), 'managed');
    // Native SQLite is loaded only for the persistent local-server fallback.
    const { createClient } = await import('@libsql/client');
    const directory = join(process.cwd(), 'data');
    mkdirSync(directory, { recursive: true });
    return createRoomStore(createClient({ url: pathToFileURL(join(directory, 'catalyst.db')).href }), 'local');
  })().catch(error => { store = undefined; throw error; });
  return store;
}
