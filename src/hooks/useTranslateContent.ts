import { useState, useEffect } from 'react';
import { useTranslationStore } from '../store/useTranslationStore';

/**
 * Hook to dynamically translate content via our API proxy.
 * Caches results in Zustand to avoid redundant API calls.
 */
export function useTranslateContent(texts: string[], targetLang: string) {
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);
  const [isLoading, setIsLoading] = useState(false);
  const { cache, setTranslation } = useTranslationStore();

  useEffect(() => {
    // If target is English or texts is empty, just return original
    if (!texts.length || targetLang === 'en') {
      setTranslatedTexts(texts);
      return;
    }

    let isMounted = true;

    const translate = async () => {
      // Check cache first
      const textsToTranslate: { index: number; text: string }[] = [];
      const currentTranslated = [...texts];
      let hasMissingTranslations = false;

      texts.forEach((text, i) => {
        const cacheKey = `${targetLang}:${text}`;
        if (cache[cacheKey]) {
          currentTranslated[i] = cache[cacheKey];
        } else {
          textsToTranslate.push({ index: i, text });
          hasMissingTranslations = true;
        }
      });

      if (!hasMissingTranslations) {
        setTranslatedTexts(currentTranslated);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: textsToTranslate.map(t => t.text),
            targetLang
          }),
        });

        if (!response.ok) throw new Error('Translation API failed');

        const data = await response.json();
        
        if (data.translatedTexts && Array.isArray(data.translatedTexts)) {
          textsToTranslate.forEach((item, idx) => {
            const translatedText = data.translatedTexts[idx];
            if (translatedText) {
              currentTranslated[item.index] = translatedText;
              setTranslation(`${targetLang}:${item.text}`, translatedText);
            }
          });

          if (isMounted) {
            setTranslatedTexts([...currentTranslated]);
          }
        }
      } catch (error) {
        console.error('Failed to translate texts:', error);
        // Fallback to original texts on error
        if (isMounted) {
          setTranslatedTexts([...currentTranslated]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [texts, targetLang, cache, setTranslation]);

  return { translatedTexts, isLoading };
}
