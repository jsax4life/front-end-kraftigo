"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Search, ChevronRight, User as UserIcon } from "lucide-react";
import UserNav from "@/components/shared/userNav";
import Header from "@/components/shared/Header";
import ChatInterface from "@/components/support/ChatInterface";
import { useChatStore } from "@/store/useChatStore";
import { useAuthStore } from "@/store/useAuthStore";
import { chatSocketManager } from "@/lib/socket";
import { Conversation } from "@/types";

const ChatPage = () => {
  const searchParams = useSearchParams();
  const { conversations, fetchConversations, currentConversation, setCurrentConversation } = useChatStore();
  const { accessToken } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchConversations();
    
    if (accessToken) {
      chatSocketManager.connect(accessToken);
    }
    
    return () => {
      // We might not want to disconnect globally on every unmount if the user just switches tabs,
      // but if they leave the chat section it's okay.
    };
  }, [fetchConversations, accessToken]);

  useEffect(() => {
    const artisanId = searchParams.get("artisanId");
    const name = searchParams.get("name");
    
    if (artisanId && name) {
      // Find existing conversation or create a temporary one for the interface to handle
      const existing = conversations.find(c => c.otherParticipant?.id === artisanId);
      if (existing) {
        setCurrentConversation(existing);
      } else {
        setCurrentConversation({
          conversationId: artisanId, // Temporary ID or we can handle creation in ChatInterface
          otherParticipant: {
            id: artisanId,
            name: name,
            avatar: "/images/pro.jpg"
          },
          isLocked: false,
          unreadCount: 0
        } as Conversation);
      }
    }
  }, [searchParams, conversations, setCurrentConversation]);

  const filteredChats = conversations.filter(chat => 
    chat.otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-white pb-24">
      <Header title="Messages" showLogout={true} showBack={false} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Search */}
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

        {/* Chat List */}
        <div className="space-y-1">
          {filteredChats.map((chat) => (
            <button
              key={chat.conversationId || chat.id}
              onClick={() => setCurrentConversation(chat)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {chat.otherParticipant?.avatar ? (
                    <Image 
                        src={chat.otherParticipant.avatar} 
                        alt={chat.otherParticipant.name} 
                        fill 
                        className="object-cover" 
                    />
                  ) : (
                    <UserIcon size={24} className="text-gray-400" />
                  )}
                </div>
                {/* Online status isn't provided by REST API list, usually handled via WS */}
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00A651] border-2 border-white rounded-full"></div>
              </div>
              
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-[16px] font-gerat font-bold text-[#1D2939] truncate">
                    {chat.otherParticipant?.name}
                  </h3>
                  <span className="text-[12px] font-poppins text-[#667085]">
                     {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-poppins text-[#667085] truncate pr-4">
                    {chat.lastMessage || "No messages yet"}
                  </p>
                  {(chat.unreadCount || 0) > 0 && (
                    <span className="bg-brand-orange text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-[#D0D5DD]" />
            </button>
          ))}
        </div>
      </div>

      {/* Detail Chat Interface */}
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
