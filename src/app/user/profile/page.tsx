"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import UserNav from "@/components/shared/userNav";
import { 
  User, 
  Lock, 
  CreditCard, 
  Clock, 
  Globe, 
  Bell, 
  Languages, 
  LogOut, 
  ChevronRight,
  Plus,
  Edit2,
  Info,
  ShieldCheck
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { ProfileInfoSkeleton } from "@/components/shared/Skeletons";

const SettingsItem = ({ icon: Icon, label, onClick, color = "text-gray-600" }: { icon: any, label: string, onClick: () => void, color?: string }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between py-5 bg-white border-b border-[#F2F4F7] last:border-0 hover:bg-gray-50/50 transition-all px-2 group"
  >
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${color.replace('text', 'bg').replace('600', '100')} ${color}`}>
        <Icon size={20} />
      </div>
      <span className="text-[15px] font-poppins font-medium text-[#1D2939]">{label}</span>
    </div>
    <ChevronRight size={18} className="text-[#D0D5DD] group-hover:translate-x-1 transition-transform" />
  </button>
);

const SectionHeader = ({ label }: { label: string }) => (
  <h2 className="text-[11px] font-poppins font-bold text-[#98A2B3] uppercase tracking-widest mb-3 mt-6 ml-2">
    {label}
  </h2>
);

import Header from "@/components/shared/Header";

const Page = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { customerProfile, fetchCustomerProfile, isLoading, verificationStatus, fetchVerificationStatus } = useProfileStore();

  useEffect(() => {
    if (!customerProfile) {
      fetchCustomerProfile();
    }
    fetchVerificationStatus();
  }, [customerProfile, fetchCustomerProfile, fetchVerificationStatus]);

  const displayName = customerProfile?.fullName || user?.fullName || "User";
  const email = user?.email || "";
  const avatar = customerProfile?.profilePhotoUrl || user?.avatar;
  const status = verificationStatus?.status; // PENDING, APPROVED, REJECTED

  return (
    <main className="relative w-full min-h-screen bg-[#F9FAFB] pb-32">
      <Header title="Profile" showBack={false} showLogout={true} />
      
      <div className="px-4 sm:px-6 lg:px-8 py-8">

        {/* User Profile Card */}
        {isLoading ? (
          <ProfileInfoSkeleton />
        ) : (
          <div className="flex items-center gap-5 mb-10">
            <div className="relative border-2 border-dashed border-brand-orange rounded-full w-20 h-20 flex items-center justify-center shrink-0">
              <div className="relative w-[70px] h-[70px] rounded-full overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                {avatar ? (
                  <Image 
                    src={avatar} 
                    alt="Profile" 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <User size={32} className="text-gray-300" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-[22px] font-gerat font-bold text-[#1D2939]">
                {displayName}
              </h3>
              <p className="text-[14px] text-[#667085] font-poppins">
                {email}
              </p>
            </div>
            <button 
              onClick={() => router.push("/user/profile/personal-info")}
              className="w-10 h-10 flex items-center justify-center rounded-full border border-[#F2F4F7] text-[#667085] hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all bg-white shadow-sm"
            >
              <Edit2 size={18} />
            </button>
          </div>
        )}

        {/* Promo Banners */}
        <div className="space-y-4 mb-8">
          <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-[#FF6600] group cursor-pointer shadow-lg shadow-orange-100/50">
            <div className="absolute inset-0 p-6 flex flex-col justify-center z-10">
              <h4 className="text-white text-[16px] font-gerat font-bold leading-tight max-w-[150px]">
                EARN EASY BY COMPLETING KRAFT
              </h4>
              <button className="mt-2 w-fit bg-white text-[#FF6600] text-[10px] font-bold px-4 py-1.5 rounded-full uppercase">
                Invite a friend
              </button>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-40 h-full opacity-30 transform translate-x-4">
               <Image src="/craft.svg" alt="decorate" fill className="object-contain grayscale brightness-200" />
            </div>
          </div>

          <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-[#FFFFCC] group cursor-pointer shadow-lg border border-[#E8E8BE]">
            <div className="absolute inset-0 p-6 flex flex-col justify-center z-10">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-brand-orange text-white rounded">Referral</span>
              </div>
              <h4 className="text-[#1D2939] text-[16px] font-gerat font-bold leading-tight max-w-[150px]">
                Earn real money
              </h4>
              <button className="mt-2 w-fit bg-[#1D2939] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase">
                Send a code
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-full">
               <Image src="/images/home.png" alt="decorate" fill className="object-cover opacity-20" />
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#0000000D]">
          <SectionHeader label="Account" />
          <SettingsItem 
            icon={User} 
            label="Personal Information" 
            onClick={() => router.push("/user/profile/personal-info")}
            color="text-[#3538CD]"
          />
          <SettingsItem 
            icon={Lock} 
            label="Security" 
            onClick={() => router.push("/user/profile/security")}
            color="text-[#FF6600]"
          />
          {!useAuthStore.getState().isTasker() ? (
            <SettingsItem 
              icon={status === 'PENDING' ? Clock : status === 'REJECTED' ? Info : Plus} 
              label={status === 'PENDING' ? "Verification Pending" : status === 'REJECTED' ? "Verification Rejected (Retry)" : "Become an Artisan"} 
              onClick={() => {
                  if (status === 'PENDING') {
                      toast.success("Your application is being reviewed!");
                  } else {
                      router.push("/user/profile/artisan-verification");
                  }
              }}
              color={status === 'PENDING' ? "text-orange-500" : status === 'REJECTED' ? "text-red-500" : "text-[#00A651]"}
            />
          ) : (
            <SettingsItem 
              icon={ShieldCheck} 
              label="Crafter Profile Active" 
              onClick={() => router.push("/tasker/dashboard")}
              color="text-[#00A651]"
            />
          )}

          <SectionHeader label="Payments" />
          <SettingsItem 
            icon={CreditCard} 
            label="Payment methods" 
            onClick={() => {}}
            color="text-[#00A651]"
          />
          <SettingsItem 
            icon={Clock} 
            label="Transaction history" 
            onClick={() => router.push("/user/profile/transactions")}
            color="text-[#FF6600]"
          />
          <SettingsItem 
            icon={Globe} 
            label="Currency" 
            onClick={() => router.push("/user/profile/currency")} 
            color="text-[#2E90FA]"
          />

          <SectionHeader label="App Preferences" />
          <SettingsItem 
            icon={Bell} 
            label="Push notifications" 
            onClick={() => router.push("/user/profile/notifications")}
            color="text-[#F04438]"
          />
          <SettingsItem 
            icon={Languages} 
            label="Language" 
            onClick={() => router.push("/user/profile/language")}
            color="text-[#7A5AF8]"
          />
          
          <div className="mt-4 pt-4 border-t border-[#F2F4F7]">
            <SettingsItem 
              icon={LogOut} 
              label="Sign Out" 
              onClick={async () => {
                try {
                  await useAuthStore.getState().logout();
                  toast.success("Logged out successfully");
                  router.push("/user/login");
                } catch (error) {
                  toast.error("Logout failed");
                }
              }}
              color="text-[#F04438]"
            />
          </div>
        </div>

        {/* Delete Account */}
        <button className="w-full mt-12 py-4 text-center text-[#98A2B3] text-[13px] font-poppins font-medium hover:text-[#F04438] transition-colors uppercase tracking-widest">
          Delete account
        </button>
      </div>

      <UserNav />
    </main>
  );
};

export default Page;
