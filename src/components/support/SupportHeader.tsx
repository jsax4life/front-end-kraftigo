import Image from "next/image";
import { ArrowLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import toast from "react-hot-toast";

const avatars = [
  "/images/pro.jpg",
  "/images/log1.jpg",
  "/images/log2.jpg",
  "/images/log3.jpg",
  "/images/log4.jpg",
];

const SupportHeader = () => {
  const router = useRouter();
  const { logout } = useAuthStore();

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
    <div className="pt-12 pb-10 w-full bg-[#0000FF1A] px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="p-1 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-4 overflow-hidden">
            {avatars.map((src, i) => (
              <div key={i} className="relative w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                <Image
                  src={src}
                  alt="Support Team"
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 rounded-full transition-colors text-[#F04438]"
            title="Log Out"
          >
            <LogOut size={24} />
          </button>
        </div>
      </div>
      
      <h1 className="text-[36px] font-gerat font-extrabold leading-[1.2] text-[#1D2939] max-w-[300px]">
        Hello, how <br /> can we help?
      </h1>
    </div>
  );
};

export default SupportHeader;
