import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, supabaseCookieNames } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(supabaseCookieNames.access, "", sessionCookieOptions(0));
  response.cookies.set(supabaseCookieNames.refresh, "", sessionCookieOptions(0));
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
