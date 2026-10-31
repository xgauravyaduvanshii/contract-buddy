import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    { ok: true, data },
    { status: 200, ...init },
  );
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

/** Wrap an async route handler so thrown AuthErrors map to responses. */
export function handler(fn: () => Promise<Response>) {
  return async () => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof AuthError) return fail(e.message, e.status);
      console.error("API error:", e);
      return fail("Internal server error", 500);
    }
  };
}
