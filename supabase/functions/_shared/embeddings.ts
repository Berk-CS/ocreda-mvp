export const EMBEDDING_PROVIDER = "google";
export const EMBEDDING_MODEL = "gemini-embedding-2";
export const EMBEDDING_DIMENSION = 768;
export const EMBEDDING_TOKEN_LIMIT = 8_192;
export const EMBEDDING_VERSION =
  `${EMBEDDING_PROVIDER}:${EMBEDDING_MODEL}:${EMBEDDING_DIMENSION}:retrieval-prefix-v2`;

export type EmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "SEMANTIC_SIMILARITY";

interface GeminiEmbeddingResponse {
  embedding?: { values?: number[] };
  embeddings?: Array<{ values?: number[] }>;
  usageMetadata?: { promptTokenCount?: number };
}

export interface SemanticEmbeddingResult {
  values: number[];
  tokenCount: number | null;
}

export function prepareEmbeddingText(
  text: string,
  taskType: EmbeddingTaskType,
  title?: string,
): string {
  const cleanText = text.trim();
  if (!cleanText) throw new Error("Cannot embed empty text");

  if (taskType === "RETRIEVAL_QUERY") {
    return `task: search result | query: ${cleanText}`;
  }
  if (taskType === "RETRIEVAL_DOCUMENT") {
    const cleanTitle = title?.trim().slice(0, 200) || "none";
    return `title: ${cleanTitle} | text: ${cleanText}`;
  }
  return `task: sentence similarity | query: ${cleanText}`;
}

export function buildEmbeddingRequest(
  text: string,
  taskType: EmbeddingTaskType,
  title?: string,
): Record<string, unknown> {
  return {
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text: prepareEmbeddingText(text, taskType, title) }] },
    embedContentConfig: {
      outputDimensionality: EMBEDDING_DIMENSION,
      // A complete note is authoritative. Fail explicitly instead of allowing
      // Gemini to silently truncate content beyond the model limit.
      autoTruncate: false,
    },
  };
}

export async function generateSemanticEmbedding(
  text: string,
  apiKey: string,
  taskType: EmbeddingTaskType,
  title?: string,
): Promise<number[]> {
  return (await generateSemanticEmbeddingResult(text, apiKey, taskType, title)).values;
}

export async function generateSemanticEmbeddingResult(
  text: string,
  apiKey: string,
  taskType: EmbeddingTaskType,
  title?: string,
): Promise<SemanticEmbeddingResult> {
  const result = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(buildEmbeddingRequest(text, taskType, title)),
    },
  );

  if (!result.ok) {
    const detail = (await result.text()).slice(0, 500);
    throw new Error(`Embedding API error (${result.status}): ${detail}`);
  }

  const payload = await result.json() as GeminiEmbeddingResponse;
  const values = payload.embedding?.values ?? payload.embeddings?.[0]?.values;
  if (
    !Array.isArray(values) || values.length !== EMBEDDING_DIMENSION ||
    values.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      `Embedding API returned an invalid ${
        values?.length ?? 0
      }-dimension vector`,
    );
  }
  const tokenCount = Number(payload.usageMetadata?.promptTokenCount);
  return {
    values,
    tokenCount: Number.isSafeInteger(tokenCount) && tokenCount >= 0
      ? tokenCount
      : null,
  };
}

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function noteTitle(rawText: string): string {
  return rawText.split("\n", 1)[0]?.trim().slice(0, 200) || "Untitled note";
}
