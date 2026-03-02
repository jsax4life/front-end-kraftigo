"use client";

import { Phone, PhoneOff, Bluetooth, MicOff, Volume2 } from "lucide-react";
import Image from "next/image";

interface CallScreenProps {
  onEndCall: () => void;
  participant: {
    name: string;
    avatar?: string;
  };
}

const CallScreen = ({ onEndCall, participant }: CallScreenProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-full items-center pt-20 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 mb-12 text-gray-500 font-poppins text-[16px]">
        <Phone size={20} className="rotate-12" />
        <span>12:22</span>
      </div>

      <div className="relative w-40 h-40 rounded-full overflow-hidden bg-gray-100 mb-8 border border-gray-100 shadow-md">
        {participant.avatar ? (
          <Image src={participant.avatar} alt={participant.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl font-bold">
            {participant.name.charAt(0)}
          </div>
        )}
      </div>

      <h2 className="text-[32px] font-poppins font-bold text-[#1D2939] mb-24">{participant.name}</h2>

      <div className="flex justify-around w-full max-w-sm mb-32">
        <CallAction icon={Bluetooth} label="Bluetooth" />
        <CallAction icon={MicOff} label="Mute" />
        <CallAction icon={Volume2} label="Speaker" active />
      </div>

      <button 
        onClick={onEndCall}
        className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
      >
        <PhoneOff size={32} className="rotate-[-135deg]" />
      </button>
    </div>
  );
};

const CallAction = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <div className="flex flex-col items-center gap-3">
    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
      active ? 'bg-brand-orange text-white' : 'bg-[#FAFAFA] border border-[#EEEEEE] text-gray-800'
    }`}>
      <Icon size={24} />
    </div>
    <span className="text-[14px] font-poppins text-gray-600 font-medium">{label}</span>
  </div>
);

export default CallScreen;
