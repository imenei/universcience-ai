import { NextResponse } from "next/server";
import { answerWithRag } from "@/lib/rag/rag-service";
import { ProviderConfigurationError, ProviderRequestError } from "@/lib/rag/ai-provider";
import { getCurrentUserId } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const courseId = typeof body.courseId === "string" ? body.courseId : "";
    if (!question || question.length > 2000) return NextResponse.json({ error: "Une question valide est requise." }, { status: 400 });
    if (!courseId) return NextResponse.json({ error: "Le contexte de cours est requis." }, { status: 400 });
    const userId = await getCurrentUserId(request);
    if (!userId) return NextResponse.json({ error: "Une identité serveur autorisée est requise." }, { status: 401 });
    const result = await answerWithRag({ question, courseId, documentIds: Array.isArray(body.documentIds) ? body.documentIds : undefined, userId, history: Array.isArray(body.history) ? body.history : [] });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProviderConfigurationError) return NextResponse.json({ error: "Le fournisseur IA n’est pas encore configuré côté serveur. Ajoutez les variables de .env.example au déploiement.", code: "provider_not_configured" }, { status: 503 });
    if (error instanceof ProviderRequestError) return NextResponse.json({ error: "Le fournisseur IA n’a pas pu traiter la demande. Vérifiez le modèle, la clé et les limites de l’API.", code: "provider_request_failed" }, { status: 502 });
    console.error("RAG answer failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "La recherche dans le cours a échoué. Réessayez dans un instant.", code: "rag_failed" }, { status: 500 });
  }
}
