"use client";

// Small browser-side fetch helper for the JSON APIs (mirrors lib/api.ts shape).

export type ApiResult<T> = { ok: boolean; data?: T; error?: string };

export async function apiGet<T>(url: string): Promise<ApiResult<T>> {
  const res = await fetch(url, { credentials: "same-origin" });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.ok !== false, data: json.data as T, error: json.error };
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<ApiResult<T>> {
  const res = await fetch(url, {
    method,
    credentials: "same-origin",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.ok !== false, data: json.data as T, error: json.error };
}

export async function apiUpload<T>(url: string, form: FormData): Promise<ApiResult<T>> {
  const res = await fetch(url, { method: "POST", credentials: "same-origin", body: form });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok && json.ok !== false, data: json.data as T, error: json.error };
}
