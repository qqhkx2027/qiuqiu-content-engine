import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "qiuqiu_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function sessionSignature(payload: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `qiuqiu:${expiresAt}`;
  return `${payload}.${sessionSignature(payload)}`;
}

export function verifyCredentials(username: string, password: string) {
  return Boolean(process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD) &&
    username === process.env.AUTH_USERNAME &&
    password === process.env.AUTH_PASSWORD;
}

export function isValidSession(value?: string) {
  if (!value) return false;
  const [signedPayload, signature] = value.split(".");
  const [prefix, expiresText] = signedPayload?.split(":") ?? [];
  if (prefix !== "qiuqiu" || !expiresText || !signature) return false;
  const expiresAt = Number(expiresText);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return false;

  const payload = `qiuqiu:${expiresAt}`;
  const expected = sessionSignature(payload);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export async function hasValidSession() {
  const store = await cookies();
  return isValidSession(store.get(SESSION_COOKIE)?.value);
}

export const sessionCookie = SESSION_COOKIE;
export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
