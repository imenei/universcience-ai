import { isAiConfigured, ragConfig } from "@/lib/rag/config";

export class ProviderConfigurationError extends Error {}
export class ProviderRequestError extends Error {}

export type GeneratedQuizQuestion = {
  prompt: string;
  options: Array<{ label: string; detail: string }>;
  correctOption: number;
  explanation: string;
  citations: Array<{ documentId: string; documentTitle: string; pageNumber: number; similarity?: number }>;
  concept: string;
};

function isGemini() {
  return ragConfig.aiBaseUrl.includes("generativelanguage.googleapis.com");
}

function cleanModel(model: string) {
  return model.replace(/^models\//, "");
}

function safeProviderMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: { message?: unknown } }).error;
    if (error && typeof error.message === "string") return error.message;
  }
  return fallback;
}

async function requestJson(url: string, body: unknown, headers: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) throw new ProviderRequestError(safeProviderMessage(payload, `Le fournisseur IA a répondu ${response.status}.`));
  return payload;
}

async function openAiRequest(path: string, body: unknown) {
  return requestJson(`${ragConfig.aiBaseUrl}${path}`, body, { Authorization: `Bearer ${ragConfig.aiApiKey}` });
}

async function geminiRequest(model: string, method: "generateContent" | "embedContent", body: unknown) {
  const url = new URL(`${ragConfig.aiBaseUrl}/models/${encodeURIComponent(cleanModel(model))}:${method}`);
  url.searchParams.set("key", ragConfig.aiApiKey || "");
  return requestJson(url.toString(), body, {});
}

export async function createEmbedding(input: string): Promise<number[]> {
  if (!isAiConfigured()) throw new ProviderConfigurationError("Le fournisseur IA n’est pas configuré côté serveur.");
  const payload = isGemini()
    ? await geminiRequest(ragConfig.embeddingModel || "", "embedContent", { content: { parts: [{ text: input }] }, outputDimensionality: 1536 })
    : await openAiRequest("/embeddings", { model: ragConfig.embeddingModel, input });
  const embedding = isGemini() ? payload?.embedding?.values : payload?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new ProviderRequestError("Réponse d’embedding invalide.");
  return embedding;
}

export async function generateGroundedAnswer(question: string, context: string, history: Array<{ role: "user" | "assistant"; content: string }>) {
  if (!isAiConfigured()) throw new ProviderConfigurationError("Le fournisseur IA n’est pas configuré côté serveur.");
  const system = `Tu es le tuteur de cours UniverScience AI. Réponds en français de manière pédagogique et concise. Les extraits entre <course_context> sont la source primaire. Utilise-les uniquement pour les affirmations sur le cours. Si le contexte ne suffit pas, dis explicitement que le document fourni ne permet pas de répondre. Ne fabrique jamais de citation, page, extrait ou fait. N’insère jamais de marqueurs techniques comme [SOURCE 1] ou [SOURCE 1, SOURCE 3] dans ta réponse : les sources seront affichées séparément par l’interface. Distingue une explication complémentaire par la formule « Explication complémentaire ».`;
  if (isGemini()) {
    const payload = await geminiRequest(ragConfig.chatModel || "", "generateContent", {
      systemInstruction: { parts: [{ text: system }] },
      contents: [
        ...history.slice(-6).map((item) => ({ role: item.role === "assistant" ? "model" : "user", parts: [{ text: item.content }] })),
        { role: "user", parts: [{ text: `<course_context>\n${context}\n</course_context>\n\nQuestion: ${question}` }] },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 768, thinkingConfig: { thinkingBudget: 0 } },
    });
    const answer = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
    if (typeof answer !== "string" || !answer.trim()) throw new ProviderRequestError("Réponse Gemini vide.");
    return answer.trim();
  }
  const payload = await openAiRequest("/chat/completions", {
    model: ragConfig.chatModel,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      ...history.slice(-6),
      { role: "user", content: `<course_context>\n${context}\n</course_context>\n\nQuestion: ${question}` },
    ],
  });
  const answer = payload?.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) throw new ProviderRequestError("Réponse de génération vide.");
  return answer.trim();
}

function matchCorrectOption(value: string, options: Array<{ label: string; detail: string }>) {
  const normalized = value.trim().toLowerCase();
  const letter = normalized.match(/^[\[\(]?([a-d])[\]\).:-]?/i)?.[1];
  if (letter) return letter.charCodeAt(0) - 97;
  const exact = options.findIndex((option) => option.label.trim().toLowerCase() === normalized);
  return exact;
}

export async function generateQuizQuestions(params: { context: string; count: number; difficulty: "easy" | "medium" | "hard"; language: "fr" | "ar" | "en" }) {
  if (!isAiConfigured()) throw new ProviderConfigurationError("Le fournisseur IA n’est pas configuré côté serveur.");
  const languageName = params.language === "ar" ? "arabe" : params.language === "en" ? "anglais" : "français";
  const system = `Tu es un générateur de QCM universitaire pour UniverScience AI. Génère exactement ${params.count} questions en ${languageName}, niveau ${params.difficulty}, uniquement à partir du contexte fourni. Chaque question doit avoir exactement 4 options et une seule bonne réponse. Les explications doivent être pédagogiques. N’invente aucune information absente du contexte. Les citations doivent reprendre uniquement les marqueurs SOURCE présents dans le contexte et leurs pages. Réponds uniquement en JSON valide.`;
  const userContent = `<course_context>\n${params.context}\n</course_context>\nGénère le QCM maintenant.`;
  let raw: unknown;
  if (isGemini()) {
    const payload = await geminiRequest(ragConfig.chatModel || "", "generateContent", { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: userContent }] }], generationConfig: { temperature: 0.25, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: "application/json" } });
    raw = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("");
  } else {
    const payload = await openAiRequest("/chat/completions", { model: ragConfig.chatModel, temperature: 0.25, max_tokens: 4096, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: userContent }] });
    raw = payload?.choices?.[0]?.message?.content;
  }
  try {
    const rawText = typeof raw === "string" ? raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim() : "";
    const jsonStart = rawText.search(/[\[{]/);
    const jsonEnd = Math.max(rawText.lastIndexOf("]"), rawText.lastIndexOf("}"));
    const jsonText = rawText && jsonStart >= 0 && jsonEnd >= jsonStart ? rawText.slice(jsonStart, jsonEnd + 1) : rawText;
    const parsed = typeof raw === "string" ? JSON.parse(jsonText || rawText) : raw;
    const questions = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { questions?: unknown })?.questions) ? (parsed as { questions: unknown[] }).questions : [];
    const valid = questions.map((item): GeneratedQuizQuestion | null => {
      if (!item || typeof item !== "object") return null;
      const q = item as Partial<GeneratedQuizQuestion> & { question?: unknown; correctAnswer?: unknown; answer?: unknown };
      const prompt = typeof q.prompt === "string" ? q.prompt : typeof q.question === "string" ? q.question : "";
      const options = Array.isArray(q.options) ? q.options.map((option) => typeof option === "string" ? { label: option, detail: "" } : option).filter((option): option is { label: string; detail: string } => Boolean(option && typeof option === "object" && typeof (option as { label?: unknown }).label === "string")).slice(0, 4) : [];
      const rawCorrect = q.correctOption ?? q.correctAnswer ?? q.answer;
      const correctOption = typeof rawCorrect === "number" ? (rawCorrect >= 1 && rawCorrect <= 4 ? rawCorrect - 1 : rawCorrect) : typeof rawCorrect === "string" ? (matchCorrectOption(rawCorrect, options)) : -1;
      if (!prompt || options.length !== 4 || correctOption < 0 || correctOption > 3 || typeof q.explanation !== "string") return null;
      return { prompt, options, correctOption, explanation: q.explanation, citations: Array.isArray(q.citations) ? q.citations as GeneratedQuizQuestion["citations"] : [], concept: typeof q.concept === "string" ? q.concept : "Concept du cours" };
    }).filter((item): item is GeneratedQuizQuestion => item !== null);
    if (valid.length < params.count) throw new Error("Format QCM incomplet");
    return { questions: valid.slice(0, params.count) };
  } catch { throw new ProviderRequestError("La réponse du fournisseur IA n’est pas un QCM JSON valide."); }
}
