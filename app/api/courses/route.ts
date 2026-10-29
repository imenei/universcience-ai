import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { getPool } from "@/lib/rag/retrieval-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request);
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour charger vos cours." }, { status: 401 });
  const db = getPool();
  if (!db) return NextResponse.json({ error: "La base documentaire n’est pas configurée." }, { status: 503 });
  try {
    const result = await db.query(`
      SELECT d.course_id AS "courseId",
             COUNT(DISTINCT d.id)::int AS "documentCount",
             COUNT(DISTINCT CASE WHEN d.status = 'indexed' THEN d.id END)::int AS "indexedDocumentCount",
             MAX(d.created_at) AS "lastUpdated",
             MIN(d.title) AS "firstDocumentTitle"
      FROM documents d
      LEFT JOIN document_access da ON da.document_id = d.id AND da.user_id = $1
      WHERE (d.owner_id = $1 OR da.user_id = $1)
      GROUP BY d.course_id
      HAVING COUNT(DISTINCT CASE WHEN d.status = 'indexed' THEN d.id END) > 0
      ORDER BY MAX(d.created_at) DESC
    `, [userId]);
    return NextResponse.json({ courses: result.rows });
  } catch (error) {
    console.error("Course listing failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "La liste des cours n’est pas disponible." }, { status: 500 });
  }
}
