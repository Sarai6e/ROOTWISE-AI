import { enqueue } from "./offline";

const TOKEN_KEY = "rootwise_token";

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getTokenValue(): string | null {
  return getToken();
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(extra: HeadersInit = {}): Headers {
  const headers = new Headers(extra);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = authHeaders(options.headers);
  const isForm = options.body instanceof FormData;
  const method = (options.method || "GET").toUpperCase();
  if (!isForm && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    if (method !== "GET" && !isForm) {
      enqueue(path, method, typeof options.body === "string" ? options.body : null);
      throw new ApiError(
        "Sin conexión: el cambio quedó guardado en tu dispositivo y se sincronizará al volver Internet.",
        0,
        "offline_queued",
      );
    }
    throw new ApiError(
      "No hay conexión y estos datos no están guardados en el dispositivo.",
      0,
      "offline",
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (response.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("rootwise:unauthorized"));
  }

  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.blob();

  if (!response.ok) {
    const message =
      (payload as any)?.error || `Error ${response.status} al contactar el servidor.`;
    throw new ApiError(message, response.status, (payload as any)?.code);
  }
  return payload as T;
}

async function fetchBlob(path: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, { headers: authHeaders() });
  } catch {
    throw new ApiError("Sin conexión: imagen no disponible en caché.", 0, "offline");
  }
  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, response.status);
  }
  return response.blob();
}

export async function fetchBlobUrl(path: string): Promise<string> {
  const blob = await fetchBlob(path);
  return URL.createObjectURL(blob);
}

export async function downloadFile(path: string, filename: string) {
  const blob = await fetchBlob(path);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function apiClient() {
  return { getToken, setToken };
}
