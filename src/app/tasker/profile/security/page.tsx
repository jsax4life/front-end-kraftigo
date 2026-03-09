"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Monitor, Smartphone, Watch } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Link from "next/link";
import TaskerNav from "@/components/shared/taskerNav";

const SessionItem = ({ icon: Icon, device, location, time, isCurrent = false }: { 
  icon: any, 
  device: string, 
  location: string, 
  time: string, 
  isCurrent?: boolean 
}) => (
  <div className="flex items-center justify-between py-4 border-b border-[#F2F4F7] last:border-0">
    <div className="flex items-center gap-4">
      <div className="p-2.5 bg-[#F9FAFB] rounded-xl text-[#344054]">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[15px] font-poppins font-medium text-[#1D2939]">{device}</p>
        <p className="text-[12px] font-poppins text-[#667085]">{location} · {time}</p>
      </div>
    </div>
    {isCurrent ? (
      <span className="text-[14px] font-poppins font-bold text-[#98A2B3]">This Device</span>
    ) : (
      <button className="text-[14px] font-poppins font-bold text-brand-orange hover:underline">
        Sign out
      </button>
    )}
  </div>
);

const SecurityPage = () => {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7]">
        <button onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center pr-10 flex-1">
           <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Security</h1>
        </div>
      </div>

      <div className="px-5 py-8 space-y-10 max-w-2xl mx-auto pb-32">
        
        {/* Password Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-gerat font-bold text-[#1D2939]">Password</h2>
            <button className="text-brand-orange text-[14px] font-poppins font-bold hover:underline">Change</button>
          </div>
          <div className="space-y-4">
            <Input 
              type="password"
              value="********"
              onChange={() => {}}
              disabled
              className="bg-[#F9FAFB] border-[#F2F4F7]"
            />
            <div className="flex justify-end">
              <button 
                className="bg-brand-blue text-white px-8 py-3.5 rounded-2xl font-poppins font-bold text-[15px] hover:bg-opacity-90 transition-all"
              >
                Add Password
              </button>
            </div>
          </div>
        </section>

        {/* Active Sessions */}
        <section className="space-y-4 pt-4 border-t border-[#F2F4F7]">
          <h2 className="text-[16px] font-gerat font-bold text-[#1D2939]">Active sessions</h2>
          <div className="space-y-2">
            <SessionItem 
              icon={Monitor} 
              device="Unknown device" 
              location="Dresden" 
              time="Today, 16:48" 
              isCurrent={true} 
            />
            <SessionItem 
              icon={Smartphone} 
              device="Iphone 15 Pro Ultra" 
              location="Lagos" 
              time="June 07 2024, 16:48" 
            />
            <SessionItem 
              icon={Watch} 
              device="Apple Watch Ultra" 
              location="Lagos" 
              time="June 07 2024, 16:48" 
            />
          </div>
          
          <div className="pt-4">
            <p className="text-[14px] font-poppins text-[#667085] leading-relaxed">
              Learn more about how we use and protect your personal data in our{" "}
              <Link href="/privacy" className="text-gray-900 underline font-medium">Privacy Policy.</Link>
            </p>
          </div>
        </section>

        {/* Delete Account */}
        <section className="space-y-4 pt-8">
           <div className="space-y-1">
             <h2 className="text-[16px] font-gerat font-bold text-[#1D2939]">Delete your account</h2>
             <p className="text-[14px] font-poppins text-[#667085]">
               Request to delete your account and data, based on applicable law and our policies
             </p>
           </div>
           <button 
             className="w-full bg-[#FEF3F2] py-4 rounded-2xl text-[#F04438] font-poppins font-bold text-[15px] hover:bg-red-100 transition-colors"
           >
             Delete Account
           </button>
        </section>

      </div>
      <TaskerNav />
    </main>
  );
};

export default SecurityPage;
