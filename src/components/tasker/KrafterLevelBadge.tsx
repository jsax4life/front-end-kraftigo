"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useProfileStore } from "@/store/useProfileStore";
import { isKrafterIdentityVerifiedFromSources } from "@/lib/krafterLevelDisplay";
import {
  getVerificationMyStatus,
  hasOpenDiditKycSession,
  resolveEffectiveKycStatus,
  startDiditKycSession,
} from "@/lib/api/verification";

type KrafterLevelBadgeProps = {
  /** Dashboard header — badge icon + orange text */
  variant?: "compact" | "pill";
  className?: string;
};

export default function KrafterLevelBadge({
  variant = "compact",
  className = "",
}: KrafterLevelBadgeProps) {
  const [isStartingKyc, setIsStartingKyc] = useState(false);
  const {
    profileCompletionSummary,
    fetchKrafterProfileCompletionSummary,
    verificationStatus,
    fetchVerificationStatusSilent,
  } = useProfileStore();

  useEffect(() => {
    void fetchKrafterProfileCompletionSummary();
    void fetchVerificationStatusSilent();
  }, [fetchKrafterProfileCompletionSummary, fetchVerificationStatusSilent]);

  const identityVerified = isKrafterIdentityVerifiedFromSources({
    summary: profileCompletionSummary,
    verificationStatus,
  });

  const handleStartDiditVerification = async () => {
    setIsStartingKyc(true);
    try {
      const status = await getVerificationMyStatus();
      if (resolveEffectiveKycStatus(status) === "APPROVED") {
        toast.success("Your identity is already verified!");
        await fetchKrafterProfileCompletionSummary();
        await fetchVerificationStatusSilent();
        return;
      }
      const isResuming = hasOpenDiditKycSession(status);
      const { verificationUrl } = await startDiditKycSession();
      toast.success(
        isResuming
          ? "Resuming your verification session..."
          : "Starting identity verification...",
      );
      window.location.href = verificationUrl;
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Failed to start identity verification. Please try again.";
      toast.error(message);
    } finally {
      setIsStartingKyc(false);
    }
  };

  const levelLabel = identityVerified ? "Lvl 2" : "Lvl 1";

  return (
    <div className={`flex flex-col items-start gap-0.5 ${className}`}>
      {variant === "pill" ? (
        <div className="flex items-center gap-1.5 bg-orange-50 text-brand-orange px-2 py-0.5 rounded-full w-fit">
          <Star size={12} className="fill-brand-orange shrink-0" />
          <span className="text-[12px] font-bold font-poppins uppercase tracking-wider">
            {levelLabel}
          </span>
        </div>
      ) : (
        <span className="flex items-center gap-1">
          <Image
            src="/badge.svg"
            alt=""
            width={100}
            height={100}
            className="w-3 h-3 sm:w-3.5 sm:h-3.5"
          />
          <p className="font-poppins font-bold text-[11px] sm:text-[12px] text-brand-orange">
            {levelLabel}
          </p>
        </span>
      )}

      {!identityVerified ? (
        <button
          type="button"
          disabled={isStartingKyc}
          onClick={() => void handleStartDiditVerification()}
          className="font-poppins text-[10px] sm:text-[11px] text-brand-blue underline underline-offset-2 text-left disabled:opacity-60 max-w-[220px] sm:max-w-none"
        >
          {isStartingKyc
            ? "Opening verification…"
            : "Verify document to get to Lvl 2"}
        </button>
      ) : null}
    </div>
  );
}
