import { NextResponse } from "next/server";
import { getSupabaseUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSupabaseUser(request);
  if (user) return NextResponse.json({ authenticated: true, demo: false, user }, { headers: { "Cache-Control": "private, no-store" } });

  return NextResponse.json({ authenticated: false, message: "Connectez-vous avec votre compte étudiant." }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
}
