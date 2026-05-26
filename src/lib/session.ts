import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "./types";

const SESSION_COOKIE = "kp_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function secret(): Uint8Array {
  const raw = process.env.SESSION_SECRET || "dev-secret-change-me";
  return new TextEncoder().encode(raw);
}

export async function signSession(user: SessionUser): Promise<string> {
  return await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.email !== "string" || typeof payload.name !== "string") return null;
    return { email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  maxAge: MAX_AGE_SECONDS,
};

export const ALLOWED_EMAILS = new Set<string>([
  "shikha.sharma@konghq.com",
  "sid.simharaju@konghq.com",
  "ally.christensen@konghq.com",
]);
