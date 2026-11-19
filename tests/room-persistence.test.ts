import { describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { mkdtempSync, readdirSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createRoomStore } from "@/rooms/store";
import { freshRobotics } from "@/data/robotics";
describe("room storage lifecycle", () => {
  it("retains rooms, session authorization and activity after closing and reopening the database", async () => {
    const directory = mkdtempSync(join(tmpdir(), "catalyst-room-test-"));
    const url = pathToFileURL(join(directory, "room.db")).href;
    let client = createClient({ url });
    try {
      let store = createRoomStore(client);
      const owner = await store.create({
        name: "Fictional owner",
        project: freshRobotics(),
      });
      const guest = await store.join(owner.room.id, {
        name: "Fictional guest",
        invite: owner.invite,
      });
      client.close();
      client = createClient({ url });
      store = createRoomStore(client);
      const restoredOwner = await store.read(owner.room.id, owner.token);
      const restoredGuest = await store.read(owner.room.id, guest.token);
      expect(restoredOwner!.revision).toBe(2);
      expect(restoredGuest!.project).toEqual(restoredOwner!.project);
      expect(restoredOwner!.self.role).toBe("owner");
      expect(restoredGuest!.self.role).toBe("contributor");
      expect(restoredOwner!.activity).toHaveLength(2);
    } finally {
      client.close();
      // Only files generated inside this exact fresh temporary directory.
      let nativeHandlePending = false;
      for (const name of readdirSync(directory)) {
        const target = resolve(directory, name);
        if (
          !target.startsWith(resolve(directory) + "\\") &&
          !target.startsWith(resolve(directory) + "/")
        )
          throw new Error("Unsafe test cleanup path");
        try {
          unlinkSync(target);
        } catch (error) {
          // libSQL may retain Windows native file handles until process exit.
          // Leave only this generated OS-temp artifact; never suppress assertions.
          if (
            process.platform !== "win32" ||
            !["EBUSY", "EPERM"].includes(
              (error as NodeJS.ErrnoException).code ?? "",
            )
          )
            throw error;
          nativeHandlePending = true;
        }
      }
      if (!nativeHandlePending) rmdirSync(directory);
    }
  });
  it("rejects expired invitations and sessions while preserving unexpired sessions", async () => {
    const db = createClient({ url: ":memory:" });
    try {
      const store = createRoomStore(db);
      const owner = await store.create({
        name: "Owner",
        project: freshRobotics(),
      });
      await db.execute({
        sql: "UPDATE rooms SET invite_expires=0 WHERE id=?",
        args: [owner.room.id],
      });
      await expect(
        store.join(owner.room.id, { name: "Guest", invite: owner.invite }),
      ).rejects.toMatchObject({ status: 403 });
      expect((await store.read(owner.room.id, owner.token))!.self.role).toBe(
        "owner",
      );
      await db.execute({
        sql: "UPDATE room_sessions SET expires=0 WHERE room_id=?",
        args: [owner.room.id],
      });
      await expect(
        store.read(owner.room.id, owner.token),
      ).rejects.toMatchObject({ status: 401 });
    } finally {
      db.close();
    }
  });
});
