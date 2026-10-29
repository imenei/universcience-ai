import { NextResponse } from "next/server";
import { ingestAuthorizedPdf } from "@/lib/rag/rag-service";
import { ragConfig } from "@/lib/rag/config";
import { getCurrentUserId } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const courseId = String(form.get("courseId") || "");
    if (!(file instanceof File) || file.type !== "application/pdf") return NextResponse.json({ error: "Un fichier PDF est requis." }, { status: 400 });
    if (!courseId) return NextResponse.json({ error: "Le cours associé est requis." }, { status: 400 });
    if (file.size > ragConfig.maxUploadMb * 1024 * 1024) return NextResponse.json({ error: `Le PDF dépasse la limite de ${ragConfig.maxUploadMb} Mo.` }, { status: 413 });
    const ownerId = await getCurrentUserId(request);
    if (!ownerId) return NextResponse.json({ error: "Une identité serveur autorisée est requise pour indexer un document." }, { status: 401 });
    const result = await ingestAuthorizedPdf({ buffer: Buffer.from(await file.arrayBuffer()), filename: file.name, courseId, ownerId });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("RAG ingestion failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Le traitement du document a échoué. Réessayez ou vérifiez la configuration du fournisseur IA." }, { status: 500 });
  }
}
