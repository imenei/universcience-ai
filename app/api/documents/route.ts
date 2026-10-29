import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { getPool } from "@/lib/rag/retrieval-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request);
  if (!userId) return NextResponse.json({ error: "Une identité serveur autorisée est requise." }, { status: 401 });
  const db = getPool();
  if (!db) return NextResponse.json({ error: "La base documentaire n’est pas configurée." }, { status: 503 });
  const courseId = new URL(request.url).searchParams.get("courseId") || "pharmaco";
  try {
    const result = await db.query(`
      SELECT d.id, d.title, d.course_id AS "courseId", d.page_count AS "pageCount", d.status, d.created_at AS "createdAt"
      FROM documents d
      LEFT JOIN document_access da ON da.document_id = d.id AND da.user_id = $2
      WHERE d.course_id = $1 AND (d.owner_id = $2 OR da.user_id = $2)
      ORDER BY d.created_at DESC
    `, [courseId, userId]);
    return NextResponse.json({ documents: result.rows });
  } catch (error) {
    console.error("Document listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "La liste des documents n’est pas disponible." }, { status: 500 });
  }
}
