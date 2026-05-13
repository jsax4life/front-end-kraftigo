"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Check, Download, Repeat } from "lucide-react";
import Image from "next/image";
import Button from "@/components/ui/button";

const ReceiptPage = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#F9FAFB] flex flex-col px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="max-w-xl mx-auto w-full flex items-center justify-between mb-8 px-2">
        <button onClick={() => router.back()} className="w-12 h-12 flex items-center justify-center bg-white border border-[#F2F4F7] rounded-full shadow-sm hover:bg-gray-50 transition-all">
          <ArrowLeft className="w-6 h-6 text-[#1D2939]" />
        </button>
        <button className="w-12 h-12 flex items-center justify-center bg-white border border-[#F2F4F7] rounded-full shadow-sm hover:bg-gray-50 transition-all">
          <Share2 className="w-5 h-5 text-[#1D2939]" />
        </button>
      </div>

      <div className="flex-1 max-w-xl mx-auto w-full bg-white rounded-[40px] p-8 md:p-10 shadow-[0px_4px_30px_rgba(0,0,0,0.03)] border border-[#F2F4F7] flex flex-col items-center">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-[#E7F8F0] flex items-center justify-center mb-8 relative">
             <div className="w-14 h-14 rounded-full bg-[#00A651] flex items-center justify-center text-white shadow-lg shadow-green-100">
                <Check size={32} strokeWidth={3} />
             </div>
             {/* Sub-pulses could go here for effect */}
        </div>

        <h2 className="text-[18px] font-gerat font-bold text-[#1D2939] mb-1">
          Transaction Successful
        </h2>
        <div className="text-[48px] font-gerat font-[850] text-[#1D2939] mb-10 tracking-tight">
          €840.00
        </div>

        {/* Artisan Info */}
        <div className="w-full flex items-center gap-4 bg-[#F9FAFB] p-5 rounded-3xl mb-10 border border-[#F2F4F7]">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
            <Image src="/images/pro.jpg" alt="Artisan" fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[18px] font-gerat font-bold text-[#1D2939] truncate">Sarah M.</h3>
                <span className="bg-[#00A651] text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Expert</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
                <div className="flex text-[#FFD700] text-[12px]">
                   {"★".repeat(5)}
                </div>
                <span className="text-[12px] text-[#667085] font-poppins font-medium">(4.9) · 128 Reviews</span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="w-full space-y-6 mb-10">
          <h4 className="text-[11px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest ml-1">Price Breakdown</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
               <span className="text-[15px] text-[#667085] font-poppins">House Cleaning Kraft</span>
               <span className="text-[15px] text-[#1D2939] font-poppins font-bold">€750.00</span>
            </div>
            <div className="flex justify-between items-center px-1">
               <span className="text-[15px] text-[#667085] font-poppins">Service Fee</span>
               <span className="text-[15px] text-[#1D2939] font-poppins font-bold">€50.00</span>
            </div>
            <div className="flex justify-between items-center px-1 font-medium">
               <span className="text-[15px] text-[#667085] font-poppins">Taxes</span>
               <span className="text-[15px] text-[#1D2939] font-poppins font-bold">€40.00</span>
            </div>
            <div className="pt-6 border-t border-dashed border-[#EAECF0] flex justify-between items-center px-1">
               <span className="text-[20px] font-gerat font-bold text-[#1D2939]">Total Charged</span>
               <span className="text-[24px] font-gerat font-bold text-[#FF6600]">€840.00</span>
            </div>
          </div>
        </div>

        {/* Payment Detail */}
        <div className="w-full bg-[#F9FAFB] rounded-3xl p-6 border border-[#F2F4F7] mb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white border border-[#EAECF0] rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-[20px]">💳</span>
                    </div>
                    <div>
                        <p className="text-[14px] font-poppins font-bold text-[#1D2939]">Visa - 9021</p>
                        <p className="text-[12px] text-[#667085] font-poppins">Payment Successful</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-between items-center pt-5 border-t border-[#EAECF0]">
                <span className="text-[13px] font-poppins text-[#667085]">Transaction ID</span>
                <span className="text-[13px] font-poppins font-bold text-[#1D2939]">TX-90210-2390</span>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-4">
             <Button variant="outline" fullWidth onClick={() => {}} className="flex items-center justify-center gap-2">
                <Download size={18} />
                Download Receipt
             </Button>
             <Button variant="primary" fullWidth onClick={() => router.push("/user/home")} className="flex items-center justify-center gap-2">
                <Repeat size={18} />
                Book this Kraft again
             </Button>
        </div>
      </div>
    </main>
  );
};

export default ReceiptPage;
