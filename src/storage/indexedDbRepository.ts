import type { AtlasDailyState } from "../domain/types";
import type { AtlasDailyRepository } from "./repository";

const DB_NAME = "atlas-daily";
const DB_VERSION = 1;
const STORE_NAME = "atlas_state";
const STATE_KEY = "primary";

interface StoredValue {
  value: AtlasDailyState;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Ruang lokal Atlas gagal dibuka."));
  });
}

export class IndexedDbAtlasDailyRepository implements AtlasDailyRepository {
  async load(): Promise<AtlasDailyState | null> {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(STATE_KEY);
      request.onsuccess = () => {
        const stored = request.result as StoredValue | undefined;
        resolve(stored?.value ?? null);
      };
      request.onerror = () => reject(request.error ?? new Error("Data Atlas gagal dibaca."));
    });
  }

  async save(state: AtlasDailyState): Promise<void> {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ value: state } satisfies StoredValue, STATE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Data Atlas gagal disimpan."));
    });
  }

  async clear(): Promise<void> {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(STATE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Data Atlas gagal dihapus."));
    });
  }
}
