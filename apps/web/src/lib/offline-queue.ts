const DB_NAME = 'tralok-offline';
const STORE_NAME = 'pending-ops';
const DB_VERSION = 1;

interface PendingOperation {
  id: string;
  url: string;
  method: string;
  body: any;
  createdAt: number;
  retries: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueue(op: Omit<PendingOperation, 'id' | 'createdAt' | 'retries'>): Promise<string> {
  const db = await openDB();
  const id = `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const entry: PendingOperation = {
    ...op,
    id,
    createdAt: Date.now(),
    retries: 0,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(entry);
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function dequeue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAll(): Promise<PendingOperation[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function flush(token: string): Promise<{ ok: number; failed: number }> {
  const ops = await getAll();
  let ok = 0;
  let failed = 0;

  for (const op of ops) {
    try {
      const res = await fetch(op.url, {
        method: op.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: op.body ? JSON.stringify(op.body) : undefined,
      });

      if (res.ok) {
        await dequeue(op.id);
        ok++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { ok, failed };
}

// Auto-flush cuando vuelve la conexion
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const result = await flush(token);
      if (result.ok > 0) {
        console.log(`[Offline Queue] Sincronizadas ${result.ok} operaciones`);
      }
    }
  });
}
