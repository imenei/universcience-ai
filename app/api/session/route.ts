import { NextResponse } from "next/server";
import { createSessionToken, demoSessionEnabled, demoUserId, getCurrentDemoUserId, getSupabaseUser, SESSION_COOKIE, sessionCookieOptions, sessionSecretConfigured, supabaseCookieNames } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSupabaseUser(request);
  if (user) return NextResponse.json({ authenticated: true, demo: false, user }, { headers: { "Cache-Control": "private, no-store" } });

  const demoUser = getCurrentDemoUserId(request);
  if (demoUser) return NextResponse.json({ authenticated: true, demo: true, user: { id: demoUser } }, { headers: { "Cache-Control": "private, no-store" } });

  return NextResponse.json({ authenticated: false, message: "Connectez-vous ou démarrez explicitement une session de démonstration." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST() {
  if (!demoSessionEnabled()) {
    return NextResponse.json({ error: "Le mode démonstration est désactivé dans cet environnement." }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
  }
  if (!sessionSecretConfigured()) {
    return NextResponse.json({ error: "La clé de session serveur FIKRA_SESSION_SECRET n’est pas configurée." }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
  const demoId = demoUserId();
  const response = NextResponse.json({ authenticated: true, demo: true, user: { id: demoId } }, { headers: { "Cache-Control": "private, no-store" } });
  response.cookies.set(supabaseCookieNames.access, "", sessionCookieOptions(0));
  response.cookies.set(supabaseCookieNames.refresh, "", sessionCookieOptions(0));
  response.cookies.set(SESSION_COOKIE, createSessionToken(demoId), sessionCookieOptions());
  return response;
}
