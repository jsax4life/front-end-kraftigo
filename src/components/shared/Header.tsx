"use client";

import { ArrowLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showLogout?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

const Header = ({ 
  title, 
  showBack = true, 
  showLogout = true, 
  onBack,
  rightElement 
}: HeaderProps) => {
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

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
    <div className="w-full flex items-center justify-between py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#0000000D]">
      <div className="flex-1 flex items-center">
        {showBack && (
          <button 
            onClick={handleBack}
            className="p-1 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <ArrowLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {title && (
        <h1 className="text-[20px] font-gerat font-bold text-[#1D2939] text-center whitespace-nowrap px-4">
          {title}
        </h1>
      )}

      <div className="flex-1 flex items-center justify-end">
        {rightElement ? (
          rightElement
        ) : (
          showLogout && (
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-full transition-colors text-[#F04438] cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={24} />
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default Header;
