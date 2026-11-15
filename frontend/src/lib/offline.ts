const QUEUE_KEY = "rootwise_offline_queue_v1";
const TOKEN_KEY = "rootwise_token";

export type QueuedRequest = {
  id: string;
  path: string;
  method: string;
  body: string | null;
  createdAt: string;
  label: string;
};

function emit() {
  window.dispatchEvent(new CustomEvent("rootwise:queue", { detail: readQueue().length }));
}

export function readQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function save(items: QueuedRequest[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  emit();
}

export function enqueue(path: string, method: string, body: string | null): QueuedRequest {
  const item: QueuedRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    path,
    method,
    body,
    createdAt: new Date().toISOString(),
    label: `${method} ${path}`,
  };
  save([...readQueue(), item]);
  return item;
}

export function pendingCount(): number {
  return readQueue().length;
}

export function clearQueue() {
  save([]);
}

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;
  let remaining = readQueue();

  for (const item of remaining) {
    if (!navigator.onLine) break;
    const token = localStorage.getItem(TOKEN_KEY);
    try {
      const response = await fetch(`/api${item.path}`, {
        method: item.method,
        headers: {
          ...(item.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: item.body ?? undefined,
      });
      if (response.ok) {
        synced += 1;
        remaining = remaining.filter((queued) => queued.id !== item.id);
        save(remaining);
      } else if (response.status >= 400 && response.status < 500) {
        failed += 1;
        remaining = remaining.filter((queued) => queued.id !== item.id);
        save(remaining);
      }
    } catch {
      break;
    }
  }

  window.dispatchEvent(new CustomEvent("rootwise:synced", { detail: { synced, failed } }));
  emit();
  return { synced, failed };
}
