import { Pool } from "pg";
import { ragConfig } from "@/lib/rag/config";

let pool: Pool | null = null;
export function getPool() {
  if (!ragConfig.databaseUrl) return null;
  if (!pool) pool = new Pool({ connectionString: ragConfig.databaseUrl, max: 4, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
  return pool;
}

export type RetrievedChunk = { id: string; content: string; pageNumber: number; documentId: string; documentTitle: string; similarity: number };

export async function searchAuthorizedChunks(params: { courseId: string; documentIds?: string[]; userId: string; embedding: number[]; topK?: number; threshold?: number }) {
  const db = getPool();
  if (!db) return [];
  const vector = `[${params.embedding.join(",")}]`;
  const values: unknown[] = [params.courseId, params.userId, vector, params.threshold ?? ragConfig.relevanceThreshold, params.topK ?? ragConfig.topK];
  let documentFilter = "";
  if (params.documentIds?.length) {
    values.push(params.documentIds);
    documentFilter = `AND d.id = ANY($${values.length}::uuid[])`;
  }
  const result = await db.query<RetrievedChunk>(
    `SELECT c.id, c.content, c.page_number AS "pageNumber", d.id AS "documentId", d.title AS "documentTitle", 1 - (c.embedding <=> $3::vector) AS similarity
     FROM document_chunks c
     JOIN documents d ON d.id = c.document_id
     LEFT JOIN document_access da ON da.document_id = d.id AND da.user_id = $2
     WHERE d.course_id = $1 AND (d.owner_id = $2 OR da.user_id = $2) ${documentFilter}
       AND 1 - (c.embedding <=> $3::vector) >= $4
     ORDER BY c.embedding <=> $3::vector
     LIMIT $5`, values);
  return result.rows;
}
