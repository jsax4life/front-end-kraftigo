"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, ChevronRight, User as UserIcon, MoreHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import UserNav from "@/components/shared/userNav";
import Navbar from "@/components/shared/Navbar";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getStoredAccessToken } from "@/lib/axios";
import { chatSocketManager } from "@/lib/socket";
import ChatInterface from "@/components/support/ChatInterface";
import ChatListPresenceDot from "@/components/shared/ChatListPresenceDot";

const ChatPage = () => {
  const searchParams = useSearchParams();
  const { conversations, fetchConversations, currentConversation, setCurrentConversation } = useChatStore();
  const { accessToken } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [deepLinkBusy, setDeepLinkBusy] = useState(false);

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
        const conv = await useChatStore.getState().ensureChatConversationForParticipant({
          otherUserId: artisanId.trim(),
          displayName: name.trim(),
          displayAvatar: "/images/pro.jpg",
          bookingId,
        });
        if (cancelled) return;
        if (conv) {
          setCurrentConversation(conv);
        } else {
          setCurrentConversation(null);
          toast.error(
            "Could not open this conversation yet. Open Messages from your Kraft, or try again in a moment.",
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

  const filteredChats = conversations.filter(chat => 
    chat.otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="relative min-h-screen bg-white pb-32 md:pb-0">
      <div className="hidden md:block max-w-4xl mx-auto pt-6 px-4 md:px-0 lg:px-0">
        <Navbar />
      </div>
      <div className="px-5 pt-16 md:pt-8 pb-4 max-w-4xl mx-auto">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-[20px] font-gerat font-[850] text-[rgba(0,0,0,0.8)] tracking-[-0.03em]">
               Messages
            </h1>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <MoreHorizontal size={20} className="text-gray-500" />
            </button>
         </div>

         {deepLinkBusy && (
            <p className="text-[13px] font-poppins text-[#667085] mb-4 -mt-2">Opening conversation…</p>
         )}

         {/* Search */}
         <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
               type="text"
               placeholder="Search messages"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full pl-11 pr-4 py-3.5 bg-[#F6F6F6] rounded-[14px] text-[14px] font-poppins focus:outline-none placeholder:text-gray-400 border border-transparent focus:border-gray-200 transition-all shadow-sm"
            />
         </div>

         {/* Chat List */}
         <div className="space-y-2">
            {filteredChats.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-center opacity-40">
                    <UserIcon size={48} className="mb-4 text-gray-300" />
                    <p className="text-[14px] font-poppins">No messages yet</p>
                </div>
            ) : filteredChats.map((chat) => (
               <button
                  key={chat.conversationId || chat.id}
                  onClick={() => setCurrentConversation(chat)}
                  className="w-full flex items-center gap-[14px] p-3.5 rounded-[18px] hover:bg-gray-50 transition-all border border-transparent active:scale-[0.98]"
               >
                  <div className="relative shrink-0">
                     <div className="w-[56px] h-[56px] rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-50">
                        {chat.otherParticipant?.avatar ? (
                           <Image 
                              src={chat.otherParticipant.avatar} 
                              alt={chat.otherParticipant.name} 
                              fill 
                              className="object-cover rounded-full" 
                           />
                        ) : (
                           <UserIcon size={24} className="text-gray-400" />
                        )}
                     </div>
                     <ChatListPresenceDot chat={chat} />
                  </div>
                  
                  <div className="flex-1 min-w-0 text-left">
                     <div className="flex justify-between items-center mb-0.5">
                        <h3 className="text-[15px] font-poppins font-bold text-[rgba(0,0,0,0.8)] truncate">
                           {chat.otherParticipant?.name}
                        </h3>
                        <span className="text-[11px] font-poppins text-[#98A2B3]">
                           {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                     </div>
                     <div className="flex justify-between items-center">
                        <p className={`text-[13px] font-poppins truncate pr-6 ${chat.unreadCount ? 'text-black font-semibold' : 'text-[#667085]'}`}>
                           {chat.lastMessage || "Start the conversation"}
                        </p>
                        {(chat.unreadCount || 0) > 0 && (
                           <span className="bg-brand-orange text-white text-[10px] font-bold min-w-[18px] h-4.5 flex items-center justify-center rounded-full px-1.5 shadow-sm">
                              {chat.unreadCount}
                           </span>
                        )}
                     </div>
                  </div>
               </button>
            ))}
         </div>
      </div>

      {currentConversation && (
        <ChatInterface 
          isOpen={!!currentConversation} 
          onClose={() => setCurrentConversation(null)} 
          conversation={currentConversation}
        />
      )}

      <UserNav />
    </main>
  );
};

export default ChatPage;
