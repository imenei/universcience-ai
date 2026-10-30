import { NextResponse } from "next/server";
import { sessionCookieOptions, supabaseConfigForServer, supabaseCookieNames } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { url, anonKey } = supabaseConfigForServer();
  if (!url || !anonKey) return NextResponse.json({ error: "Supabase Auth n’est pas configuré côté serveur." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "L’adresse email et le mot de passe sont requis." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });

  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload?.msg === "string" ? payload.msg : typeof payload?.message === "string" ? payload.message : "Création du compte impossible.";
    return NextResponse.json({ error: message }, { status: response.status === 422 ? 400 : 502 });
  }

  const result = NextResponse.json({
    authenticated: Boolean(payload.access_token),
    requiresEmailConfirmation: !payload.access_token,
    user: payload.user?.id ? { id: payload.user.id, email: payload.user.email } : undefined,
  });
  if (payload.access_token) {
    result.cookies.set(supabaseCookieNames.access, payload.access_token, sessionCookieOptions(Number(payload.expires_in || 3600)));
    if (payload.refresh_token) result.cookies.set(supabaseCookieNames.refresh, payload.refresh_token, sessionCookieOptions(60 * 60 * 24 * 30));
  }
  return result;
}
