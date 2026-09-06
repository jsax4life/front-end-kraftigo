"use client";

import { useState, useEffect } from "react";
import Loader from "@/components/ui/loader";

export default function GlobalSplashLoader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const hasSeenLoader = sessionStorage.getItem("hasSeenSplashLoader");
    
    if (hasSeenLoader) {
      setLoading(false);
      return;
    }

    const fadeTimer = setTimeout(() => {
      setFade(true);
    }, 10000);

    const removeTimer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem("hasSeenSplashLoader", "true");
    }, 10000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      {children}
      {loading && (
        <div 
          className={`fixed inset-0 z-[9999] bg-[#faf8f5] flex items-center justify-center transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'}`}
        >
          <Loader />
        </div>
      )}
    </>
  );
}
