"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Globe } from "lucide-react";
import Header from "@/components/shared/Header";
import { useTranslations } from "next-intl";

const currencies = [
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬" },
];

const CurrencyPage = () => {
  const router = useRouter();
  const [selected, setSelected] = useState("EUR");

  const handleSelect = (code: string) => {
    setSelected(code);
    setTimeout(() => {
        router.back();
    }, 300);
  };
  const t = useTranslations("profile.currency");

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
             <h3 className="text-[11px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mt-4 mb-4 ml-4">{t("selectCurrency")}</h3>
            <div className="space-y-1">
                {currencies.map((c) => (
                <button
                    key={c.code}
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all group ${
                    selected === c.code 
                        ? "bg-orange-50/50" 
                        : "hover:bg-gray-50/50"
                    }`}
                >
                    <div className="flex items-center gap-5">
                    <span className="text-2xl w-12 h-12 bg-white rounded-xl border border-[#F2F4F7] flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        {c.flag}
                    </span>
                    <div className="text-left">
                        <p className={`text-[16px] font-poppins font-bold ${selected === c.code ? 'text-[#1D2939]' : 'text-[#344054]'}`}>{c.code}</p>
                        <p className="text-[13px] text-[#667085] font-poppins">{c.name}</p>
                    </div>
                    </div>
                    {selected === c.code && (
                    <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white shadow-lg shadow-orange-100 animate-in zoom-in duration-300">
                        <Check size={18} strokeWidth={3} />
                    </div>
                    )}
                </button>
                ))}
            </div>
        </div>

        <div className="mt-12 flex items-center gap-4 p-6 bg-white rounded-3xl border border-[#F2F4F7] shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Globe size={24} />
            </div>
            <p className="text-[13px] font-poppins text-[#667085] leading-relaxed">
                {t("infoText")}
            </p>
        </div>
      </div>
    </main>
  );
};

export default CurrencyPage;
