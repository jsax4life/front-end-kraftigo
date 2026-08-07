import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TranslationState {
  cache: Record<string, string>;
  setTranslation: (key: string, translatedText: string) => void;
  getTranslation: (key: string) => string | undefined;
}

export const useTranslationStore = create<TranslationState>()(
  persist(
    (set, get) => ({
      cache: {},
      setTranslation: (key, translatedText) => 
        set((state) => ({ cache: { ...state.cache, [key]: translatedText } })),
      getTranslation: (key) => get().cache[key],
    }),
    {
      name: 'translation-cache-v3', // bumped: clears fallback entries saved during rate-limit storms
    }
  )
);
