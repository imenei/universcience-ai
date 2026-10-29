import { NextResponse } from "next/server";
import { sessionCookieOptions, supabaseConfigForServer, supabaseCookieNames } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { url, anonKey } = supabaseConfigForServer();
  if (!url || !anonKey) return NextResponse.json({ error: "Supabase Auth n’est pas configuré côté serveur." }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "L’adresse email et le mot de passe sont requis." }, { status: 400 });

  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) return NextResponse.json({ error: "Identifiants invalides ou compte non confirmé." }, { status: 401 });

  const result = NextResponse.json({ authenticated: true, user: { id: payload.user?.id, email: payload.user?.email } });
  result.cookies.set(supabaseCookieNames.access, payload.access_token, sessionCookieOptions(Number(payload.expires_in || 3600)));
  if (payload.refresh_token) result.cookies.set(supabaseCookieNames.refresh, payload.refresh_token, sessionCookieOptions(60 * 60 * 24 * 30));
  return result;
}
