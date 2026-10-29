import { randomUUID } from "node:crypto";
import { chunkPages, extractPdfPages } from "@/lib/rag/document-ingestion";
import { createEmbedding, generateGroundedAnswer } from "@/lib/rag/ai-provider";
import { getPool, searchAuthorizedChunks, type RetrievedChunk } from "@/lib/rag/retrieval-service";
import { ragConfig } from "@/lib/rag/config";

export async function ingestAuthorizedPdf(params: { buffer: Buffer; filename: string; courseId: string; ownerId: string }) {
  const parsed = await extractPdfPages(params.buffer);
  const chunks = chunkPages(parsed.pages);
  const db = getPool();
  if (!db) return { documentId: randomUUID(), status: "extracted-awaiting-database", pageCount: parsed.pages.length, chunkCount: chunks.length };
  const client = await db.connect();
  const documentId = randomUUID();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO documents (id, title, course_id, owner_id, page_count, metadata, status) VALUES ($1,$2,$3,$4,$5,$6,'processing')`, [documentId, params.filename, params.courseId, params.ownerId, parsed.pages.length, parsed.metadata]);
    const job = await client.query<{ id: string }>(`INSERT INTO ingestion_jobs (document_id, status) VALUES ($1,'processing') RETURNING id`, [documentId]);
    for (const chunk of chunks) {
      const embedding = await createEmbedding(chunk.content);
      await client.query(`INSERT INTO document_chunks (document_id, chunk_index, page_number, content, embedding) VALUES ($1,$2,$3,$4,$5::vector)`, [documentId, chunk.chunkIndex, chunk.pageNumber, chunk.content, `[${embedding.join(",")}]`]);
    }
    await client.query(`UPDATE documents SET status='indexed', updated_at=now() WHERE id=$1`, [documentId]);
    await client.query(`UPDATE ingestion_jobs SET status='completed', completed_at=now(), chunk_count=$2 WHERE id=$1`, [job.rows[0].id, chunks.length]);
    await client.query("COMMIT");
    return { documentId, status: "indexed", pageCount: parsed.pages.length, chunkCount: chunks.length };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    await client.query(`UPDATE ingestion_jobs SET status='failed', error_message=$2 WHERE document_id=$1`, [documentId, error instanceof Error ? error.message : "Erreur inconnue"]).catch(() => undefined);
    throw error;
  } finally { client.release(); }
}

function buildContext(chunks: RetrievedChunk[]) {
  return chunks.map((chunk, index) => `[SOURCE ${index + 1}] ${chunk.documentTitle} · page ${chunk.pageNumber}\n${chunk.content}`).join("\n\n");
}

function validateCitations(answer: string, chunks: RetrievedChunk[]) {
  return chunks.filter((chunk, index, list) => list.findIndex((item) => item.documentId === chunk.documentId && item.pageNumber === chunk.pageNumber) === index).map((chunk) => ({ documentId: chunk.documentId, documentTitle: chunk.documentTitle, pageNumber: chunk.pageNumber, similarity: chunk.similarity }));
}

export async function answerWithRag(params: { question: string; courseId: string; documentIds?: string[]; userId: string; history?: Array<{ role: "user" | "assistant"; content: string }> }) {
  const embedding = await createEmbedding(params.question);
  const chunks = await searchAuthorizedChunks({ courseId: params.courseId, documentIds: params.documentIds, userId: params.userId, embedding, topK: ragConfig.topK, threshold: ragConfig.relevanceThreshold });
  if (!chunks.length) return { answer: "Le document de cours autorisé ne contient pas suffisamment d’information pour répondre à cette question.", citations: [], grounded: false, reason: "insufficient_context" };
  const answer = await generateGroundedAnswer(params.question, buildContext(chunks), params.history || []);
  return { answer, citations: validateCitations(answer, chunks), grounded: true, retrievedCount: chunks.length };
}
