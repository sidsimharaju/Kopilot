import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookie, verifySession } from "./session";
import type { SessionUser } from "./types";

export async function getUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySession(store.get(sessionCookie.name)?.value);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/auth/google");
  return user;
}
