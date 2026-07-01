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
  Wallet,
  Target,
  UserX,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useBookingsStore } from "@/store/useBookingsStore";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { deleteAccount } from "@/lib/api/auth";
import DeleteAccountModal from "@/components/shared/DeleteAccountModal";
import { UpdateLocationBanner } from "@/components/shared/DashboardWidgets";
import { hasKrafterProfileCoords } from "@/lib/taskLocation";

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

const SettingsRow = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between py-4 bg-white border-b border-[#F2F4F7] last:border-0 hover:bg-gray-50 transition-colors px-4 group"
  >
    <div className="flex items-center gap-3">
      <Icon size={22} className="text-[#1D2939]" strokeWidth={1.5} />
      <span className="text-[16px] font-poppins font-medium text-[#1D2939]">{label}</span>
    </div>
    <ChevronRight size={20} className="text-[#98A2B3] group-hover:translate-x-1 transition-transform" />
  </button>
);

const Page = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { artisanProfile, fetchArtisanProfile, verificationStatus, fetchVerificationStatus } = useProfileStore();
  const { fetchArtisanBookings, getCompletedBookings } = useBookingsStore();

  useEffect(() => {
    fetchArtisanProfile();
    fetchVerificationStatus();
    fetchArtisanBookings();
  }, [fetchArtisanProfile, fetchVerificationStatus, fetchArtisanBookings]);

  const needsLocationUpdate =
    artisanProfile != null && !hasKrafterProfileCoords(artisanProfile);

  const displayName = artisanProfile?.displayName || artisanProfile?.legalFullName || (user?.firstName ? `${user.firstName} ${user.lastName}` : "User");
  const avatar = artisanProfile?.profilePhotoUrl || user?.avatar;
 
  const completedBookings = getCompletedBookings();
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/user/login");
    } catch (error) {
      toast.error("Logout failed");
    }
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
    <main className="relative w-full min-h-screen bg-white pb-32">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
      <div className="pt-8 px-6 mb-6 flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-gerat font-bold text-[#1D2939]">Profile</h1>
        <button
          type="button"
          onClick={() => {
            try {
              window.localStorage.setItem("kraftigo_profile_mode", "customer");
            } catch {
              // ignore
            }
            // Hard switch to customer home screen
            window.location.assign("/");
          }}
          className="px-3 py-1.5 rounded-full border border-[#EAECF0] text-[12px] font-poppins font-semibold text-[#344054] hover:bg-gray-50"
        >
          Switch to customer
        </button>
      </div>

      <div className="px-4 space-y-8">
        {/* User Info Section */}
        <div className="flex items-center gap-4 px-2">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-brand-blue shrink-0 flex items-center justify-center">
            {avatar ? (
              <Image src={avatar} alt="Profile" fill className="object-cover rounded-full p-1" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                <UserIcon size={24} />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-[20px] font-gerat font-bold text-[#1D2939]">{displayName}</h2>
            <div className="flex items-center gap-1.5 bg-orange-50 text-brand-orange px-2 py-0.5 rounded-full w-fit mt-1">
              <Star size={12} className="fill-brand-orange" />
              <span className="text-[12px] font-bold font-poppins uppercase tracking-wider">Lvl 1</span>
            </div>
          </div>
        </div>

        {needsLocationUpdate && (
          <UpdateLocationBanner
            onUpdate={() => router.push("/tasker/profile/edit?focus=location")}
          />
        )}

        {/* Weekly Earnings Card */}
        <div className="bg-[#F9FAFB] rounded-3xl p-6 border border-[#EAECF0]">
          <div className="space-y-1">
            <p className="text-[14px] font-poppins text-[#667085]">Total Earnings</p>
            <h3 className="text-[32px] font-gerat font-bold text-[#1D2939] leading-tight">£{totalEarnings.toFixed(2)}</h3>
            <p className="text-[12px] font-poppins text-[#98A2B3]">Lifetime earnings from {completedBookings.length} completed jobs</p>
          </div>
          <SimpleLineChart />
        </div>

        {/* Switch to customer CTA banner */}
        <div className="pt-2">
          <button
            type="button"
            className="w-full"
            onClick={() => {
              try {
                localStorage.setItem("kraftigo_profile_mode", "customer");
              } catch {
                // ignore
              }
              // Use a full-page navigation to ensure the customer route + localStorage mode takes effect.
              if (typeof window !== "undefined") {
                window.location.assign("/user/book-service");
              } else {
                router.push("/user/book-service");
              }
            }}
          >
            <div className="relative w-full overflow-hidden rounded-3xl border border-[#EAECF0] bg-white">
              <Image
                src="/switch-to-kraftigo-user.png"
                alt="Switch to Kraftigo User"
                width={600}
                height={180}
                className="w-full h-auto object-cover"
              />
            </div>
          </button>
        </div>


        {/* Setting Groups */}
        <div className="space-y-8 pb-4">
          
          {/* Section 1: Account & Verification */}
          <div>
            <h5 className="text-[14px] font-gerat font-bold text-[#1D2939] px-2 mb-4">Account & Verification</h5>
            <div className="bg-white border border-[#F2F4F7] rounded-3xl overflow-hidden shadow-sm">
              <SettingsRow icon={UserIcon} label="Personal Information" onClick={() => router.push("/tasker/profile/edit")} />
              <SettingsRow icon={Lock} label="Security" onClick={() => router.push("/tasker/profile/security")} />
              <SettingsRow
                icon={MessageCircleQuestion}
                label="Work Eligibility"
                onClick={() => router.push("/krafter/profile-completion?skipIntro=1")}
              />
              <SettingsRow icon={Target} label="Work Preferences" onClick={() => {}} />
            </div>
          </div>

          {/* Section 2: Earnings & Billing */}
          <div>
            <h5 className="text-[14px] font-gerat font-bold text-[#1D2939] px-2 mb-4">Earnings & Billing</h5>
            <div className="bg-white border border-[#F2F4F7] rounded-3xl overflow-hidden shadow-sm">
              <SettingsRow icon={Wallet} label="Earnings & Activity" onClick={() => router.push("/tasker/profile/earnings")} />
            </div>
          </div>

          {/* Section 3: Account & Support */}
          <div>
            <h5 className="text-[14px] font-gerat font-bold text-[#1D2939] px-2 mb-4">Account & Support</h5>
            <div className="bg-white border border-[#F2F4F7] rounded-3xl overflow-hidden shadow-sm">
              <SettingsRow icon={Bell} label="Notifications" onClick={() => router.push("/tasker/profile/notifications")} />
              <SettingsRow icon={Languages} label="Language" onClick={() => {}} />
              <SettingsRow icon={HelpCircle} label="Help Center" onClick={() => {}} />
              <SettingsRow icon={UserX} label="Close Account" onClick={() => setDeleteModalOpen(true)} />
            </div>
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="w-full bg-[#FEF3F2] py-5 rounded-3xl text-[#F04438] font-gerat font-bold text-[16px] hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            Log out
          </button>
        </div>
      </div>
      </div>

      <TaskerNav />
      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </main>
  );
};

export default Page;
