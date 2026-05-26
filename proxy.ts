import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionCookie, verifySession } from "@/lib/session";

const PUBLIC_PREFIXES = ["/auth/", "/share/", "/api/projects/share/", "/_next/"];

function isPublic(pathname: string): boolean {
  if (pathname === "/favicon.ico" || pathname === "/robots.txt") return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get(sessionCookie.name)?.value;
  const user = await verifySession(token);
  if (user) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/auth/google", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
