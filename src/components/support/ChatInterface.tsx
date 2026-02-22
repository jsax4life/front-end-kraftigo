"use client";

import { X, ArrowLeft, Plus, Send, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { chatSocketManager } from "@/lib/socket";
import { Conversation, Message } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
}

const ChatInterface = ({ isOpen, onClose, conversation }: ChatInterfaceProps) => {
  const [messageContent, setMessageContent] = useState("");
  const { messages, fetchMessages, sendMessage, isLoading } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = conversation?.id || conversation?.conversationId;

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchMessages(conversationId);
      chatSocketManager.joinConversation(conversationId);
    }
    
    return () => {
      if (conversationId) {
        chatSocketManager.leaveConversation(conversationId);
      }
    };
  }, [isOpen, conversationId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !conversationId) return;
    
    try {
      await sendMessage(conversationId, messageContent);
      setMessageContent("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  if (!isOpen || !conversation) return null;

  const otherParticipant = conversation.otherParticipant;

  return (
    <div className="fixed inset-0 z-100 bg-white flex flex-col h-full animate-in slide-in-from-bottom duration-300 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6 border-b border-[#F2F4F7]">
        <button onClick={onClose} className="hover:opacity-70">
          <ArrowLeft className="w-6 h-6 text-[#1D2939]" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[18px] font-gerat font-bold text-[#1D2939]">{otherParticipant?.name}</span>
        </div>
        <button onClick={onClose} className="hover:opacity-70">
          <X className="w-6 h-6 text-[#1D2939]" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 flex flex-col pt-4 pb-4">
        {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center py-6 space-y-2">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {otherParticipant?.avatar ? (
                    <Image src={otherParticipant.avatar} alt={otherParticipant.name} fill className="object-cover" />
                  ) : (
                    <UserIcon size={32} className="text-gray-400" />
                  )}
                </div>
                <h2 className="text-[16px] font-gerat font-bold text-[#1D2939]">Start a chat with {otherParticipant?.name}</h2>
                <p className="text-[12px] text-[#667085] font-poppins">Send your first message to begin the conversation.</p>
            </div>
        )}

        {/* Dynamic messages */}
        {[...messages].reverse().map((msg) => {
          const isMe = msg.sender.id === user?.id;
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-[14px] font-poppins ${
                isMe ? 'bg-brand-blue text-white rounded-tr-none' : 'bg-[#F2F4F7] text-[#1D2939] rounded-tl-none'
              }`}>
                {msg.content}
              </div>
              <span className="text-[10px] text-[#667085] mt-1 font-poppins">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-[#F2F4F7] pb-10">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-[#F2F4F7] flex items-center justify-center hover:bg-gray-200 transition-colors">
            <Plus className="w-5 h-5 text-[#667085]" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Send a message"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full bg-[#F2F4F7] rounded-full py-3 px-6 text-[14px] font-poppins outline-none focus:ring-1 focus:ring-brand-blue"
            />
            {messageContent.trim() && (
              <button 
                onClick={handleSendMessage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brand-blue flex items-center justify-center text-white"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
