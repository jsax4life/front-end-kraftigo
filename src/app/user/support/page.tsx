"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import UserNav from "@/components/shared/userNav";
import SupportHeader from "@/components/support/SupportHeader";
import KraftStatusCard from "@/components/support/KraftStatusCard";
import HelpBanner from "@/components/support/HelpBanner";
import HelpTopicItem from "@/components/support/HelpTopicItem";
import ChatInterface from "@/components/support/ChatInterface";
import { useChatStore } from "@/store/useChatStore";
import { useBookingsStore } from "@/store/useBookingsStore";
import type { Booking } from "@/types";
import { bookingArtisanName } from "@/lib/bookingDisplay";

// Map API booking status to KraftStatusCard display status
const toDisplayStatus = (status: Booking["status"]): "Completed" | "In Progress" | "Cancelled" | "Upcoming" => {
  if (status === "COMPLETED") return "Completed";
  if (status === "IN_PROGRESS") return "In Progress";
  if (status === "CANCELLED" || status === "DISPUTED") return "Cancelled";
  return "Upcoming";
};

const helpTopics = [
  "How do I cancel a booking?",
  "How do I report a problem with a Krafter?",
  "How do I request a refund?",
  "What happens if a Krafter doesn't show up?",
  "How do I update my payment method?",
];

const Page = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { setCurrentConversation, currentConversation, conversations, fetchConversations } = useChatStore();
  const { bookings, fetchMyBookings } = useBookingsStore();

  useEffect(() => {
    fetchConversations();
    fetchMyBookings();
  }, []);

  // Take the 3 most recent bookings as "recent krafts"
  const recentKrafts = bookings.slice(0, 3).map((b) => ({
    title: b.service?.title ?? "Service",
    artisan: bookingArtisanName(b),
    date: b.scheduled_date
      ? new Date(b.scheduled_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : b.created_at
      ? new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : "—",
    status: toDisplayStatus(b.status),
  }));

  const handleOpenChat = (conv?: any) => {
    if (conv) {
      setCurrentConversation(conv);
    } else {
      setCurrentConversation({
        conversationId: "support-general",
        otherParticipant: {
          id: "support-agent",
          name: "Support Agent",
          avatar: "/images/pro.jpg",
        },
        isLocked: false,
        unreadCount: 0,
      } as any);
    }
    setIsChatOpen(true);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-32">
      <div className="">
        <SupportHeader />

        {/* Recent Chats */}
        {conversations.length > 0 && (
          <div className="mb-8 px-4 sm:px-6 lg:px-8 mt-8">
            <h2 className="text-[14px] text-[#667085] font-poppins mb-4">Recent Chats</h2>
            {conversations.slice(0, 3).map((conv: any) => (
              <button
                key={conv.id ?? conv.conversationId}
                onClick={() => handleOpenChat(conv)}
                className="w-full flex items-center gap-3 p-4 bg-white border border-[#F2F4F7] rounded-xl hover:bg-gray-50 transition-all text-left mb-2"
              >
                <div className="relative w-12 h-12">
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <Image
                      src={conv.otherParticipant?.avatar ?? "/images/pro.jpg"}
                      alt={conv.otherParticipant?.name ?? ""}
                      fill
                      className="object-cover"
                    />
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="absolute top-0 -left-1 w-2.5 h-2.5 bg-brand-blue rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[16px] font-gerat font-bold text-[#1D2939]">
                      {conv.otherParticipant?.name}
                    </span>
                    <span className="text-[12px] text-[#98A2B3] font-poppins">
                      {conv.lastMessageAt ? formatTime(conv.lastMessageAt) : ""}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#667085] font-poppins truncate line-clamp-1">
                    {conv.lastMessage ?? ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Recent Krafts */}
        <div className="space-y-4 px-4 sm:px-6 lg:px-8">
          <h2 className="text-[14px] text-[#667085] font-poppins">Need support on a recent Kraft</h2>
          {recentKrafts.length === 0 ? (
            <p className="text-[13px] font-poppins text-gray-300 py-4">No recent krafts to show</p>
          ) : (
            <div className="space-y-1">
              {recentKrafts.map((kraft, i) => (
                <KraftStatusCard key={i} {...kraft} />
              ))}
            </div>
          )}
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
