export class ApiError extends Error {}

async function requestJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) {
    throw new ApiError(data.error || "Permintaan gagal.");
  }
  return data;
}

export function postJson<T = { ok: true }>(url: string, body: unknown): Promise<T> {
  return requestJson<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function patchJson<T = { ok: true }>(url: string, body: unknown): Promise<T> {
  return requestJson<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}
