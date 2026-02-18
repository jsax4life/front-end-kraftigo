"use client";

import { X, Star, MapPin, CheckCircle } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/button";
import { Application } from "@/types";

interface CompareModalProps {
  artisans: Application[];
  onClose: () => void;
  onSelect: (artisan: Application) => void;
}

const CompareModal = ({ artisans, onClose, onSelect }: CompareModalProps) => {
  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-2xl rounded-t-[32px] sm:rounded-[32px] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[20px] font-gerat font-bold px-2">Compare Krafters</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {artisans.map((artisan) => (
            <div key={artisan.id} className="space-y-4 border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative">
                  <Image
                    src={artisan.image}
                    alt={artisan.artisan_name}
                    width={80}
                    height={80}
                    className="rounded-full object-cover w-20 h-20 border-2 border-white shadow-sm"
                  />
                  {artisan.is_top_pro && (
                    <div className="absolute -bottom-1 -right-1 bg-brand-orange text-white p-1 rounded-full border-2 border-white shadow-sm">
                      <CheckCircle size={14} fill="currentColor" className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-[16px] font-gerat font-bold">{artisan.artisan_name}</h3>
                  <div className="flex items-center justify-center gap-1 text-[13px] text-gray-600 font-poppins">
                    <Star size={14} className="text-brand-orange fill-brand-orange" />
                    <span className="font-semibold text-black">{artisan.rating}</span>
                    <span>({artisan.reviews_count} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-[12px] font-poppins text-gray-600">
                  <MapPin size={14} className="text-gray-400" />
                  <span>Berlin, Germany</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] font-poppins text-gray-600">
                  <div className="w-4 h-4 rounded-full bg-brand-orange/10 flex items-center justify-center">
                    <CheckCircle size={10} className="text-brand-orange" />
                  </div>
                  <span>{artisan.tasks_count} tasks completed</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[12px] text-gray-500 font-poppins line-clamp-3 italic">
                  &quot;{artisan.description}&quot;
                </p>
              </div>

              <div className="pt-2">
                 <div className="text-[18px] font-gerat font-bold text-brand-orange mb-3">
                    {artisan.price}
                 </div>
                <Button variant="primary" fullWidth onClick={() => onSelect(artisan)}>
                  Select
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompareModal;
