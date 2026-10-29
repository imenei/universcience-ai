export const ragConfig = {
  databaseUrl: process.env.RAG_DATABASE_URL,
  aiBaseUrl: (process.env.AI_BASE_URL || "").replace(/\/$/, ""),
  aiApiKey: process.env.AI_API_KEY,
  chatModel: process.env.AI_CHAT_MODEL,
  embeddingModel: process.env.AI_EMBEDDING_MODEL,
  topK: Number(process.env.RAG_TOP_K || 5),
  relevanceThreshold: Number(process.env.RAG_RELEVANCE_THRESHOLD || 0.5),
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 20),
};

export function isAiConfigured() {
  return Boolean(ragConfig.aiBaseUrl && ragConfig.aiApiKey && ragConfig.chatModel && ragConfig.embeddingModel);
}
