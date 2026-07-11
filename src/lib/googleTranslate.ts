/**
 * Utility to programmatically switch the Google Translate widget language.
 *
 * Maps our internal language codes to the BCP 47 / Google Translate language codes.
 */

const LANGUAGE_MAP: Record<string, string> = {
  en: "en",
  de: "de",
  // fr: "fr",
  // es: "es",
  // it: "it",
  // nl: "nl",
  // pt: "pt",
  // pl: "pl",
  // tr: "tr",
  // ar: "ar",
  // zh: "zh-CN",
  // ru: "ru",
};

/**
 * Switch the Google Translate widget to the given language code.
 * Call this whenever the user selects a new language in the UI.
 *
 * @param langCode - Internal language code (e.g. "de", "fr", "en")
 */
export function switchLanguage(langCode: string): void {
  if (typeof window === "undefined") return;

  const googleCode = LANGUAGE_MAP[langCode] ?? langCode;

  // Method 1: Use the GTranslateInit cookie approach (most reliable)
  const trySetCookie = () => {
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `googtrans=/en/${googleCode}; expires=${expires.toUTCString()}; path=/`;
    document.cookie = `googtrans=/en/${googleCode}; expires=${expires.toUTCString()}; path=/; domain=${window.location.hostname}`;
  };

  // Method 2: Programmatically use the translate element if available
  const trySelectElement = () => {
    const select = document.querySelector<HTMLSelectElement>(
      ".goog-te-combo"
    );
    if (select) {
      select.value = googleCode;
      select.dispatchEvent(new Event("change"));
      return true;
    }
    return false;
  };

  // Reset to English first if switching to English
  if (langCode === "en") {
    // Clear the googtrans cookie to reset
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;

    // Try to use the restore original button
    const restoreBtn = document.querySelector<HTMLElement>(
      ".goog-te-banner-frame"
    );
    if (restoreBtn) {
      // Trigger page reload to clear translation
      window.location.reload();
      return;
    }

    // Fallback: reload to clear
    window.location.reload();
    return;
  }

  trySetCookie();
  const found = trySelectElement();

  if (!found) {
    // Widget not initialized yet — reload to apply the cookie
    window.location.reload();
  }
}

/**
 * Read the currently active Google Translate language from the cookie.
 * Returns our internal code (e.g. "de") or "en" if not set.
 */
export function getActiveLanguage(): string {
  if (typeof document === "undefined") return "en";

  const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
  if (!match) return "en";

  const googleCode = match[1];
  // Reverse lookup
  const entry = Object.entries(LANGUAGE_MAP).find(
    ([, v]) => v === googleCode
  );
  return entry ? entry[0] : googleCode;
}
