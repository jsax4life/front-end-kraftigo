/**
 * Server-side translation queue.
 * Ensures only ONE request is active to DeepL at any given time.
 * All concurrent requests wait in a queue and are processed sequentially.
 */

type PendingRequest = {
  texts: string[];
  targetLang: string;
  resolve: (result: string[]) => void;
  reject: (err: Error) => void;
};

// Module-level singletons (persist across requests in the same server process)
const pendingQueue: PendingRequest[] = [];
let isProcessing = false;

async function callDeepL(texts: string[], targetLang: string, apiKey: string): Promise<string[]> {
  const isFreeAPI = apiKey.endsWith(":fx");
  const baseUrl = isFreeAPI
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: texts,
      target_lang: targetLang.toUpperCase(),
    }),
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`DeepL ${response.status}: ${msg}`);
  }

  const data = await response.json();
  if (data?.translations && Array.isArray(data.translations)) {
    return data.translations.map((t: { text: string }) => t.text);
  }
  throw new Error("Invalid DeepL response format");
}

async function processQueue(apiKey: string): Promise<void> {
  if (isProcessing || pendingQueue.length === 0) return;
  isProcessing = true;

  while (pendingQueue.length > 0) {
    const request = pendingQueue.shift()!;
    try {
      const result = await callDeepL(request.texts, request.targetLang, apiKey);
      request.resolve(result);
    } catch (err) {
      console.error("DeepL error:", err);
      // Fallback: return original texts instead of rejecting
      request.resolve(request.texts);
    }
    // Brief cooldown between requests to avoid rate limits
    if (pendingQueue.length > 0) {
      await new Promise((res) => setTimeout(res, 200));
    }
  }

  isProcessing = false;
}

export function enqueueTranslation(
  texts: string[],
  targetLang: string,
  apiKey: string
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    pendingQueue.push({ texts, targetLang, resolve, reject });
    // Kick off the queue processor (no-op if already running)
    processQueue(apiKey);
  });
}
