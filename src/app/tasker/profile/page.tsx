"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import TaskerNav from "@/components/shared/taskerNav";
import { 
  User as UserIcon, 
  Lock, 
  ChevronRight,
  Star,
  Bell,
  Languages,
  HelpCircle,
  MessageCircleQuestion,
  Globe,
  Wallet,
  Target
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { getVerificationWire } from "@/lib/api/verification";

const SimpleLineChart = () => {
  return (
    <div className="w-full h-32 relative mt-4">
      <svg viewBox="0 0 400 120" className="w-full h-full">
        {/* Background Grid Lines (Horizontal) */}
        {[0, 40, 80].map((y) => (
          <line 
            key={y} 
            x1="0" y1={y} x2="400" y2={y} 
            stroke="#F2F4F7" 
            strokeWidth="1" 
          />
        ))}
        
        {/* The Line - Simple wave pattern */}
        <path 
          d="M 10 90 L 60 70 L 110 85 L 160 60 L 210 50 L 260 40 L 310 55 L 360 45 L 400 50" 
          fill="none" 
          stroke="#FF6600" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Points with shadows */}
        {[
          {x: 60, y: 70}, 
          {x: 110, y: 85}, 
          {x: 160, y: 60}, 
          {x: 210, y: 50}, 
          {x: 260, y: 40}, 
          {x: 310, y: 55}
        ].map((p, i) => (
          <circle 
            key={i} 
            cx={p.x} cy={p.y} r="3" 
            fill="#1D2939" 
            stroke="white" 
            strokeWidth="1.5" 
          />
        ))}
        
        {/* Labels */}
        <text x="45" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Mon</text>
        <text x="95" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Tue</text>
        <text x="145" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Wed</text>
        <text x="195" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Thu</text>
        <text x="245" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Fri</text>
        <text x="295" y="115" fontSize="10" fill="#98A2B3" fontFamily="Poppins">Sat</text>
      </svg>
    </div>
  );
};

const SettingsItem = ({ icon: Icon, label, onClick, showBorder = true }: { icon: any, label: string, onClick: () => void, showBorder?: boolean }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-[12px] bg-transparent hover:bg-gray-100/50 transition-all ${showBorder ? 'border-b border-[rgba(0,0,0,0.1)]' : ''}`}
  >
    <div className="flex items-center gap-[8px]">
      <Icon size={18} className="text-gray-800" />
      <span className="text-[14px] font-poppins text-[rgba(0,0,0,0.8)]">{label}</span>
    </div>
    <ChevronRight size={18} className="text-gray-800" />
  </button>
);

const SectionHeader = ({ label }: { label: string }) => (
  <h2 className="text-[12px] font-poppins font-bold text-[rgba(0,0,0,0.8)] mb-[8px] mt-[20px] ml-1">
    {label}
  </h2>
);

const Page = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { artisanProfile, fetchArtisanProfile, verificationStatus, fetchVerificationStatus } =
    useProfileStore();

  useEffect(() => {
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
    fetchVerificationStatus();
  }, [artisanProfile, fetchArtisanProfile, fetchVerificationStatus]);

  const fallbackName = typeof window !== "undefined" ? localStorage.getItem("kraftigo_tasker_fullName") : null;
  const displayName = artisanProfile?.displayName || artisanProfile?.legalFullName || fallbackName || user?.fullName || "User";
  const avatar = artisanProfile?.profilePhotoUrl || user?.avatar;
  const { verificationState, kycStatus } = getVerificationWire(verificationStatus);
  const isProfileCompleted = Boolean((verificationStatus as any)?.isProfileCompleted);
  const showCompleteProfilePrompt =
    kycStatus === "APPROVED" &&
    (verificationState === "PENDING" || verificationState === "APPROVED") &&
    !isProfileCompleted;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/user/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-32">
      <div className="px-[20px] pt-[60px] pb-8 w-full max-w-[430px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[20px] font-gerat font-[850] text-[rgba(0,0,0,0.8)] tracking-[-0.03em]">
            Profile
          </h1>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem("kraftigo_profile_mode", "customer");
                window.location.assign("/user/home");
              } catch {
                // ignore
              }
            }}
            className="px-3 py-1.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[11px] font-poppins font-bold text-[rgba(0,0,0,0.6)] hover:bg-gray-50 uppercase tracking-wider"
          >
            Switch to customer
          </button>
        </div>

        {showCompleteProfilePrompt && (
          <div className="mb-6 bg-brand-orange/[0.03] border border-brand-orange/10 rounded-[19px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[14px] font-poppins font-bold text-[rgba(0,0,0,0.8)]">
                  Complete your profile
                </p>
                <p className="text-[12px] font-poppins text-[#667085] leading-relaxed">
                  Add the remaining details so customers can see your full Krafter profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/krafter/profile-completion?skipIntro=1")}
                className="shrink-0 px-4 py-2 rounded-xl bg-brand-orange text-white text-[11px] font-poppins font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
              >
                Finish
              </button>
            </div>
          </div>
        )}

        {/* User Info Section */}
        <div className="flex flex-col p-[12px_10px] gap-[10px] bg-[#F6F6F6] border border-[rgba(0,0,0,0.1)] rounded-[19px] w-full mb-6 relative overflow-hidden">
          <div className="flex items-center gap-[20px] px-2 py-1">
            <div className="flex items-center justify-center p-1 w-[52px] h-[52px] border-2 border-dashed border-[#FF6600] rounded-[28px] shrink-0">
               <div className="relative w-[44px] h-[44px] rounded-full overflow-hidden bg-gray-200">
                  {avatar ? (
                     <Image src={avatar} alt="Profile" fill className="object-cover" unoptimized />
                  ) : (
                     <UserIcon size={24} className="text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  )}
               </div>
            </div>
            <div className="flex flex-col gap-0.5">
               <h3 className="text-[14px] font-poppins font-bold text-[rgba(0,0,0,0.8)] leading-[21px]">{displayName}</h3>
               <div className="flex items-center gap-1.5 bg-white/60 text-brand-orange px-2 py-0.5 rounded-full w-fit">
                 <Star size={10} className="fill-brand-orange" />
                 <span className="text-[10px] font-bold font-poppins uppercase tracking-wider">Lvl 12</span>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[12px] p-4 border border-[rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[12px] font-poppins text-[#667085] leading-none mb-1">Weekly Earnings</p>
                <h3 className="text-[24px] font-gerat font-bold text-[#1D2939] leading-tight">$840.00</h3>
              </div>
              <p className="text-[10px] font-poppins text-[#98A2B3]">Oct 18 - Oct 24, 2026</p>
            </div>
            <SimpleLineChart />
          </div>
        </div>

        <SectionHeader label="Account & Verification" />
        <div className="flex flex-col py-[8px] bg-[#F6F6F6] rounded-[20px] border border-[rgba(0,0,0,0.05)]">
           <SettingsItem 
             icon={UserIcon} 
             label="Personal Information" 
             onClick={() => router.push("/tasker/profile/edit")}
           />
           <SettingsItem 
             icon={Lock} 
             label="Security" 
             onClick={() => router.push("/tasker/profile/security")}
           />
           <SettingsItem 
             icon={MessageCircleQuestion} 
             label="Work Eligibility" 
             onClick={() => router.push("/krafter/profile-completion?skipIntro=1")}
           />
           <SettingsItem 
             icon={Target} 
             label="Work Preferences" 
             onClick={() => {}}
             showBorder={false}
           />
        </div>

        <SectionHeader label="Earnings & Billing" />
        <div className="flex flex-col py-[8px] bg-[#F6F6F6] rounded-[20px] border border-[rgba(0,0,0,0.05)]">
           <SettingsItem 
             icon={Wallet} 
             label="Earnings & Activity" 
             onClick={() => router.push("/tasker/profile/earnings")}
           />
           <SettingsItem 
             icon={Globe} 
             label="Currency" 
             onClick={() => {}}
             showBorder={false}
           />
        </div>

        <SectionHeader label="App Preferences" />
        <div className="flex flex-col py-[8px] bg-[#F6F6F6] rounded-[20px] border border-[rgba(0,0,0,0.05)]">
           <SettingsItem 
             icon={Bell} 
             label="Notifications" 
             onClick={() => {}}
           />
           <SettingsItem 
             icon={Languages} 
             label="Language" 
             onClick={() => {}}
           />
           <SettingsItem 
             icon={HelpCircle} 
             label="Help Center" 
             onClick={() => {}}
             showBorder={false}
           />
        </div>

        <button 
           onClick={handleLogout}
           className="w-full mt-[30px] flex justify-center items-center py-[16px] bg-[rgba(254,41,41,0.05)] border border-[rgba(254,41,41,0.1)] rounded-[19px] active:scale-[0.98] transition-all"
        >
           <span className="text-[14px] font-poppins font-bold text-[#FE2929]">Log out</span>
        </button>
      </div>

      <TaskerNav />
    </main>
  );
};

export default Page;
