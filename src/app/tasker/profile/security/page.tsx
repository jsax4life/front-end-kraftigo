"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Monitor, Smartphone, Watch, Loader2, Mail, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Link from "next/link";
import TaskerNav from "@/components/shared/taskerNav";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

const SessionItem = ({ 
  icon: Icon, 
  device, 
  location, 
  time, 
  isCurrent = false,
  onSignOut
}: { 
  icon: any, 
  device: string, 
  location: string, 
  time: string, 
  isCurrent?: boolean,
  onSignOut?: () => void
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
      <button 
        onClick={onSignOut}
        className="text-[14px] font-poppins font-bold text-brand-orange hover:underline active:opacity-70 transition-all"
      >
        Sign out
      </button>
    )}
  </div>
);

const SecurityPage = () => {
  const router = useRouter();
  const { user, forgotPassword, logoutAll, isLoading } = useAuthStore();
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handlePasswordResetRequest = async () => {
    if (!user?.email) return toast.error("User email not found");
    
    try {
      await forgotPassword(user.email);
      setIsEmailSent(true);
      toast.success("Security instructions sent to your email!");
    } catch (error) {
      // Error handled by store
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm("Are you sure you want to sign out from all other devices? This will invalidate all active sessions.")) {
      try {
        await logoutAll();
        toast.success("Logged out from all devices");
        router.push("/user/login");
      } catch (error) {
        // Error handled by store
      }
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7] sticky top-0 z-50">
        <button onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center pr-10 flex-1">
           <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Security</h1>
        </div>
      </div>

      <div className="px-5 py-8 space-y-10 max-w-2xl mx-auto pb-32">
        
        {/* Password Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-gerat font-bold text-[#1D2939]">Password</h2>
            <button 
              onClick={handlePasswordResetRequest}
              disabled={isLoading || isEmailSent}
              className="text-brand-orange text-[14px] font-poppins font-bold hover:underline disabled:opacity-50"
            >
              {isEmailSent ? "Email Sent" : "Change"}
            </button>
          </div>
          
          <div className="bg-[#F9FAFB] rounded-3xl p-6 border border-[#F2F4F7] space-y-6">
            <div className="flex items-start gap-4">
               <div className="p-3 bg-brand-orange/10 rounded-2xl text-brand-orange shrink-0">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <h3 className="text-[15px] font-gerat font-bold text-[#1D2939]">Secure your account</h3>
                  <p className="text-[13px] font-poppins text-[#667085] leading-relaxed mt-1">
                    Regularly updating your password and monitoring active sessions helps keep your professional profile safe.
                  </p>
               </div>
            </div>

            {isEmailSent ? (
               <div className="bg-white p-4 rounded-2xl border border-green-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                    <Mail size={20} />
                  </div>
                  <p className="text-[13px] font-poppins text-green-700">
                    Instructions sent to <span className="font-bold">{user?.email}</span>
                  </p>
               </div>
            ) : (
               <Button 
                variant="primary" 
                fullWidth 
                onClick={handlePasswordResetRequest}
                disabled={isLoading}
                className="py-4 rounded-2xl font-gerat text-[15px] shadow-sm flex items-center justify-center gap-2"
               >
                 {isLoading && <Loader2 size={18} className="animate-spin" />}
                 Change Password
               </Button>
            )}
          </div>
        </section>

        {/* Active Sessions */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-gerat font-bold text-[#1D2939]">Active sessions</h2>
            <button 
              onClick={handleLogoutAll}
              className="text-red-500 text-[13px] font-poppins font-bold hover:underline"
            >
              Sign out all
            </button>
          </div>
          
          <div className="bg-white rounded-3xl border border-[#F2F4F7] px-6 relative overflow-hidden">
            <SessionItem 
              icon={Monitor} 
              device="Chrome on MacOS" 
              location="Current City" 
              time="Active now" 
              isCurrent={true} 
            />
            {/* Blurring inactive sessions as they are currently mock data */}
            <div className="blur-[2px] opacity-40 select-none pointer-events-none">
              <SessionItem 
                icon={Smartphone} 
                device="Mobile App (iOS)" 
                location="Lagos, NG" 
                time="2 hours ago" 
              />
              <SessionItem 
                icon={Watch} 
                device="Watch Pro" 
                location="Berlin, DE" 
                time="Yesterday" 
              />
            </div>
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
               <span className="bg-brand-blue/5 text-brand-blue text-[10px] font-poppins font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-brand-blue/10">
                 Multi-device support coming soon
               </span>
            </div>
          </div>
        </section>

        {/* Info & Policy */}
        <section className="bg-[#F9FAFB] p-6 rounded-3xl border border-[#F2F4F7]">
           <p className="text-[13px] font-poppins text-[#667085] leading-relaxed">
             We use your security data to protect your identity and prevent unauthorized access. 
             Learn more in our <Link href="/privacy" className="text-gray-900 underline font-bold">Privacy Policy.</Link>
           </p>
        </section>

        {/* Delete Account */}
        <section className="space-y-4 pt-4">
           <div className="space-y-1">
             <h2 className="text-[18px] font-gerat font-bold text-[#1D2939]">Delete your account</h2>
             <p className="text-[14px] font-poppins text-[#667085] leading-relaxed">
               This action is permanent and will remove all your professional history and profile data.
             </p>
           </div>
           <button 
             className="w-full bg-[#FEF3F2] py-4 rounded-2xl text-[#F04438] font-poppins font-bold text-[15px] hover:bg-red-100 transition-colors border border-red-50 ring-offset-2 focus:ring-2 focus:ring-red-100 outline-none"
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
