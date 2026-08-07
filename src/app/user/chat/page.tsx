"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, User as UserIcon, MoreHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import UserNav from "@/components/shared/userNav";
import Navbar from "@/components/shared/Navbar";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getStoredAccessToken } from "@/lib/axios";
import { chatSocketManager } from "@/lib/socket";
import ChatInterface from "@/components/support/ChatInterface";
import ChatListPresenceDot from "@/components/shared/ChatListPresenceDot";
import ChatThreadPickerSheet from "@/components/shared/ChatThreadPickerSheet";
import {
  filterChatGroups,
  getConversationContextLabel,
  groupConversationsByParticipant,
  type ParticipantChatGroup,
} from "@/lib/chatInbox";
import {
  rememberPreferredChatThread,
  resolvePreferredChatThread,
} from "@/lib/chatThreadPreference";
import type { Conversation } from "@/types";
import { useTranslations } from "next-intl";

const ChatPage = () => {
  const searchParams = useSearchParams();
  const { conversations, fetchConversations, currentConversation, setCurrentConversation } = useChatStore();
  const { accessToken } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [deepLinkBusy, setDeepLinkBusy] = useState(false);
  const [threadPickerGroup, setThreadPickerGroup] = useState<ParticipantChatGroup | null>(null);
  const t = useTranslations("chat");

  useEffect(() => {
    fetchConversations();

    const token = getStoredAccessToken()?.trim() || accessToken?.trim();
    if (token) {
      chatSocketManager.connect(token);
    }
  }, [fetchConversations, accessToken]);

  useEffect(() => {
    const ids = conversations
      .map((c) => String(c.conversationId ?? c.id ?? "").trim())
      .filter(Boolean);
    chatSocketManager.syncConversationSubscriptions(ids);
    return () => {
      chatSocketManager.syncConversationSubscriptions([]);
    };
  }, [conversations]);

  useEffect(() => {
    const artisanId = searchParams.get("artisanId");
    const name = searchParams.get("name");
    const bookingId = searchParams.get("bookingId");

    if (!artisanId?.trim() || !name?.trim()) {
      setDeepLinkBusy(false);
      return;
    }

    let cancelled = false;
    setDeepLinkBusy(true);

    void (async () => {
      try {
        const store = useChatStore.getState();
        const conv = bookingId?.trim()
          ? await store.ensureChatConversationForBooking({
              bookingId: bookingId.trim(),
              otherUserId: artisanId.trim(),
              displayName: name.trim(),
              displayAvatar: "/images/pro.jpg",
            })
          : await store.ensureChatConversationForParticipant({
              otherUserId: artisanId.trim(),
              displayName: name.trim(),
              displayAvatar: "/images/pro.jpg",
            });
        if (cancelled) return;
        if (conv) {
          if (conv.otherParticipant?.id) {
            rememberPreferredChatThread(conv.otherParticipant.id, conv);
          }
          setCurrentConversation(conv);
        } else {
          setCurrentConversation(null);
          toast.error(t("openConversationError"));
        }
      } finally {
        if (!cancelled) setDeepLinkBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setCurrentConversation]);

  const chatGroups = groupConversationsByParticipant(conversations);
  const filteredGroups = filterChatGroups(chatGroups, searchQuery);

  const selectThread = (thread: Conversation, participantId: string) => {
    rememberPreferredChatThread(participantId, thread);
    setCurrentConversation(thread);
  };

  const openGroup = (group: ParticipantChatGroup) => {
    const thread = resolvePreferredChatThread(group.participantId, group.threads);
    selectThread(thread, group.participantId);
  };

  const openThread = (thread: Conversation) => {
    setThreadPickerGroup(null);
    const participantId =
      threadPickerGroup?.participantId ?? thread.otherParticipant?.id ?? "";
    if (participantId) {
      selectThread(thread, participantId);
    } else {
      setCurrentConversation(thread);
    }
  };

  const currentThreadGroup = currentConversation?.otherParticipant?.id
    ? chatGroups.find((g) => g.participantId === currentConversation.otherParticipant?.id)
    : undefined;

  return (
    <main className="relative min-h-screen bg-white pb-32 md:pb-0">
      <div className="hidden md:block max-w-4xl mx-auto pt-6 px-4 md:px-0 lg:px-0">
        <Navbar />
      </div>
      <div className="px-5 pt-16 md:pt-8 pb-4 max-w-4xl mx-auto">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-[20px] font-gerat font-[850] text-[rgba(0,0,0,0.8)] tracking-[-0.03em]">
               {t("title")}
            </h1>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <MoreHorizontal size={20} className="text-gray-500" />
            </button>
         </div>

         {deepLinkBusy && (
            <p className="text-[13px] font-poppins text-[#667085] mb-4 -mt-2">{t("openingConversation")}</p>
         )}

         <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
               type="text"
               placeholder={t("searchPlaceholder")}
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-3.5 bg-[#F6F6F6] rounded-[14px] text-[14px] font-poppins focus:outline-none placeholder:text-gray-400 border border-transparent focus:border-gray-200 transition-all shadow-sm"
            />
         </div>

         <div className="space-y-2">
            {filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center opacity-40">
                    <UserIcon size={48} className="mb-4 text-gray-300" />
                    <p className="text-[14px] font-poppins">{t("noMessagesYet")}</p>
                </div>
            ) : filteredGroups.map((group) => {
               const preview = group.previewThread;
               const contextLabel = getConversationContextLabel(preview);
               const multiThread = group.threads.length > 1;

               return (
               <button
                  key={group.participantId}
                  onClick={() => openGroup(group)}
                  className="w-full flex items-center gap-[14px] p-3.5 rounded-[18px] hover:bg-gray-50 transition-all border border-transparent active:scale-[0.98]"
               >
                  <div className="relative shrink-0">
                     <div className="w-[56px] h-[56px] rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-50">
                        {group.participant.avatar ? (
                           <Image 
                              src={group.participant.avatar} 
                              alt={group.participant.name} 
                              fill 
                              className="object-cover rounded-full" 
                           />
                        ) : (
                           <UserIcon size={24} className="text-gray-400" />
                        )}
                     </div>
                     <ChatListPresenceDot chat={preview} />
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                     <div className="flex justify-between items-center mb-0.5 gap-2">
                        <h3 className="text-[15px] font-poppins font-bold text-[rgba(0,0,0,0.8)] truncate">
                           {group.participant.name}
                        </h3>
                        <span className="text-[11px] font-poppins text-[#98A2B3] shrink-0">
                           {preview.lastMessageAt ? new Date(preview.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                     </div>
                     <p className="text-[11px] font-poppins text-[#98A2B3] truncate mb-0.5">
                        {multiThread
                          ? t("multiThreadLabel", { count: group.threads.length, contextLabel })
                          : contextLabel}
                     </p>
                     <div className="flex justify-between items-center">
                        <p className={`text-[13px] font-poppins truncate pr-6 ${group.totalUnread ? 'text-black font-semibold' : 'text-[#667085]'}`}>
                           {preview.lastMessage || t("startConversation")}
                        </p>
                        {group.totalUnread > 0 && (
                           <span className="bg-brand-orange text-white text-[10px] font-bold min-w-[18px] h-4.5 flex items-center justify-center rounded-full px-1.5 shadow-sm">
                              {group.totalUnread}
                           </span>
                        )}
                     </div>
                  </div>
               </button>
            )})}
         </div>
      </div>

      {threadPickerGroup && (
        <ChatThreadPickerSheet
          participantName={threadPickerGroup.participant.name}
          threads={threadPickerGroup.threads}
          onSelect={openThread}
          onClose={() => setThreadPickerGroup(null)}
          isSwitchMode={!!currentConversation}
        />
      )}

      {currentConversation && (
        <ChatInterface 
          isOpen={!!currentConversation} 
          onClose={() => setCurrentConversation(null)} 
          conversation={currentConversation}
          canSwitchThread={(currentThreadGroup?.threads.length ?? 0) > 1}
          onSwitchThread={() => {
            if (currentThreadGroup) setThreadPickerGroup(currentThreadGroup);
          }}
        />
      )}

      <UserNav />
    </main>
  );
};

export default ChatPage;
