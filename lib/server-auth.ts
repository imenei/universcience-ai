export const SESSION_COOKIE = "fikra_session";
const ACCESS_COOKIE = "fikra_supabase_access";
const REFRESH_COOKIE = "fikra_supabase_refresh";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const PRODUCTION_APP_ORIGIN = "https://universci-skjh9jhy.manus.space";

type SupabaseUser = { id: string; email?: string };

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
  return user?.id ?? null;
}

export function sessionCookieOptions(maxAge = SESSION_TTL_SECONDS) {
  const secure = process.env.FIKRA_COOKIE_SECURE !== "false";
  return { httpOnly: true, secure, sameSite: secure ? "none" as const : "lax" as const, path: "/", maxAge };
}

export const supabaseCookieNames = { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE };
export function supabaseConfigForServer() { return supabaseConfig(); }

function safeHttpsOrigin(value: string | undefined) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password || url.hostname === "localhost" || url.hostname === "127.0.0.1") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function publicAppOrigin(request: Request) {
  const configured = safeHttpsOrigin(process.env.PUBLIC_APP_URL);
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return PRODUCTION_APP_ORIGIN;

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedOrigin = host && forwardedProto ? safeHttpsOrigin(`${forwardedProto}://${host}`) : null;
  if (forwardedOrigin) return forwardedOrigin;
  return new URL(request.url).origin;
}
