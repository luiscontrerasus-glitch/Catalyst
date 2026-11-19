import { expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { unlinkSync } from 'node:fs';
import { createRoomStore } from '@/rooms/store';
import { migrateRooms } from '@/rooms/migrations';

it('migrates idempotently and enforces one atomic quota across clients, stores and reopen', async () => {
  const file = join(tmpdir(), `catalyst-limits-${randomUUID()}.db`);
  const url = pathToFileURL(file).href;
  let a = createClient({ url });
  const b = createClient({ url });
  try {
    await migrateRooms(a);
    await migrateRooms(b);
    expect((await a.execute('SELECT version FROM catalyst_migrations ORDER BY version')).rows.map(r => r.version)).toEqual([1, 2]);
    const one = createRoomStore(a), two = createRoomStore(b);
    await one.ready(); await two.ready();
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) =>
      (i % 2 ? one : two).consumeRate('ai-drafts', 5, 120000)));
    expect(results.filter(Boolean)).toHaveLength(5);
    a.close(); a = createClient({ url });
    expect(await createRoomStore(a).consumeRate('ai-drafts', 5, 120001)).toBe(false);
    expect(await two.consumeRate('ai-drafts', 5, 180000)).toBe(true);
    expect(await createRoomStore(a).consumeRate('room-writes', 120, 180000)).toBe(true);
  } finally {
    a.close(); b.close();
    for (const suffix of ['', '-wal', '-shm']) {
      try { unlinkSync(file + suffix); } catch (e) {
        if (!['ENOENT', 'EBUSY', 'EPERM'].includes((e as NodeJS.ErrnoException).code ?? '')) throw e;
        // Windows native handles may retain this uniquely named OS-temp test file until exit.
      }
    }
  }
});
