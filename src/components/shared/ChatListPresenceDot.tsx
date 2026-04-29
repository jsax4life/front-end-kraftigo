"use client";

import type { Conversation } from "@/types";
import { useChatPresenceDotIsGreen } from "@/hooks/useChatPresenceDot";

/** Avatar corner dot: API `isOnline` or recent peer activity (message / typing). */
export default function ChatListPresenceDot({ chat }: { chat: Conversation }) {
  const green = useChatPresenceDotIsGreen(chat);
  return (
    <div
      className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white rounded-full ${
        green ? "bg-[#00A651] shadow-sm" : "bg-[#D0D5DD]"
      }`}
    />
  );
}
