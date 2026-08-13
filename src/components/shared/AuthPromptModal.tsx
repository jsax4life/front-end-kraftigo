"use client";

import { useAuthPromptStore } from "@/store/useAuthPromptStore";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import Button from "@/components/ui/button";
import { useTranslations } from "next-intl";

const AuthPromptModal = () => {
  const { isOpen, closePrompt } = useAuthPromptStore();
  const router = useRouter();
  const t = useTranslations("modals.authPrompt");

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 transition-opacity"
      onClick={closePrompt}
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-sm p-6 sm:p-8 relative shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closePrompt}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="text-center mt-2">
          <div className="w-16 h-16 bg-[#FF66001A] rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
            <span className="text-2xl" role="img" aria-label="lock">🔒</span>
          </div>
          
          <h2 className="text-[22px] sm:text-[24px] font-gerat font-bold text-gray-900 mb-3 leading-tight">
            {t("title")}
          </h2>
          
          <p className="text-[14px] sm:text-[15px] font-poppins text-gray-500 mb-8 px-2 leading-relaxed">
            {t("description")}
          </p>

          <div className="space-y-4">
            <Button
              variant="primary"
              fullWidth
              onClick={() => {
                closePrompt();
                router.push("/user/createacc");
              }}
            >
              {t("signUpNow")}
            </Button>
            
            <button
              onClick={() => {
                closePrompt();
                router.push("/user/login");
              }}
              className="text-[14px] sm:text-[15px] font-poppins text-brand-orange font-semibold hover:underline w-full py-2"
            >
              {t("login")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPromptModal;
