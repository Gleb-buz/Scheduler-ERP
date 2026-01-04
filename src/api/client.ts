import { mockCall } from "@/api/mocks/handlers";

// Use local serverless proxy by default to avoid CORS issues. Set NEXT_PUBLIC_BACKEND_BASE_URL to override.
const DEFAULT_BASE_URL = "/api/backend";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BASE_URL ?? DEFAULT_BASE_URL;
const TIMEOUT = Number(process.env.NEXT_PUBLIC_BACKEND_TIMEOUT_MS ?? 15000);

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const resp = await fetch(input, { ...init, signal: controller.signal });
  clearTimeout(id);
  return resp;
}

export async function callApi<T>(
  op: string,
  payload?: Record<string, unknown>
): Promise<T> {
  const useMock = !BASE_URL;
  if (useMock) {
    return mockCall(op, payload) as Promise<T>;
  }

  const url = new URL(BASE_URL!);
  url.searchParams.set("op", op);

  try {
    const resp = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload ? JSON.stringify(payload) : undefined,
      },
      TIMEOUT
    );
    if (!resp.ok) throw new Error(`Request failed: ${resp.status}`);
    const data = await resp.json();
    return data as T;
  } catch {
    return mockCall(op, payload) as Promise<T>;
  }
}
