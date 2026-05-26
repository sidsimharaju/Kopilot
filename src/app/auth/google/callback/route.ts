import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ALLOWED_EMAILS, signSession, sessionCookie } from "@/lib/session";

type TokenResponse = { access_token?: string; error?: string; error_description?: string };
type UserInfoResponse = { email?: string; name?: string };

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return new NextResponse("Missing auth code.", { status: 400 });

  const base = process.env.BASE_URL || request.nextUrl.origin;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${base}/auth/google/callback`,
      grant_type: "authorization_code",
    }).toString(),
  });
  const tokens = (await tokenRes.json()) as TokenResponse;
  if (!tokenRes.ok || !tokens.access_token) {
    console.error("OAuth token exchange failed:", tokens);
    return new NextResponse("Authentication failed. Please try again.", { status: 500 });
  }

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const user = (await userRes.json()) as UserInfoResponse;
  if (!user.email) return new NextResponse("No email from Google.", { status: 500 });

  if (!ALLOWED_EMAILS.has(user.email)) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px">
        <h2>Access Denied</h2>
        <p><strong>${user.email}</strong> is not authorized to access Kopilot.</p>
        <p><a href="/auth/google">Try a different account</a></p>
      </body></html>`,
      { status: 403, headers: { "Content-Type": "text/html" } },
    );
  }

  const jwt = await signSession({ email: user.email, name: user.name ?? user.email });
  const res = NextResponse.redirect(new URL("/", request.url));
  res.cookies.set(sessionCookie.name, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    maxAge: sessionCookie.maxAge,
    path: "/",
  });
  return res;
}
