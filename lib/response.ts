import { NextResponse } from "next/server";

export function apiSuccess<T>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>
) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status });
}

export function apiError(
  error: string,
  message: string,
  status: number,
  details?: unknown
) {
  return NextResponse.json(
    { error, message, ...(details ? { details } : {}) },
    { status }
  );
}
