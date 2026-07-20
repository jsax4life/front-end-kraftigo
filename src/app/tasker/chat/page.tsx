"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, ChevronRight, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import TaskerNav from "@/components/shared/taskerNav";
import Header from "@/components/shared/Header";
import ChatInterface from "@/components/support/ChatInterface";
import ChatListPresenceDot from "@/components/shared/ChatListPresenceDot";
import ChatThreadPickerSheet from "@/components/shared/ChatThreadPickerSheet";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getStoredAccessToken } from "@/lib/axios";
import { chatSocketManager } from "@/lib/socket";
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

const ChatPageContent = () => {
  const searchParams = useSearchParams();
  const { conversations, fetchConversations, currentConversation, setCurrentConversation } = useChatStore();
  const { accessToken } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [deepLinkBusy, setDeepLinkBusy] = useState(false);
  const [threadPickerGroup, setThreadPickerGroup] = useState<ParticipantChatGroup | null>(null);

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
    const userId = searchParams.get("userId");
    const name = searchParams.get("name");
    const bookingId = searchParams.get("bookingId");

    if (!userId?.trim() || !name?.trim()) {
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
              otherUserId: userId.trim(),
              displayName: name.trim(),
              displayAvatar: "/images/abt.jpg",
            })
          : await store.ensureChatConversationForParticipant({
              otherUserId: userId.trim(),
              displayName: name.trim(),
              displayAvatar: "/images/abt.jpg",
            });
        if (cancelled) return;
        if (conv) {
          if (conv.otherParticipant?.id) {
            rememberPreferredChatThread(conv.otherParticipant.id, conv);
          }
          setCurrentConversation(conv);
        } else {
          setCurrentConversation(null);
          toast.error(
            "Could not open this conversation yet. Open Messages from the request, or try again in a moment.",
          );
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
    <main className="min-h-screen bg-white pb-24">
      <Header title="Customer Messages" showLogout={true} showBack={false} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {deepLinkBusy && (
          <p className="text-[13px] font-poppins text-[#667085] mb-4">Opening conversation…</p>
        )}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#667085]" size={20} />
          <input
            type="text"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[#F2F4F7] rounded-xl text-[14px] font-poppins focus:outline-none focus:ring-1 focus:ring-brand-orange"
          />
        </div>

        <div className="space-y-1">
          {filteredGroups.map((group) => {
            const preview = group.previewThread;
            const contextLabel = getConversationContextLabel(preview);
            const multiThread = group.threads.length > 1;

            return (
            <button
              key={group.participantId}
              onClick={() => openGroup(group)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0"
            >
              <div className="relative shrink-0 w-14 h-14">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                  {group.participant.avatar ? (
                    <Image src={group.participant.avatar} alt={group.participant.name} fill className="object-cover" />
                  ) : (
                    <UserIcon size={24} className="text-gray-400" />
                  )}
                </div>
                <ChatListPresenceDot chat={preview} />
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-1 gap-2">
                  <h3 className="text-[16px] font-gerat font-bold text-[#1D2939] truncate">
                    {group.participant.name}
                  </h3>
                  <span className="text-[12px] font-poppins text-[#667085] shrink-0">
                    {preview.lastMessageAt ? new Date(preview.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="text-[11px] font-poppins text-[#98A2B3] truncate mb-1">
                  {multiThread
                    ? `${group.threads.length} Kraft conversations · ${contextLabel}`
                    : contextLabel}
                </p>
                <div className="flex justify-between items-center">
                  <p className={`text-[14px] font-poppins truncate pr-4 ${group.totalUnread ? 'text-black font-semibold' : 'text-[#667085]'}`}>
                    {preview.lastMessage || "No messages yet"}
                  </p>
                  {group.totalUnread > 0 && (
                    <span className="bg-brand-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {group.totalUnread}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-[#D0D5DD] shrink-0" />
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

      <TaskerNav />
    </main>
  );
};

const ChatPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading chat...</div>}>
      <ChatPageContent />
    </Suspense>
  );
};

export default ChatPage;
