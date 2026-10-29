import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "fikra_session";
const ACCESS_COOKIE = "fikra_supabase_access";
const REFRESH_COOKIE = "fikra_supabase_refresh";
const DEMO_USER_PREFIX = "demo-";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SupabaseUser = { id: string; email?: string };

function secret() {
  const value = process.env.FIKRA_SESSION_SECRET;
  if (!value || value.trim().length < 32) throw new Error("FIKRA_SESSION_SECRET doit contenir au moins 32 caractères.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function supabaseConfig() {
  return { url: (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, ""), anonKey: process.env.SUPABASE_ANON_KEY || "" };
}

function cookieValue(request: Request, name: string) {
  return (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || "";
}

function accessToken(request: Request) {
  return cookieValue(request, ACCESS_COOKIE);
}

export async function getSupabaseUser(request: Request): Promise<SupabaseUser | null> {
  const { url, anonKey } = supabaseConfig();
  let token = "";
  try { token = decodeURIComponent(accessToken(request)); } catch { return null; }
  if (!url || !anonKey || !token) return null;
  try {
    const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) return null;
    const user = await response.json() as SupabaseUser;
    return user?.id ? user : null;
  } catch { return null; }
}

export async function getCurrentUserId(request: Request) {
  const user = await getSupabaseUser(request);
  if (user) return user.id;
  return getCurrentDemoUserId(request);
}

export function createSessionToken(userId: string) {
  if (!isDemoUserId(userId)) throw new Error("Seule l’identité de démonstration peut utiliser cette session.");
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS}`;
  return `${payload}.${sign(payload)}`;
}

export function getCurrentDemoUserId(request: Request) {
  if (!demoSessionEnabled()) return null;
  try {
    const token = decodeURIComponent(cookieValue(request, SESSION_COOKIE));
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [userId, expiration, signature] = parts;
    const expiresAt = Number(expiration);
    if (!isDemoUserId(userId) || !Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000) || !signature) return null;
    const payload = `${userId}.${expiresAt}`;
    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    return actual.length === expected.length && timingSafeEqual(actual, expected) ? userId : null;
  } catch { return null; }
}

function isDemoUserId(userId: string) { return /^demo-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId); }
export function demoUserId() { return `${DEMO_USER_PREFIX}${randomUUID()}`; }
export function demoSessionEnabled() { return process.env.ALLOW_DEMO_SESSION === "true"; }
export function sessionSecretConfigured() { return Boolean(process.env.FIKRA_SESSION_SECRET?.trim() && process.env.FIKRA_SESSION_SECRET.trim().length >= 32); }

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  const secure = process.env.FIKRA_COOKIE_SECURE !== "false";
  return { httpOnly: true, secure, sameSite: secure ? "none" as const : "lax" as const, path: "/", maxAge };
}

export const supabaseCookieNames = { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE };
export function supabaseConfigForServer() { return supabaseConfig(); }
