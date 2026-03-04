"use client";

import { useState } from "react";
import Image from "next/image";
import UserNav from "@/components/shared/userNav";
import SupportHeader from "@/components/support/SupportHeader";
import KraftStatusCard from "@/components/support/KraftStatusCard";
import HelpBanner from "@/components/support/HelpBanner";
import HelpTopicItem from "@/components/support/HelpTopicItem";
import ChatInterface from "@/components/support/ChatInterface";
import { useChatStore } from "@/store/useChatStore";

const Page = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { setCurrentConversation, currentConversation } = useChatStore();
  const { conversations, fetchConversations } = useChatStore();

  const recentKrafts = [
    {
      title: "House Cleaning",
      artisan: "Radika M.",
      date: "15th Jan, 2025 4:00am",
      status: "Completed" as const,
    },
    {
      title: "House Cleaning",
      artisan: "Radika M.",
      date: "15th Jan, 2025 4:00am",
      status: "In Progress" as const,
    },
    {
      title: "House Cleaning",
      artisan: "Radika M.",
      date: "15th Jan, 2025 4:00am",
      status: "Cancelled" as const,
    },
    {
      title: "House Cleaning",
      artisan: "Radika M.",
      date: "15th Jan, 2025 4:00am",
      status: "Upcoming" as const,
    },
  ];

  const helpTopics = [
    "What stood out to you?",
    "What stood out to you?",
    "What stood out to you?",
    "What stood out to you?",
    "What stood out to you?",
  ];

  const recentChats = [
    {
      name: "Tomi",
      time: "6:07 PM",
      message: "Thanks a lot for your patience and understanding with us as we look into...",
      avatar: "/images/pro.jpg",
      unread: true,
    }
  ];

  const handleOpenChat = (chat?: any) => {
    if (chat) {
        // Try to find existing or create temp
        const existing = conversations.find((c: any) => c.otherParticipant?.name === chat.name);
        if (existing) {
            setCurrentConversation(existing);
        } else {
            setCurrentConversation({
                conversationId: 'support-temp',
                otherParticipant: {
                    id: 'support-id',
                    name: chat.name,
                    avatar: chat.avatar
                },
                isLocked: false,
                unreadCount: 0
            } as any);
        }
    } else {
        // General support chat
        setCurrentConversation({
            conversationId: 'support-general',
            otherParticipant: {
                id: 'support-agent',
                name: "Support Agent",
                avatar: "/images/pro.jpg"
            },
            isLocked: false,
            unreadCount: 0
        } as any);
    }
    setIsChatOpen(true);
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-32">
      <div className="">
        <SupportHeader />

        {/* Recent Chats */}
        {recentChats.length > 0 && (
          <div className="mb-8 px-4 sm:px-6 lg:px-8 mt-8">
            <h2 className="text-[14px] text-[#667085] font-poppins mb-4">Recent Chats</h2>
            {recentChats.map((chat, i) => (
              <button 
                key={i} 
                onClick={() => handleOpenChat(chat)}
                className="w-full flex items-center gap-3 p-4 bg-white border border-[#F2F4F7] rounded-xl hover:bg-gray-50 transition-all text-left"
              >
                <div className="relative w-12 h-12">
                   <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image src={chat.avatar} alt={chat.name} fill className="object-cover" />
                   </div>
                   {chat.unread && (
                     <div className="absolute top-0 -left-1 w-2.5 h-2.5 bg-brand-blue rounded-full border-2 border-white"></div>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[16px] font-gerat font-bold text-[#1D2939]">{chat.name}</span>
                    <span className="text-[12px] text-[#98A2B3] font-poppins">{chat.time}</span>
                  </div>
                  <p className="text-[14px] text-[#667085] font-poppins truncate line-clamp-1">
                    {chat.message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Recent Krafts */}
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <h2 className="text-[14px] text-[#667085] font-poppins">Need support on a recent Kraft</h2>
          <div className="space-y-1">
            {recentKrafts.map((kraft, i) => (
              <KraftStatusCard key={i} {...kraft} />
            ))}
          </div>
        </div>

        {/* Need Help Banner */}
        <HelpBanner onSendMessage={() => handleOpenChat()} />

        {/* Help Topics */}
        <div className="space-y-2 pb-8 px-4 sm:px-6 lg:px-8">
          <h2 className="text-[14px] text-[#667085] font-poppins">Help Topics</h2>
          <div className="divide-y divide-[#F2F4F7]">
            {helpTopics.map((topic, i) => (
              <HelpTopicItem key={i} label={topic} onClick={() => {}} />
            ))}
          </div>
          <button className="text-[14px] text-[#667085] font-poppins underline mt-4 hover:text-[#1D2939]">
            See more Help topics
          </button>
        </div>
      </div>

      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => {
            setIsChatOpen(false);
            setCurrentConversation(null);
        }} 
        conversation={currentConversation} 
      />
      <UserNav />
    </main>
  );
};

export default Page;
