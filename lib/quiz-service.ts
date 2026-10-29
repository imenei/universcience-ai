import { randomUUID } from "node:crypto";
import { createEmbedding, generateQuizQuestions, type GeneratedQuizQuestion } from "@/lib/rag/ai-provider";
import { getPool, searchAuthorizedChunks, type RetrievedChunk } from "@/lib/rag/retrieval-service";
import { ragConfig } from "@/lib/rag/config";

export type QuizRequest = {
  userId: string;
  courseId: string;
  documentIds?: string[];
  topic?: string;
  count: number;
  difficulty: "easy" | "medium" | "hard";
  language: "fr" | "ar" | "en";
};

function buildQuizContext(chunks: RetrievedChunk[]) {
  return chunks.map((chunk, index) => `[SOURCE ${index + 1}] ${chunk.documentTitle} · page ${chunk.pageNumber}\n${chunk.content}`).join("\n\n");
}

function uniqueCitations(chunks: RetrievedChunk[]) {
  return chunks.filter((chunk, index, list) => list.findIndex((item) => item.documentId === chunk.documentId && item.pageNumber === chunk.pageNumber) === index).map((chunk) => ({ documentId: chunk.documentId, documentTitle: chunk.documentTitle, pageNumber: chunk.pageNumber, similarity: chunk.similarity }));
}

export async function generateAndSaveQuiz(params: QuizRequest) {
  const db = getPool();
  if (!db) throw new Error("La base documentaire n’est pas configurée.");
  const topic = params.topic?.trim() || "les concepts essentiels de ce cours";
  const embedding = await createEmbedding(topic);
  const chunks = await searchAuthorizedChunks({ courseId: params.courseId, documentIds: params.documentIds, userId: params.userId, embedding, topK: Math.max(ragConfig.topK, 10), threshold: Math.min(ragConfig.relevanceThreshold, 0.35) });
  if (chunks.length < 2) return { kind: "insufficient_context" as const };
  const generated = await generateQuizQuestions({ context: buildQuizContext(chunks), count: params.count, difficulty: params.difficulty, language: params.language });
  const questions = generated.questions.slice(0, params.count);
  if (questions.length < params.count) throw new Error("Le fournisseur IA n’a pas généré assez de questions valides.");
  const quizId = randomUUID();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    await client.query(`INSERT INTO quiz_sets (id, user_id, course_id, document_ids, title, language, difficulty, question_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [quizId, params.userId, params.courseId, params.documentIds || chunks.map((chunk) => chunk.documentId).filter((id, index, ids) => ids.indexOf(id) === index), `Révision · ${topic}`, params.language, params.difficulty, questions.length]);
    const saved = [];
    for (const [index, question] of questions.entries()) {
      const citations = question.citations.length ? question.citations : uniqueCitations(chunks).slice(0, 2);
      const result = await client.query(`INSERT INTO quiz_questions (quiz_set_id, position, prompt, options, correct_option, explanation, citations, concept) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [quizId, index, question.prompt, JSON.stringify(question.options), question.correctOption, question.explanation, JSON.stringify(citations), question.concept || topic]);
      saved.push({ id: result.rows[0].id, position: index, prompt: question.prompt, concept: question.concept, options: question.options, citations });
    }
    await client.query("COMMIT");
    return { kind: "ready" as const, quizId, title: `Révision · ${topic}`, questions: saved };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function recordQuizAttempt(params: { quizId: string; userId: string; answers: Array<{ questionId: string; selectedOption: number | null }>; durationSeconds?: number }) {
  const db = getPool();
  if (!db) throw new Error("La base documentaire n’est pas configurée.");
  const quiz = await db.query<{ id: string; correct_option: number; position: number; explanation: string; citations: Array<{ documentId: string; documentTitle: string; pageNumber: number }> }>(`SELECT q.id, q.correct_option, q.position, q.explanation, q.citations FROM quiz_questions q JOIN quiz_sets s ON s.id=q.quiz_set_id WHERE s.id=$1 AND s.user_id=$2 ORDER BY q.position`, [params.quizId, params.userId]);
  if (!quiz.rows.length) return null;
  const byId = new Map(quiz.rows.map((row) => [row.id, row]));
  const answerById = new Map<string, number | null>();
  for (const answer of params.answers) if (byId.has(answer.questionId)) answerById.set(answer.questionId, answer.selectedOption);
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const score = quiz.rows.reduce((sum, question) => sum + (answerById.get(question.id) === question.correct_option ? 1 : 0), 0);
    const attempt = await client.query<{ id: string }>(`INSERT INTO quiz_attempts (quiz_set_id, user_id, score, total, duration_seconds) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [params.quizId, params.userId, score, quiz.rows.length, params.durationSeconds || null]);
    for (const question of quiz.rows) {
      const selectedOption = answerById.get(question.id) ?? null;
      await client.query(`INSERT INTO quiz_answers (attempt_id, question_id, selected_option, is_correct) VALUES ($1,$2,$3,$4)`, [attempt.rows[0].id, question.id, selectedOption, question.correct_option === selectedOption]);
    }
    await client.query("COMMIT");
    return {
      attemptId: attempt.rows[0].id,
      score,
      total: quiz.rows.length,
      percentage: Math.round((score / quiz.rows.length) * 100),
      corrections: quiz.rows.map((question) => ({ questionId: question.id, correctOption: question.correct_option, explanation: question.explanation, citations: question.citations ?? [] })),
    };
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
