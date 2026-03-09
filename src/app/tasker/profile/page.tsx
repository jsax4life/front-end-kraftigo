"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import TaskerNav from "@/components/shared/taskerNav";
import Header from "@/components/shared/Header";
import { 
  User as UserIcon, 
  Lock, 
  CreditCard, 
  Clock, 
  Globe, 
  Bell, 
  Languages, 
  ChevronRight,
  Star,
  CheckCircle,
  Briefcase
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useEffect } from "react";

const SettingsItem = ({ icon: Icon, label, onClick, color = "text-gray-600" }: { icon: any, label: string, onClick: () => void, color?: string }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between py-4 bg-white border-b border-[#0000000D] last:border-0 hover:bg-gray-50 transition-all px-1"
  >
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-lg ${color.replace('text', 'bg').replace('600', '50')} ${color}`}>
        <Icon size={20} />
      </div>
      <span className="text-[16px] font-poppins font-medium text-[#1D2939]">{label}</span>
    </div>
    <ChevronRight size={20} className="text-[#98A2B3]" />
  </button>
);

const SectionHeader = ({ label }: { label: string }) => (
  <h2 className="text-[12px] font-poppins font-semibold text-[#667085] uppercase tracking-wider mt-8 mb-2">
    {label}
  </h2>
);

const Page = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { bookings } = useBookingsStore();
  const { artisanProfile, fetchArtisanProfile } = useProfileStore();

  useEffect(() => {
    if (!artisanProfile) {
      fetchArtisanProfile();
    }
  }, [artisanProfile, fetchArtisanProfile]);

  const completedTasks = bookings.filter(b => b.status === 'COMPLETED').length;
  const displayName = artisanProfile?.displayName || artisanProfile?.legalFullName || user?.fullName || "Tasker";
  const avatar = artisanProfile?.profilePhotoUrl || user?.avatar;

  return (
    <main className="relative w-full min-h-screen bg-[#F9FAFB] pb-32">
      <Header title="Your Profile" showBack={false} showLogout={true} />
      
      <div className="px-4 sm:px-6 lg:px-8 py-8">

        {/* Tasker Profile Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#0000000D] mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-brand-orange shadow-sm bg-white shrink-0 flex items-center justify-center">
              {avatar ? (
                <Image 
                  src={avatar} 
                  alt="Profile" 
                  fill 
                  className="object-cover"
                />
              ) : (
                <UserIcon size={40} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-[22px] font-gerat font-bold text-[#1D2939]">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 text-[#667085] font-poppins text-[14px]">
                <span className="flex items-center gap-1 text-brand-orange font-bold">
                  <Star size={14} className="fill-brand-orange" /> 5.0
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-500" /> Top Rated
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
            <div className="text-center">
              <p className="text-[12px] text-[#667085] font-poppins uppercase">Completed Tasks</p>
              <p className="text-[20px] font-gerat font-bold text-[#1D2939]">{completedTasks}</p>
            </div>
            <div className="text-center border-l border-gray-50">
              <p className="text-[12px] text-[#667085] font-poppins uppercase">Member Since</p>
              <p className="text-[20px] font-gerat font-bold text-[#1D2939]">Jan 2025</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
           <div className="bg-brand-blue rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[12px] font-poppins text-blue-100 uppercase mb-1">Total Earnings</p>
                <p className="text-[24px] font-gerat font-bold">$1,250.00</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                 <Briefcase size={24} />
              </div>
           </div>
           
           <div className="bg-brand-orange rounded-2xl p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[12px] font-poppins text-orange-100 uppercase mb-1">Active Bids</p>
                <p className="text-[24px] font-gerat font-bold">4</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                 <Clock size={24} />
              </div>
           </div>
        </div>

        {/* Sections */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0000000D]">
          <SectionHeader label="Professional" />
          <SettingsItem 
            icon={UserIcon} 
            label="Service Profile" 
            onClick={() => router.push("/tasker/profile/edit")}
            color="text-[#3538CD]"
          />
          <SettingsItem 
            icon={Briefcase} 
            label="My Crafts (Offers)" 
            onClick={() => {}}
            color="text-[#FF6600]"
          />

          <SectionHeader label="Verification" />
          <div className="w-full flex items-center justify-between py-4 bg-white border-b border-[#0000000D] last:border-0 px-1">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-orange-50 text-brand-orange">
                <CheckCircle size={20} />
              </div>
              <div>
                <span className="text-[16px] font-poppins font-medium text-[#1D2939] block">Identity & Documents</span>
                <span className="text-[12px] font-poppins text-[#667085]">
                  {user?.status === 'ACTIVE' ? 'Fully Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
            {user?.status !== 'ACTIVE' && (
              <button 
                onClick={() => router.push("/user/profile/artisan-verification")}
                className="text-brand-orange text-[14px] font-poppins font-bold hover:underline"
              >
                Complete
              </button>
            )}
            {user?.status === 'ACTIVE' && <CheckCircle size={20} className="text-green-500" />}
          </div>

          <SectionHeader label="Account" />
          <SettingsItem 
            icon={Lock} 
            label="Security" 
            onClick={() => {}}
            color="text-[#00A651]"
          />
          <SettingsItem 
            icon={CreditCard} 
            label="Payout Methods" 
            onClick={() => {}}
            color="text-[#7A5AF8]"
          />
          
          <SectionHeader label="App Preferences" />
          <SettingsItem 
            icon={Bell} 
            label="Push notifications" 
            onClick={() => {}}
            color="text-[#F04438]"
          />
          <SettingsItem 
            icon={Globe} 
            label="Country & Currency" 
            onClick={() => {}}
            color="text-[#2E90FA]"
          />
          <SettingsItem 
            icon={Languages} 
            label="App Language" 
            onClick={() => {}}
            color="text-[#7A5AF8]"
          />
        </div>

        {/* Logout */}
        <button 
          onClick={async () => {
            try {
              await useAuthStore.getState().logout();
              router.push("/tasker/login");
            } catch (error) {
              console.error("Logout failed:", error);
            }
          }}
          className="w-full mt-8 py-4 text-center text-[#667085] text-[14px] font-poppins font-medium hover:text-[#F04438] transition-colors"
        >
          Log Out
        </button>
      </div>

      <TaskerNav />
    </main>
  );
};

export default Page;
