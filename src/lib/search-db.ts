export type SongMeta = {
  id: string;
  title: string;
  subtitle: string | null;
  category: string | null;
  tags: string[];
  hasAudio: boolean;
};

export type StoredIndex = {
  version: string;
  indexData: string;
};

const DB_NAME = "resucito-search";
const DB_VERSION = 1;
const STORE_INDEX = "search-index";
const STORE_META = "song-meta";

export function openSearchDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined" || indexedDB == null) {
      resolve(null);
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onerror = () => {
      resolve(null);
    };

    request.onblocked = () => {
      resolve(null);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_INDEX)) {
        db.createObjectStore(STORE_INDEX, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        const metaStore = db.createObjectStore(STORE_META, { keyPath: "id" });
        metaStore.createIndex("category", "category", { unique: false });
        metaStore.createIndex("tags", "tags", { unique: false, multiEntry: true });
      }
    };
  });
}

export function getStoredIndex(db: IDBDatabase): Promise<StoredIndex | null> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_INDEX, "readonly");
      const store = tx.objectStore(STORE_INDEX);
      const request = store.get("main");

      request.onsuccess = () => {
        const result = request.result as ({ id: string } & StoredIndex) | undefined;
        if (!result) {
          resolve(null);
        } else {
          resolve({ version: result.version, indexData: result.indexData });
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}

export function storeIndex(
  db: IDBDatabase,
  version: string,
  indexData: string,
  meta: SongMeta[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction([STORE_INDEX, STORE_META], "readwrite");

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.oncomplete = () => {
        resolve();
      };

      const indexStore = tx.objectStore(STORE_INDEX);
      indexStore.put({ id: "main", version, indexData });

      const metaStore = tx.objectStore(STORE_META);
      metaStore.clear();
      for (const song of meta) {
        metaStore.put(song);
      }
    } catch (err) {
      reject(err);
    }
  });
}

export function getAllMeta(db: IDBDatabase): Promise<SongMeta[]> {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_META, "readonly");
      const store = tx.objectStore(STORE_META);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as SongMeta[]);
      };

      request.onerror = () => {
        reject(request.error);
      };
    } catch (err) {
      reject(err);
    }
  });
}
