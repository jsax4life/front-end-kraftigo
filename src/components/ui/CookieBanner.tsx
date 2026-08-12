"use client";

import { useState, useEffect } from "react";
import mixpanel from "@/lib/mixpanel";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const hasConsented = localStorage.getItem("mixpanel-consent");
    if (!hasConsented) {
      setShowBanner(true);
    } else if (hasConsented === "true") {
      mixpanel.opt_in_tracking();
    }
  }, []);

  if (!showBanner) return null;

  const handleAccept = () => {
    mixpanel.opt_in_tracking();
    localStorage.setItem("mixpanel-consent", "true");
    setShowBanner(false);
  };

  const handleDecline = () => {
    // Mixpanel is opted out by default, so we just hide the banner
    localStorage.setItem("mixpanel-consent", "false");
    setShowBanner(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900 text-white shadow-lg border-t border-gray-800">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm">
          <p>
            We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking accept, you agree to this, as outlined in our Cookie Policy.
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
