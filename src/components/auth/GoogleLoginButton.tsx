"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

interface GoogleLoginButtonProps {
  className?: string;
  variant?: "icon" | "full";
}

const GoogleLoginButton = ({ className, variant = "icon" }: GoogleLoginButtonProps) => {
  const router = useRouter();
  const { loginWithGoogle, isLoading, error } = useAuthStore();

  const googleLogin = useGoogleLogin({
    flow: "implicit",
    onSuccess: async (tokenResponse: any) => {
      logger.log("Google OAuth initiated");
      try {
        await loginWithGoogle(tokenResponse.access_token);
        logger.log("Google OAuth successful!");
        toast.success("Login successful! Welcome to Kraftigo.");
        router.push("/user/home");
      } catch (err: any) {
        logger.error("Google OAuth failed:", err);
        const errorMessage =
          err.response?.data?.message ||
          error ||
          "Google sign-in failed. Please try again.";
        toast.error(errorMessage);
      }
    },
    onError: () => {
      logger.error("Google OAuth error");
      toast.error("Google sign-in failed. Please try again.");
    },
  });

  if (variant === "full") {
    return (
      <button
        onClick={() => googleLogin()}
        disabled={isLoading}
        className={`w-full py-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 font-poppins font-semibold text-black ${className}`}
      >
        <Image src="/google.svg" alt="Google" width={24} height={24} />
        Continue with Google
      </button>
    );
  }

  return (
    <button
      onClick={() => googleLogin()}
      disabled={isLoading}
      className={`w-14 h-14 bg-white border border-[#0000001A] rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50 ${className}`}
    >
      <Image src="/google.svg" alt="Google" width={24} height={24} />
    </button>
  );
};

export default GoogleLoginButton;
