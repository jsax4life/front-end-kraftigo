"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * GoogleTranslateInit
 *
 * Loads the Google Translate widget script and initialises it silently.
 * The default Google Translate toolbar is hidden via globals.css.
 * Language switching is done programmatically via src/lib/googleTranslate.ts.
 */
export default function GoogleTranslateInit() {
  useEffect(() => {
    // Expose the init callback that the Google Translate script calls
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          // Provide a hidden container — we never show the default widget
        },
        "google_translate_element"
      );
    };
  }, []);

  return (
    <>
      {/* Hidden mount point required by Google Translate */}
      <div id="google_translate_element" className="hidden" aria-hidden="true" />

      {/* Google Translate script */}
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
