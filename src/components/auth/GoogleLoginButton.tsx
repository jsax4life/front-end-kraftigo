"use client";

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
      // credentialResponse.credential contains the JWT idToken
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

  return (
    <div className={`flex items-center justify-center ${isLoading ? 'opacity-50 pointer-events-none' : ''} ${className || ''}`}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        type={variant === "icon" ? "icon" : "standard"}
        theme="outline"
        size="large"
        shape={variant === "full" ? "rectangular" : "circle"}
        text="continue_with"
        logo_alignment="center"
      />
    </div>
  );
};

export default GoogleLoginButton;
