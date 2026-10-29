import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { getPool } from "@/lib/rag/retrieval-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request);
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour consulter votre progression." }, { status: 401 });
  const db = getPool();
  if (!db) return NextResponse.json({ error: "La base PostgreSQL/pgvector n’est pas configurée." }, { status: 503 });

  try {
    const [summary, byCourse, missedConcepts, recentAttempts, weeklyActivity] = await Promise.all([
      db.query(`
        SELECT COUNT(*)::int AS attempts,
               COALESCE(ROUND(AVG(100.0 * score / NULLIF(total, 0))), 0)::int AS "averagePercentage",
               COALESCE(SUM(total), 0)::int AS "totalQuestions",
               COALESCE(SUM(score), 0)::int AS "correctAnswers"
        FROM quiz_attempts
        WHERE user_id = $1
      `, [userId]),
      db.query(`
        SELECT s.course_id AS "courseId",
               COUNT(a.id)::int AS "attemptCount",
               COALESCE(ROUND(AVG(100.0 * a.score / NULLIF(a.total, 0))), 0)::int AS "averagePercentage",
               MAX(a.completed_at) AS "lastAttempt",
               COALESCE(SUM(a.score), 0)::int AS "correctAnswers",
               COALESCE(SUM(a.total), 0)::int AS "totalQuestions"
        FROM quiz_sets s
        LEFT JOIN quiz_attempts a ON a.quiz_set_id = s.id AND a.user_id = $1
        WHERE s.user_id = $1
        GROUP BY s.course_id
        ORDER BY MAX(a.completed_at) DESC NULLS LAST
      `, [userId]),
      db.query(`
        SELECT s.course_id AS "courseId",
               COALESCE(q.concept, s.title) AS concept,
               COUNT(*)::int AS "errorCount",
               MAX(a.completed_at) AS "lastAttempt"
        FROM quiz_attempts a
        JOIN quiz_sets s ON s.id = a.quiz_set_id
        JOIN quiz_answers answer ON answer.attempt_id = a.id
        JOIN quiz_questions q ON q.id = answer.question_id
        WHERE a.user_id = $1 AND answer.is_correct = false
        GROUP BY s.course_id, COALESCE(q.concept, s.title)
        ORDER BY COUNT(*) DESC, MAX(a.completed_at) DESC
        LIMIT 10
      `, [userId]),
      db.query(`
        SELECT a.id AS "attemptId",
               s.course_id AS "courseId",
               s.title,
               a.score,
               a.total,
               ROUND(100.0 * a.score / NULLIF(a.total, 0))::int AS percentage,
               a.completed_at AS "completedAt"
        FROM quiz_attempts a
        JOIN quiz_sets s ON s.id = a.quiz_set_id
        WHERE a.user_id = $1
        ORDER BY a.completed_at DESC
        LIMIT 8
      `, [userId]),
      db.query(`
        SELECT date_trunc('week', completed_at)::date AS "weekStart",
               COUNT(*)::int AS attempts,
               COALESCE(ROUND(SUM(COALESCE(duration_seconds, 0)) / 60.0), 0)::int AS "durationMinutes",
               COALESCE(ROUND(AVG(100.0 * score / NULLIF(total, 0))), 0)::int AS "averagePercentage"
        FROM quiz_attempts
        WHERE user_id = $1 AND completed_at >= now() - interval '56 days'
        GROUP BY 1
        ORDER BY 1
      `, [userId]),
    ]);

    return NextResponse.json({
      summary: summary.rows[0] ?? { attempts: 0, averagePercentage: 0, totalQuestions: 0, correctAnswers: 0 },
      byCourse: byCourse.rows,
      missedConcepts: missedConcepts.rows,
      recentAttempts: recentAttempts.rows,
      weeklyActivity: weeklyActivity.rows,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Progress query failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "La progression n’a pas pu être chargée." }, { status: 500 });
  }
}
