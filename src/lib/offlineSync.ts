import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DisasterSyncDB extends DBSchema {
  syncQueue: {
    key: number;
    value: {
      id?: number;
      table: string;
      payload: any;
      action: 'insert' | 'update';
      timestamp: number;
    };
    indexes: { 'by-table': string };
  };
}

let dbPromise: Promise<IDBPDatabase<DisasterSyncDB>> | null = null;

if (typeof window !== 'undefined') {
  dbPromise = openDB<DisasterSyncDB>('DisasterHubSyncDB', 1, {
    upgrade(db) {
      const store = db.createObjectStore('syncQueue', {
        keyPath: 'id',
        autoIncrement: true,
      });
      store.createIndex('by-table', 'table');
    },
  });
}

export async function queueOfflineAction(table: string, action: 'insert' | 'update', payload: any) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.add('syncQueue', {
    table,
    action,
    payload,
    timestamp: Date.now()
  });
  console.log(`Queued ${action} for ${table} to IndexedDB`);
}

export async function getQueuedActions() {
  if (!dbPromise) return [];
  const db = await dbPromise;
  return await db.getAll('syncQueue');
}

export async function removeQueuedAction(id: number) {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.delete('syncQueue', id);
}

export async function clearQueuedActions() {
  if (!dbPromise) return;
  const db = await dbPromise;
  await db.clear('syncQueue');
}
