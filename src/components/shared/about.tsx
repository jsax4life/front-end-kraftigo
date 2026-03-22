"use client";

import Image from "next/image";
import { Headset, User as UserIcon, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const About = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, isTasker, isUser, logout } = useAuthStore();
  const { 
    artisanProfile, 
    customerProfile, 
    fetchArtisanProfile, 
    fetchCustomerProfile 
  } = useProfileStore();

  useEffect(() => {
    setMounted(true);
    if (isTasker() && !artisanProfile) {
      fetchArtisanProfile();
    } else if (isUser() && !customerProfile) {
      fetchCustomerProfile();
    }
  }, [isTasker, isUser, artisanProfile, customerProfile, fetchArtisanProfile, fetchCustomerProfile]);

  // Determine which profile were working with
  const profile = isTasker() ? artisanProfile : (typeof customerProfile === 'object' ? customerProfile : null);
  
  // Get name from profile, fallback to auth user, fallback to "User"
  const fullName = isTasker() 
    ? artisanProfile?.displayName || artisanProfile?.legalFullName 
    : (customerProfile && typeof customerProfile === 'object' ? customerProfile.fullName : null);
    
  // Check localStorage for a name if we just registered but profile hasn't updated yet
  const localName = typeof window !== "undefined" ? localStorage.getItem("kraftigo_tasker_fullName") : null;
    
  // To avoid hydration mismatch, we default to "User" or user?.fullName during server render
  const displayName = !mounted 
    ? (user?.fullName?.split(" ")[0] || "User")
    : ((fullName || localName || user?.fullName)?.split(" ")[0] || "User");
  const avatar = (isTasker() ? artisanProfile?.profilePhotoUrl : (customerProfile && typeof customerProfile === 'object' ? customerProfile.profilePhotoUrl : null)) || user?.avatar;

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
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Profile Section */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="border-2 border-dashed border-brand-blue-deep rounded-full w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 flex items-center justify-center overflow-hidden">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="propic"
                  width={300}
                  height={300}
                  unoptimized
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <UserIcon size={24} className="sm:w-8 sm:h-8" />
                </div>
              )}
            </div>
            <div>
              <p className="font-poppins text-[14px] sm:text-[16px] lg:text-[18px]">
                Hello {displayName}
              </p>
              <span className="flex items-center gap-1">
                {mounted && (
                  isTasker() && user?.status !== 'ACTIVE' ? (
                    <div className="bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded text-[10px] font-bold mt-1">
                      PENDING APPROVAL
                    </div>
                  ) : (
                    <>
                      <Image
                        src="/badge.svg"
                        alt="badge"
                        width={100}
                        height={100}
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                      />
                      <p className="font-poppins font-bold text-[11px] sm:text-[12px] text-brand-orange">
                        Lvl 12
                      </p>
                    </>
                  )
                )}
              </span>
            </div>
          </div>

          {/* Icons Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Image
              src="/flag.svg"
              alt="flag"
              width={100}
              height={100}
              className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 cursor-pointer"
            />

            <button
              className="relative bg-[#F2F2F2] p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <Headset size={25} className="sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-700" />
              <div className="absolute top-1.5 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
            </button>

            <button 
              onClick={handleLogout}
              className="bg-red-50 p-2 rounded-full text-[#F04438] hover:bg-red-100 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut size={22} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
