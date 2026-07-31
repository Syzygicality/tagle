import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionCookie, verifyPassword } from "@/utils/auth";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

// Per-instance throttle — enough to make a deployed password unguessable by
// brute force without pulling in a store.
const attempts = new Map<string, { count: number; resetAt: number }>();

function throttled(client: string, now: number) {
  const entry = attempts.get(client);
  if (!entry || entry.resetAt <= now) {
    attempts.set(client, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const client = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const now = Date.now();

  if (throttled(client, now)) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }

  let password = "";
  try {
    const body = await request.json();
    if (typeof body?.password === "string") password = body.password;
  } catch {
    // fall through to the generic failure below
  }

  if (!(await verifyPassword(password))) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  attempts.delete(client);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie(await createSessionToken(now)));
  return response;
}
