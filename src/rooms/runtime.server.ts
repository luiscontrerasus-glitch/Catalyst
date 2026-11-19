import "server-only";
import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createRoomStore } from "./store";
let store: ReturnType<typeof createRoomStore> | undefined;
export function roomStore() {
  if (store) return store;
  const remote = process.env.TURSO_DATABASE_URL;
  if (remote && !/^libsql:\/\/|^https:\/\//.test(remote))
    throw new Error("Managed room database must use libsql or HTTPS.");
  if (remote && !process.env.TURSO_AUTH_TOKEN)
    throw new Error("Managed room database credential is missing.");
  if (process.env.REQUIRE_MANAGED_ROOMS === "true" && !remote)
    throw new Error("Managed rooms are required by this deployment.");
  const directory = join(process.cwd(), "data");
  if (!remote) mkdirSync(directory, { recursive: true });
  const db = createClient({
    url: remote ?? pathToFileURL(join(directory, "catalyst.db")).href,
    authToken: remote ? process.env.TURSO_AUTH_TOKEN : undefined,
  });
  store = createRoomStore(db, remote ? "managed" : "local");
  return store;
}
