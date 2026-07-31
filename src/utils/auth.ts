import { env } from "./env";

export const SESSION_COOKIE = "tagle_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

// Web Crypto rather than node:crypto — the proxy runs on the Edge runtime.
async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

/** Compares hashes so the loop always runs over equal, secret-independent lengths. */
async function constantTimeEqual(a: string, b: string) {
  const [ha, hb] = await Promise.all([digest(a), digest(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

// Keying on both secrets means rotating either COOKIE_SECRET or APP_PASSWORD
// invalidates every outstanding session.
async function signingKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`${env.cookieSecret}:${env.appPassword}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(payload: string) {
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Token is `<expiry epoch ms>.<signature>`; the expiry is covered by the signature. */
export async function createSessionToken(now = Date.now()) {
  const expiresAt = now + SESSION_TTL_MS;
  return `${expiresAt}.${await sign(String(expiresAt))}`;
}

export async function verifySessionToken(token: string | undefined, now = Date.now()) {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expiresAt = Number(payload);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= 0) return false;
  if (!(await constantTimeEqual(signature, await sign(payload)))) return false;
  return expiresAt > now;
}

export async function verifyPassword(password: string) {
  if (!password) return false;
  return constantTimeEqual(password, env.appPassword);
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}
