"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";
import { formatLoginApiError } from "@/lib/authApiErrors";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";

interface GoogleLoginButtonProps {
  className?: string;
  variant?: "icon" | "full";
}

const GoogleLoginButton = ({ className, variant = "icon" }: GoogleLoginButtonProps) => {
  const router = useRouter();
  const { loginWithGoogle, isLoading } = useAuthStore();

  const handleSuccess = async (credentialResponse: any) => {
    logger.log("Google OAuth initiated");
    if (!credentialResponse.credential) {
      toast.error("Google login failed to return credential");
      return;
    }
    try {
      // credentialResponse.credential IS the id_token JWT — exactly what backend expects
      await loginWithGoogle(credentialResponse.credential);
      logger.log("Google OAuth successful!");
      toast.success("Login successful! Welcome to Kraftigo.");
      router.push("/");
    } catch (err: unknown) {
      logger.error("Google OAuth failed:", err);
      toast.error(formatLoginApiError(err, useAuthStore.getState().error));
    }
  };

  const handleError = () => {
    logger.error("Google OAuth error");
    toast.error("Google sign-in failed. Please try again.");
  };

  const isIcon = variant === "icon";

  return (
    <div
      className={`
        relative
        ${isIcon ? "w-14 h-14" : "w-full h-12"}
        ${isLoading ? "opacity-50 pointer-events-none" : ""}
        ${className || ""}
      `}
    >
      {/* ── Custom visual button (your design) ── */}
      <div
        className={`
          pointer-events-none
          ${isIcon
            ? "w-14 h-14 rounded-xl"
            : "w-full h-12 rounded-xl px-4 gap-3"
          }
          bg-white border border-[#0000001A]
          flex items-center justify-center
          hover:bg-gray-50 transition-all
        `}
      >
        <Image src="/google.svg" alt="Google" width={24} height={24} />
        {!isIcon && (
          <span className="text-[14px] font-mabry font-medium text-gray-700">
            Continue with Google
          </span>
        )}
      </div>

      {/*
        ── Invisible Google OAuth layer ──
        Sits exactly on top of the custom button above.
        opacity-0 hides it visually; the click still passes through to the
        Google iframe which handles OAuth and returns the real id_token JWT.
      */}
      <div className="absolute inset-0 opacity-0 overflow-hidden flex items-center justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          type={isIcon ? "icon" : "standard"}
          size="large"
          width={isIcon ? "56" : "500"}
          shape={isIcon ? "circle" : "rectangular"}
        />
      </div>
    </div>
  );
};

export default GoogleLoginButton;
