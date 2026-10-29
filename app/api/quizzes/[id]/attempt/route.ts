import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { recordQuizAttempt } from "@/lib/quiz-service";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId(request);
  if (!userId) return NextResponse.json({ error: "Connectez-vous pour enregistrer votre tentative." }, { status: 401 });
  try {
    const body = await request.json();
    const answers = Array.isArray(body.answers) ? body.answers.filter((item: unknown) => item && typeof item === "object" && typeof (item as { questionId?: unknown }).questionId === "string").map((item: { questionId: string; selectedOption?: unknown }) => ({ questionId: item.questionId, selectedOption: typeof item.selectedOption === "number" ? item.selectedOption : null })) : [];
    const { id } = await params;
    const result = await recordQuizAttempt({ quizId: id, userId, answers, durationSeconds: typeof body.durationSeconds === "number" ? body.durationSeconds : undefined });
    if (!result) return NextResponse.json({ error: "QCM introuvable ou non autorisé." }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Quiz attempt failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "La tentative n’a pas pu être enregistrée." }, { status: 500 });
  }
}
