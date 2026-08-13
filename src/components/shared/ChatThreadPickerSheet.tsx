"use client";

import { X } from "lucide-react";
import type { Conversation } from "@/types";
import { getConversationContextLabel, sortConversationThreads } from "@/lib/chatInbox";
import { useTranslations } from "next-intl";

interface ChatThreadPickerSheetProps {
  participantName: string;
  threads: Conversation[];
  onSelect: (thread: Conversation) => void;
  onClose: () => void;
  /** When true, shown from "Switch Kraft" in an open chat */
  isSwitchMode?: boolean;
}

export default function ChatThreadPickerSheet({
  participantName,
  threads,
  onSelect,
  onClose,
  isSwitchMode = false,
}: ChatThreadPickerSheetProps) {
  const sorted = sortConversationThreads(threads);
  const t = useTranslations("chat");

  return (
    <div className="fixed inset-0 z-130 flex items-end sm:items-center justify-center bg-black/40">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 pb-8 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[18px] font-poppins font-bold text-[#1D2939]">
              {isSwitchMode ? t("switchKraft") : t("chooseConversation")}
            </h3>
            <p className="text-[13px] font-poppins text-[#667085] mt-0.5">
              {t("oneChatPerKraft", { name: participantName })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {sorted.map((thread) => {
            const roomId = String(thread.conversationId ?? thread.id ?? "");
            const label = getConversationContextLabel(thread);
            return (
              <button
                key={roomId}
                type="button"
                onClick={() => onSelect(thread)}
                className="w-full text-left p-4 rounded-xl border border-[#EAECF0] hover:border-brand-orange hover:bg-[#FFF9F5] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[14px] font-poppins font-semibold text-[#1D2939] truncate">
                    {label}
                  </span>
                  {thread.isLocked ? (
                    <span className="text-[10px] font-poppins font-bold uppercase tracking-wide text-[#667085] bg-[#F2F4F7] px-2 py-0.5 rounded shrink-0">
                      {t("locked")}
                    </span>
                  ) : (
                    <span className="text-[10px] font-poppins font-bold uppercase tracking-wide text-[#00A651] bg-[#E7F8F0] px-2 py-0.5 rounded shrink-0">
                      {t("active")}
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-poppins text-[#667085] truncate">
                  {thread.lastMessage || t("noMessagesYet")}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
