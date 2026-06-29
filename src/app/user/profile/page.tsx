"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import UserNav from "@/components/shared/userNav";
import Navbar from "@/components/shared/Navbar";
import { 
  User, 
  Lock, 
  CreditCard, 
  Clock, 
  Bell, 
  Languages, 
  ChevronRight,
  MapPin,
  MessageCircle,
  UserX,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { deleteAccount } from "@/lib/api/auth";
import {
  getVerificationWire,
  shouldRedirectToDiditKyc,
  shouldRouteToKrafterProfileOnboarding,
} from "@/lib/api/verification";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ProfileInfoSkeleton } from "@/components/shared/Skeletons";
import DeleteAccountModal from "@/components/shared/DeleteAccountModal";

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
  const { user } = useAuthStore();
  const { customerProfile, fetchCustomerProfile, isLoading, verificationStatus, fetchVerificationStatus } = useProfileStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!customerProfile) {
      fetchCustomerProfile();
    }
    fetchVerificationStatus();
  }, [customerProfile, fetchCustomerProfile, fetchVerificationStatus]);

  const displayName = user?.firstName + " " + user?.lastName || "User";
  const email = user?.email || "";
  const avatar = customerProfile?.profilePhotoUrl || user?.avatar;
  const { verificationState, kycStatus } = getVerificationWire(verificationStatus);

  // Treat user as an existing Krafter when internal docs are submitted (pending/approved) and KYC is approved.
  const isKrafterEligible =
    kycStatus === "APPROVED" &&
    (verificationState === "PENDING" || verificationState === "APPROVED");

  const taskerBannerTitle = isKrafterEligible
    ? "GO TO KRAFTER DASHBOARD"
    : "EARN MONEY BY COMPLETING KRAFTS";
  const taskerButtonLabel = isKrafterEligible ? "Switch to Krafter" : "Become a Krafter";
  
  const handleTaskerAction = () => {
    if (isKrafterEligible) {
      // User is already a Krafter – switch back to Krafter screens.
      try {
        window.localStorage.removeItem("kraftigo_profile_mode");
      } catch {
        // ignore
      }
      router.push("/tasker/dashboard");
      return;
    }
    if (shouldRedirectToDiditKyc(verificationStatus)) {
      router.push("/krafter/kyc-welcome");
      return;
    }
    if (shouldRouteToKrafterProfileOnboarding(verificationStatus)) {
      router.push("/krafter/profile-completion");
      return;
    }
    router.push("/krafter/verification");
  };

  const handleDeleteAccount = async (payload: {
    password?: string;
    confirmation?: "DELETE_MY_KRAFTIGO_ACCOUNT";
  }) => {
    try {
      await deleteAccount(payload);
      await useAuthStore.getState().logout();
      toast.success("Account closed successfully.");
      router.replace("/user/login");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Could not close account. Check active bookings/applications and try again.";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
      throw error;
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-white pb-32 md:pb-0">
      <div className="hidden md:block max-w-4xl mx-auto pt-6 px-4 md:px-0 lg:px-0">
        <Navbar />
      </div>
      
      <div className="px-[20px] pt-[60px] md:pt-8 pb-8 w-full max-w-4xl mx-auto">
        <h1 className="text-[20px] font-gerat font-[850] text-[rgba(0,0,0,0.8)] mb-6 tracking-[-0.03em]">
          Profile
        </h1>

        {/* User Profile Card */}
        {isLoading ? (
          <ProfileInfoSkeleton />
        ) : (
          <div className="flex flex-col p-[12px_10px] gap-[10px] bg-[#F6F6F6] border border-[rgba(0,0,0,0.1)] rounded-[19px] w-full mb-2">
            <div className="flex items-center gap-[20px] px-2 h-[52px]">
               <div className="flex items-center justify-center p-1 w-[52px] h-[52px] border-2 border-dashed border-[#FF6600] rounded-[28px] shrink-0">
                  <div className="relative w-[44px] h-[44px] rounded-full overflow-hidden bg-gray-200">
                     {avatar ? (
                        <Image src={avatar} alt="Profile" fill className="object-cover" />
                     ) : (
                        <User size={24} className="text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                     )}
                  </div>
               </div>
               <div className="flex flex-col gap-1 overflow-hidden">
                  <h3 className="text-[14px] font-poppins font-bold text-[rgba(0,0,0,0.8)] leading-[21px] truncate whitespace-nowrap">{displayName}</h3>
                  <p className="text-[14px] font-poppins text-[rgba(0,0,0,0.8)] leading-[21px] truncate whitespace-nowrap">{email}</p>
               </div>
            </div>

            <div 
              className="flex flex-col justify-center items-start p-[16px] gap-[10px] w-full h-[151px] rounded-[12px] relative overflow-hidden cursor-pointer"
              onClick={handleTaskerAction}
              style={{
                  background: "linear-gradient(84.38deg, #FF6600 0.35%, rgba(0, 0, 255, 0.2) 19.08%, rgba(255, 102, 0, 0.26) 64.6%, rgba(0, 0, 255, 0) 99.58%)"
              }}
            >
               <div className="absolute inset-0 z-0">
                   <Image src="/images/prof.jpg" alt="krafter" fill className="object-cover opacity-60 mix-blend-overlay" />
               </div>
               <div className="relative z-10 w-full flex flex-col justify-between h-full">
                  <div className="flex flex-col items-start gap-[20px]">
                      <div className="flex justify-center items-center px-[10px] py-[4px] bg-[#FF6600] rounded-[8px]">
                        <span className="text-[10px] font-poppins text-white leading-[15px]">
                          {isKrafterEligible ? "Switch to Krafter" : "Become a Krafter"}
                        </span>
                      </div>
                      <h4 className="text-[20px] font-poppins font-bold uppercase text-[#FFFFE4] leading-[30px] w-[203px]">
                         {taskerBannerTitle}
                      </h4>
                  </div>
                  <div className="absolute right-0 bottom-0 text-white flex items-end justify-end h-full">
                      <button className="flex justify-center items-center px-[14.7px] py-[11px] bg-white rounded-[10px]">
                         <span className="text-[11.46px] font-poppins text-black truncate whitespace-nowrap">{taskerButtonLabel}</span>
                      </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        <SectionHeader label="Account" />
        <div className="flex flex-col py-[8px] bg-[#F6F6F6] rounded-[20px]">
           <SettingsItem 
             icon={User} 
             label="Personal Information" 
             onClick={() => router.push("/user/profile/personal-info")}
           />
           <SettingsItem 
             icon={Lock} 
             label="Security" 
             onClick={() => router.push("/user/profile/security")}
             showBorder={false}
           />
        </div>

        <SectionHeader label="Payment & Billing" />
        <div className="flex flex-col py-[8px] bg-[#F6F6F6] rounded-[20px]">
           <SettingsItem 
             icon={CreditCard} 
             label="Payment Methods" 
             onClick={() => router.push("/user/profile/payment-methods")}
           />
           <SettingsItem 
             icon={Clock} 
             label="Transaction History" 
             onClick={() => router.push("/user/profile/transactions")}
             showBorder={false}
           />
        </div>

        <SectionHeader label="App Preferences" />
        <div className="flex flex-col py-[8px] bg-[#F6F6F6] rounded-[20px]">
           <SettingsItem 
             icon={MapPin} 
             label="Saved Addresses" 
             onClick={() => {}}
           />
           <SettingsItem 
             icon={Bell} 
             label="Notifications" 
             onClick={() => router.push("/user/profile/notifications")}
           />
           <SettingsItem 
             icon={Languages} 
             label="Language" 
             onClick={() => router.push("/user/profile/language")}
             showBorder={false}
           />
        </div>

        <div className="flex flex-col mt-[20px] py-[8px] bg-[#F6F6F6] rounded-[20px]">
           <SettingsItem 
             icon={MessageCircle} 
             label="Help Center" 
             onClick={() => {}}
           />
           <SettingsItem
             icon={UserX}
             label="Close Account"
             onClick={() => setDeleteModalOpen(true)}
             showBorder={false}
           />
        </div>

        <button 
           onClick={async () => {
             try {
               await useAuthStore.getState().logout();
               toast.success("Logged out successfully");
               router.push("/user/login");
             } catch (error) {
               toast.error("Logout failed");
             }
           }}
           className="w-full mt-[12px] flex justify-center items-center py-[14px] bg-[rgba(254,41,41,0.1)] rounded-[12px]"
        >
           <span className="text-[14px] font-poppins text-[#FE2929]">Log out</span>
        </button>
      </div>

      <UserNav />
      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </main>
  );
};

export default Page;
