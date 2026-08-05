"use client";

import Image from "next/image";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";
import { buildGoogleAuthPayload, formatGoogleAuthError } from "@/lib/googleAuth";
import { routeAfterAuthLogin } from "@/lib/postLoginRouting";
import { logger } from "@/utils/logger";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface GoogleLoginButtonProps {
  /**
   * When false, user must tick a terms checkbox before the button works (signup UI only).
   * Defaults to true for login.
   */
  termsAccepted?: boolean;
  className?: string;
  variant?: "icon" | "full";
}

const GoogleLoginButton = ({
  termsAccepted = true,
  className,
  variant = "icon",
}: GoogleLoginButtonProps) => {
  const router = useRouter();
  const { loginWithGoogle, isLoading } = useAuthStore();

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!termsAccepted) {
      toast.error("You must accept the Terms of Use to sign in with Google.");
      return;
    }
    logger.log("Google OAuth initiated");
    if (!credentialResponse.credential) {
      toast.error("Google login failed to return credential");
      return;
    }
    try {
      await loginWithGoogle(buildGoogleAuthPayload(credentialResponse.credential));
      logger.log("Google OAuth successful!");
      toast.success("Login successful! Welcome to Kraftigo.");
      await routeAfterAuthLogin(router);
    } catch (err: unknown) {
      logger.error("Google OAuth failed:", err);
      toast.error(formatGoogleAuthError(err, useAuthStore.getState().error));
    }
  };

  const handleError = () => {
    logger.error("Google OAuth error");
    toast.error("Google sign-in failed. Please try again.");
  };

  const handleBlockedClick = () => {
    toast.error("Accept the Terms of Use before signing in with Google.");
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
      <div
        className={`
          pointer-events-none
          ${isIcon ? "w-14 h-14 rounded-xl" : "w-full h-12 rounded-xl px-4 gap-3"}
          bg-white border border-[#0000001A]
          flex items-center justify-center
          hover:bg-gray-50 transition-all
          ${!termsAccepted ? "opacity-60" : ""}
        `}
      >
        <Image src="/google.svg" alt="Google" width={24} height={24} />
        {!isIcon && (
          <span className="text-[14px] font-mabry font-medium text-gray-700">
            Continue with Google
          </span>
        )}
      </div>

      {termsAccepted ? (
        <div className="absolute inset-0 z-10 opacity-[0.01] cursor-pointer">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            type={isIcon ? "icon" : "standard"}
            size="large"
            width={isIcon ? "56" : "400"}
            shape={isIcon ? "circle" : "rectangular"}
            text={isIcon ? undefined : "continue_with"}
            useOneTap={false}
          />
        </div>
      ) : (
        <button
          type="button"
          aria-label="Sign in with Google — accept terms first"
          onClick={handleBlockedClick}
          className="absolute inset-0 z-10 cursor-not-allowed"
        />
      )}
    </div>
  );
};

export default GoogleLoginButton;
