import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/server-auth";
import { generateAndSaveQuiz } from "@/lib/quiz-service";
import { ProviderConfigurationError, ProviderRequestError } from "@/lib/rag/ai-provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    const count = Math.max(3, Math.min(15, Number(body.count) || 5));
    const difficulty = ["easy", "medium", "hard"].includes(body.difficulty) ? body.difficulty : "medium";
    const language = ["fr", "ar", "en"].includes(body.language) ? body.language : "fr";
    if (!courseId) return NextResponse.json({ error: "Le cours est requis." }, { status: 400 });
    const userId = await getCurrentUserId(request);
    if (!userId) return NextResponse.json({ error: "Connectez-vous pour générer un QCM." }, { status: 401 });
    const result = await generateAndSaveQuiz({ userId, courseId, documentIds: Array.isArray(body.documentIds) ? body.documentIds : undefined, topic: typeof body.topic === "string" ? body.topic : undefined, count, difficulty, language });
    if (result.kind === "insufficient_context") return NextResponse.json({ error: "Le cours sélectionné ne contient pas assez de passages indexés pour générer un QCM.", code: "insufficient_context" }, { status: 422 });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProviderConfigurationError) return NextResponse.json({ error: "Le fournisseur IA n’est pas configuré côté serveur.", code: "provider_not_configured" }, { status: 503 });
    if (error instanceof ProviderRequestError) {
      console.error("Quiz provider request failed", error.message);
      const message = error.message.toLowerCase();
      const invalidKey = /api key not valid|invalid api key|api_key_invalid|unauthorized|permission denied/.test(message);
      const unknownModel = /model.*(not found|does not exist|not supported)|not found.*model/.test(message);
      const busy = /high demand|forte demande|temporar|rate limit|quota/.test(message);
      const errorMessage = invalidKey
        ? "La clé Gemini est refusée par Google. Remplacez AI_API_KEY par une clé Google AI Studio valide."
        : unknownModel
          ? "Le modèle Gemini configuré n’est pas disponible. Vérifiez AI_CHAT_MODEL et AI_EMBEDDING_MODEL."
          : busy
            ? "Le fournisseur IA est momentanément très sollicité ou la limite est atteinte. Réessayez plus tard."
            : "La génération IA a échoué. Vérifiez le modèle, la clé et les limites de l’API.";
      return NextResponse.json({ error: errorMessage, code: invalidKey ? "provider_invalid_key" : unknownModel ? "provider_unknown_model" : busy ? "provider_busy" : "provider_request_failed" }, { status: 502 });
    }
    console.error("Quiz generation failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "La génération du QCM a échoué. Réessayez.", code: "quiz_generation_failed" }, { status: 500 });
  }
}
