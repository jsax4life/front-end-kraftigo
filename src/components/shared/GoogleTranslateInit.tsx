"use client";

import { useEffect } from "react";
import Script from "next/script";

/**
 * GoogleTranslateInit
 *
 * Loads Google Translate silently.
 * - Uses cookie-based language switching (see src/lib/googleTranslate.ts)
 * - Hides every Google Translate UI element via inline style overrides
 * - Does NOT remove the translate iframe (translation stops working if removed)
 * - Does remove visible overlay elements like banners and spinners
 */
export default function GoogleTranslateInit() {
  useEffect(() => {
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false, multilanguagePage: false },
        "google_translate_element"
      );
    };

    // Elements to HIDE (keep in DOM so translation keeps working)
    const HIDE_SELECTORS = [
      ".goog-te-banner-frame",
      ".goog-te-balloon-frame",
      ".goog-te-spinner",
      ".goog-te-gadget",
      ".goog-te-gadget-simple",
      ".goog-logo-link",
      "#goog-gt-tt",
      // Google's newer internal class names
      ".VIpgJd-ZVi9od-aZ2wEe-OiiCO",
      ".VIpgJd-ZVi9od-aZ2wEe",
      ".VIpgJd-yAWNEb-VIpgJd-fmcmS",
    ];

    // Elements to REMOVE entirely (they serve no translation purpose)
    const REMOVE_SELECTORS = [
      ".goog-te-banner-frame",
      ".goog-te-balloon-frame",
      "#goog-gt-tt",
    ];

    const suppressGoogleUI = () => {
      // Hide
      HIDE_SELECTORS.forEach((sel) => {
        document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
          el.style.setProperty("display", "none", "important");
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.setAttribute("aria-hidden", "true");
        });
      });

      // Fix body top offset Google Translate adds
      if (document.body.style.top && document.body.style.top !== "0px") {
        document.body.style.setProperty("top", "0px", "important");
      }

      // Hide the skiptranslate elements (but keep the translation iframe alive)
      document.querySelectorAll<HTMLElement>(".skiptranslate").forEach((el) => {
        // Only hide if it's NOT the translation iframe itself
        if (el.tagName !== "IFRAME") {
          el.style.setProperty("display", "none", "important");
        } else {
          // Keep iframe but make it invisible
          el.style.setProperty("visibility", "hidden", "important");
          el.style.setProperty("opacity", "0", "important");
          el.style.setProperty("pointer-events", "none", "important");
          el.style.setProperty("position", "absolute", "important");
          el.style.setProperty("left", "-9999px", "important");
          el.style.setProperty("top", "-9999px", "important");
        }
      });
    };

    suppressGoogleUI();
    const observer = new MutationObserver(suppressGoogleUI);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Mount point — kept hidden, required by Google Translate API */}
      <div
        id="google_translate_element"
        style={{ display: "none" }}
        aria-hidden="true"
      />

      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
