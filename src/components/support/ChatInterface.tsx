"use client";

import { X, ArrowLeft, Plus, Send, User as UserIcon, Phone, Camera, Folder, MapPin, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useChatStore } from "@/store/useChatStore";
import { chatSocketManager } from "@/lib/socket";
import { Conversation, Message } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { getConversationContextLabel } from "@/lib/chatInbox";

// Mock Screens
import LocationPicker from "./mock-screens/LocationPicker";
import CallScreen from "./mock-screens/CallScreen";
import ArtisanProfileView from "./mock-screens/ArtisanProfileView";

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation | null;
  /** When the same person has multiple Kraft threads, show a switch control */
  canSwitchThread?: boolean;
  onSwitchThread?: () => void;
}

type MockScreen = 'none' | 'location' | 'call' | 'profile';

const ChatInterface = ({
  isOpen,
  onClose,
  conversation,
  canSwitchThread = false,
  onSwitchThread,
}: ChatInterfaceProps) => {
  const [messageContent, setMessageContent] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [activeMockScreen, setActiveMockScreen] = useState<MockScreen>('none');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const { messages, fetchMessages, sendMessage } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversationId = conversation?.id || conversation?.conversationId;

  const displayMessages = messages;

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    /** Join ASAP so `new_message` is not missed while history fetch is still in flight. */
    chatSocketManager.joinConversation(conversationId);
    let cancelled = false;
    void fetchMessages(conversationId)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          chatSocketManager.joinConversation(conversationId);
        }
      });
    return () => {
      cancelled = true;
      chatSocketManager.leaveConversation(conversationId);
    };
  }, [isOpen, conversationId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  const handleSendMessage = async (content: string = messageContent) => {
    if (isSendingMessage || conversation?.isLocked) return;
    const finalContent = content || messageContent;
    if (!finalContent.trim() || !conversationId) return;
    
    setIsSendingMessage(true);
    try {
      await sendMessage(conversationId, finalContent);
      setMessageContent("");
      setShowAttachments(false);
    } catch (error) {
       console.error("Failed to send message", error);
       setMessageContent("");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleLocationSelect = (location: string) => {
    handleSendMessage(`My Location: ${location}`);
    setActiveMockScreen('none');
  };

  if (!isOpen || !conversation) return null;

  const otherParticipant = conversation.otherParticipant;
  const contextLabel = getConversationContextLabel(conversation);

  return (
    <>
      <div className="fixed inset-x-0 top-0 bottom-[96px] z-60 bg-[#F9FAFB] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header - Centered Style */}
        <div className="flex flex-col items-center bg-white border-b border-[#F2F4F7] pt-4 pb-4">
          <div className="w-full flex justify-between px-6 mb-2">
              <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-6 h-6 text-[#1D2939]" />
              </button>
              <button 
                onClick={() => setActiveMockScreen('call')}
                className="p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                  <Phone size={24} />
              </button>
          </div>
          
          <button 
            onClick={() => setActiveMockScreen('profile')}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-sm flex items-center justify-center group-active:scale-95 transition-transform">
                  {otherParticipant?.avatar ? (
                      <Image src={otherParticipant.avatar} alt={otherParticipant.name} fill className="object-cover" />
                  ) : (
                      <UserIcon size={40} className="text-gray-400" />
                  )}
              </div>
              <h3 className="text-[18px] font-gerat font-bold text-[#1D2939] leading-tight mt-1">{otherParticipant?.name}</h3>
          </button>
        </div>

        {/* Kraft / booking context */}
        <div
          className={`px-5 py-2.5 flex flex-col items-center gap-1 shadow-sm ${
            conversation.isLocked ? "bg-[#667085]" : "bg-[#FF6600]"
          }`}
        >
           <span className="text-[11px] font-poppins font-bold text-white text-center">
              {contextLabel}
              {conversation.isLocked ? " · read-only" : ""}
           </span>
           {canSwitchThread && onSwitchThread ? (
             <button
               type="button"
               onClick={onSwitchThread}
               className="text-[10px] font-poppins font-semibold text-white/90 underline underline-offset-2 hover:text-white"
             >
               Switch Kraft
             </button>
           ) : null}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 space-y-6 flex flex-col pt-6 pb-6 scrollbar-hide">
          {displayMessages.length > 0 && (
              <div className="flex flex-col items-center space-y-6">
                  {/* Date Badge */}
                  <div className="px-3 py-1 bg-[#F2F4F7] rounded-lg">
                      <span className="text-[11px] font-poppins font-semibold text-[#667085]">Jan 22, 2026</span>
                  </div>
                  
                  {/* System Message */}
                  <div className="flex justify-center w-full">
                      <p className="text-[13px] font-poppins italic text-brand-blue font-semibold text-center leading-relaxed max-w-[80%]">
                          You accepted {otherParticipant?.name?.split('.')[0]}`s offer at 45$
                      </p>
                  </div>
              </div>
          )}

          {/* Dynamic messages */}
          {[...displayMessages].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((msg, index, array) => {
            const isMe = msg.sender.id === user?.id || msg.sender.id === 'me' || msg.sender.id === 'user-me';
            
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1`}
              >
                <div className={`max-w-[75%] rounded-[12px] px-4 py-3 text-[14px] font-poppins leading-relaxed shadow-sm ${
                  isMe 
                  ? 'bg-[#EBEBFF] text-[#1D2939]' 
                  : 'bg-[#F2F4F7] text-[#1D2939]'
                }`}>
                  {msg.content}
                  <div className={`text-[9px] text-gray-400 mt-1 flex justify-end font-poppins`}>
                     {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area & Attachment Grid */}
        <div className="px-5 pt-4 bg-white border-t border-[#F2F4F7] pb-2">
          {conversation.isLocked ? (
            <p className="text-center text-[13px] font-poppins text-[#667085] py-4">
              This Kraft is finished — this thread is read-only.
            </p>
          ) : (
          <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 flex items-center bg-[#FAFAFA] border border-[#EEEEEE] rounded-[14px] px-4 shadow-sm focus-within:border-brand-orange transition-colors">
                  <button 
                    onClick={() => setShowAttachments(!showAttachments)}
                    className={`p-1 rounded-full transition-all ${showAttachments ? 'rotate-45 text-brand-orange' : 'text-gray-400'}`}
                  >
                      <Plus size={24} />
                  </button>
                  <input
                      type="text"
                      placeholder="Send a message"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (!isSendingMessage) void handleSendMessage();
                      }}
                      className="flex-1 bg-transparent py-4 px-2 text-[14px] font-poppins outline-none text-[#1D2939] placeholder:text-[#999999]"
                  />
                  <button 
                      onClick={() => {
                        if (!isSendingMessage) void handleSendMessage();
                      }}
                      disabled={!messageContent.trim() || isSendingMessage}
                      className={`transition-all ${messageContent.trim() && !isSendingMessage ? 'text-brand-orange' : 'text-gray-300'}`}
                  >
                      <Send size={24} />
                  </button>
              </div>
          </div>
          )}

          {/* Attachment Grid (WhatsApp Style Collapsible) */}
          {showAttachments && !conversation.isLocked && (
              <div className="grid grid-cols-3 gap-4 pt-6 pb-2 animate-in slide-in-from-bottom duration-200">
                  <button className="flex flex-col items-center gap-2 group">
                      <div className="w-16 h-16 rounded-full border border-[#EEEEEE] flex items-center justify-center text-[#FF6600] active:scale-95 transition-transform shadow-sm bg-white">
                          <Camera size={26} />
                      </div>
                      <span className="text-[12px] font-poppins text-[#444444] font-medium">Camera</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 group">
                      <div className="w-16 h-16 rounded-full border border-[#EEEEEE] flex items-center justify-center text-blue-600 active:scale-95 transition-transform shadow-sm bg-white">
                          <Folder size={26} />
                      </div>
                      <span className="text-[12px] font-poppins text-[#444444] font-medium">Photos</span>
                  </button>
                  <button 
                    onClick={() => {
                        setActiveMockScreen('location');
                        setShowAttachments(false);
                    }}
                    className="flex flex-col items-center gap-2 group"
                  >
                      <div className="w-16 h-16 rounded-full border border-[#EEEEEE] flex items-center justify-center text-red-500 active:scale-95 transition-transform shadow-sm bg-white">
                          <MapPin size={26} />
                      </div>
                      <span className="text-[12px] font-poppins text-[#444444] font-medium">Location</span>
                  </button>
              </div>
          )}
        </div>

        <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
      </div>

      {/* Mock Overlays */}
      {activeMockScreen === 'location' && (
        <LocationPicker 
          onClose={() => setActiveMockScreen('none')} 
          onSelect={handleLocationSelect}
        />
      )}

      {activeMockScreen === 'call' && (
        <CallScreen 
          onEndCall={() => setActiveMockScreen('none')}
          participant={{
             name: otherParticipant?.name || "Artisan",
             avatar: otherParticipant?.avatar
          }}
        />
      )}

      {activeMockScreen === 'profile' && (
        <ArtisanProfileView 
          onClose={() => setActiveMockScreen('none')}
          artisan={{
             name: otherParticipant?.name || "Artisan",
             avatar: otherParticipant?.avatar
          }}
        />
      )}
    </>
  );
};

export default ChatInterface;
