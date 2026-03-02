"use client";

import { X, Search, MapPin, Navigation, ArrowLeft } from "lucide-react";
import Image from "next/image";

interface LocationPickerProps {
  onClose: () => void;
  onSelect: (location: string) => void;
}

const LocationPicker = ({ onClose, onSelect }: LocationPickerProps) => {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col h-full animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        <button onClick={onClose} className="text-[16px] font-poppins text-gray-600">Cancel</button>
        <h3 className="text-[16px] font-poppins font-bold">Send Location</h3>
        <div className="w-10"></div>
      </div>

      <div className="px-5 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Berlin" 
            className="w-full bg-white border border-brand-orange rounded-[10px] py-3 pl-12 pr-10 text-[15px] font-poppins outline-none"
            defaultValue="Berlin"
          />
          <X className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer" size={20} />
        </div>
      </div>

      <div className="px-5 mb-4">
        <button className="w-full border border-gray-200 rounded-[10px] py-4 flex items-center justify-center gap-3 bg-white active:bg-gray-50 transition-colors">
          <Navigation className="text-gray-500" size={20} />
          <span className="text-[14px] font-poppins font-medium">Send your current location</span>
        </button>
      </div>

      {/* Map Placeholder */}
      <div className="relative w-full h-[250px] border-y border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden">
         <Image 
            src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&h=400&fit=crop" 
            alt="Map" 
            fill 
            className="object-cover opacity-80"
         />
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-brand-orange/20 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-brand-orange rounded-full border-2 border-white"></div>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          <LocationItem 
            title="Berlin, Germany" 
            subtitle="City" 
            onClick={() => onSelect("Berlin, Germany")}
          />
          <LocationItem 
            title="Berlin House" 
            subtitle="11 Rest house Rd, 004543, Berlin, Germany" 
            onClick={() => onSelect("Berlin House")}
          />
          <LocationItem 
            title="Berlin Shop" 
            subtitle="11 Rest house Rd, 004543, Berlin, Germany" 
            onClick={() => onSelect("Berlin Shop")}
          />
          <LocationItem 
            title="Berlin Camp" 
            subtitle="11 Rest house Rd, 004543, Berlin, Germany" 
            onClick={() => onSelect("Berlin Camp")}
          />
        </div>
      </div>
    </div>
  );
};

const LocationItem = ({ title, subtitle, onClick }: { title: string, subtitle: string, onClick: () => void }) => (
  <button onClick={onClick} className="w-full px-5 py-4 flex flex-col items-start gap-1 hover:bg-gray-50 transition-colors text-left">
    <span className="text-[15px] font-poppins font-medium text-gray-900">{title}</span>
    <span className="text-[12px] font-poppins text-gray-500">{subtitle}</span>
  </button>
);

export default LocationPicker;
