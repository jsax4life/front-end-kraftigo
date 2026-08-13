import { useState, useEffect } from 'react';
import { useTranslationStore } from '../store/useTranslationStore';

// --------------------------------------------------------------------------
// Module-level singletons — persist for the lifetime of the browser tab.
// These are OUTSIDE React so they never cause re-renders.
// --------------------------------------------------------------------------

// Global rate-limit cooldown: if DeepL returns 429, pause all requests.
let rateLimitedUntil = 0;

// Texts currently in-flight — reuse the same promise to avoid duplicate requests.
const inFlightPromises = new Map<string, Promise<string>>();

function getOrCreateTranslation(text: string, lang: string): Promise<string> {
  if (!text || !text.trim()) return Promise.resolve(text);

  const key = `${lang}:${text}`;

  // 1. Check persistent cache (localStorage via Zustand)
  const cached = useTranslationStore.getState().cache[key];
  if (cached !== undefined) return Promise.resolve(cached);

  // 2. If we're currently rate-limited, return original immediately
  if (Date.now() < rateLimitedUntil) {
    return Promise.resolve(text);
  }

  // 3. Reuse in-flight promise if same text is already being fetched
  if (inFlightPromises.has(key)) return inFlightPromises.get(key)!;

  // 4. Queue a new request
  const promise = fetchTranslation(text, lang).finally(() => {
    inFlightPromises.delete(key);
  });

  inFlightPromises.set(key, promise);
  return promise;
}

// Global debounce batch — groups all texts queued within 100ms into ONE API call
let pendingBatch: { text: string; lang: string; resolve: (v: string) => void }[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function fetchTranslation(text: string, lang: string): Promise<string> {
  return new Promise((resolve) => {
    pendingBatch.push({ text, lang, resolve });

    if (!batchTimer) {
      batchTimer = setTimeout(async () => {
        batchTimer = null;
        const batch = pendingBatch.splice(0); // drain the batch

        // Group by language
        const byLang: Record<string, typeof batch> = {};
        for (const item of batch) {
          if (!byLang[item.lang]) byLang[item.lang] = [];
          byLang[item.lang].push(item);
        }

        for (const [targetLang, items] of Object.entries(byLang)) {
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                texts: items.map((i) => i.text),
                targetLang,
              }),
            });

            if (!res.ok) {
              // On rate limit, set a cooldown so we stop hammering the API
              if (res.status === 429) {
                rateLimitedUntil = Date.now() + 60_000; // 60 second pause
                console.warn('DeepL rate limited. Pausing translation requests for 60s.');
              }
              throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();

            items.forEach((item, idx) => {
              const translated = data.translatedTexts?.[idx] ?? item.text;
              // ALWAYS save to persistent cache — even original text on success
              // This prevents the hook from retrying the same text on every render
              useTranslationStore.getState().setTranslation(
                `${targetLang}:${item.text}`,
                translated
              );
              item.resolve(translated);
            });
          } catch {
            // On failure, save the ORIGINAL text to cache to stop infinite retry loops.
            // The user sees English now; they can reload once DeepL recovers.
            items.forEach((item) => {
              useTranslationStore.getState().setTranslation(
                `${item.lang}:${item.text}`,
                item.text // original text as fallback
              );
              item.resolve(item.text);
            });
          }
        }
      }, 100); // 100ms debounce window
    }
  });
}

// --------------------------------------------------------------------------
// Hook
// --------------------------------------------------------------------------

export function useTranslateContent(texts: string[], targetLang: string) {
  // Initialise immediately from cache (no loading flicker)
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(() => {
    if (targetLang === 'en' || !texts.length) return texts;
    const cache = useTranslationStore.getState().cache;
    return texts.map((t) => cache[`${targetLang}:${t}`] ?? t);
  });

  const textsKey = texts.join('||');

  useEffect(() => {
    if (!texts.length || targetLang === 'en') {
      setTranslatedTexts(texts);
      return;
    }

    const cache = useTranslationStore.getState().cache;

    // Find texts that are NOT yet cached
    const uncached = texts.filter((t) => t && cache[`${targetLang}:${t}`] === undefined);

    if (uncached.length === 0) {
      // Everything cached — just apply synchronously
      setTranslatedTexts(texts.map((t) => cache[`${targetLang}:${t}`] ?? t));
      return;
    }

    let cancelled = false;

    Promise.all(uncached.map((t) => getOrCreateTranslation(t, targetLang))).then(() => {
      if (cancelled) return;
      // Re-read cache after all promises settle
      const updated = useTranslationStore.getState().cache;
      setTranslatedTexts(texts.map((t) => updated[`${targetLang}:${t}`] ?? t));
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textsKey, targetLang]);

  return { translatedTexts, isLoading: false };
}
