"use client";

import { useEffect, useState } from "react";
import { Check, Languages } from "lucide-react";
import Header from "@/components/shared/Header";
import { useTranslations } from "next-intl";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English (US)", flag: "🇺🇸" },
  { code: "de", name: "German", flag: "🇩🇪" },
];

const LanguagePage = () => {
  const [selected, setSelected] = useState("en");
  const t = useTranslations("profile.language");

  // Read current lang cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/);
    if (match) setSelected(match[1]);
  }, []);

  const handleSelect = (code: string) => {
    setSelected(code);
    // Set the lang cookie so the server reads it on next request
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `lang=${code}; path=/; max-age=${maxAge}; SameSite=Lax`;
    // Reload so the layout re-renders with the new locale
    setTimeout(() => {
      window.location.href = "/";
    }, 300);
  };

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <Header title={t("title")} showLogout={false} />

      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h2 className="text-[32px] font-gerat font-[850] text-[#1D2939] leading-tight">
            {t("title")}
          </h2>
          <p className="text-[14px] text-[#667085] font-poppins mt-2">
            {t("desc")}
          </p>
        </div>

        <div className="bg-white rounded-[32px] border border-[#F2F4F7] shadow-sm overflow-hidden p-3">
          <h3 className="text-[11px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mt-4 mb-4 ml-4">
            {t("selectLanguage")}
          </h3>
          <div className="space-y-1">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${
                  selected === l.code
                    ? "bg-orange-50/50"
                    : "hover:bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-5">
                  <span className="text-2xl w-12 h-12 bg-white rounded-xl border border-[#F2F4F7] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {l.flag}
                  </span>
                  <div className="text-left">
                    <p
                      className={`text-[16px] font-poppins font-bold ${selected === l.code ? "text-[#1D2939]" : "text-[#344054]"}`}
                    >
                      {l.name}
                    </p>
                    <p className="text-[13px] text-[#667085] font-poppins">
                      {l.code.toUpperCase()}
                    </p>
                  </div>
                </div>
                {selected === l.code && (
                  <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white shadow-lg shadow-orange-100 animate-in zoom-in duration-300">
                    <Check size={18} strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center gap-4 p-6 bg-white rounded-3xl border border-[#F2F4F7] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Languages size={24} />
          </div>
          <p className="text-[13px] font-poppins text-[#667085] leading-relaxed">
            {t("infoText")}
          </p>
        </div>
      </div>
    </main>
  );
};

export default LanguagePage;
