"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, FileCheck2, Shield, Sparkles } from "lucide-react";
import Button from "@/components/ui/button";
import Loader from "@/components/ui/loader";
import { useAuthStore } from "@/store/useAuthStore";
import { useProfileStore } from "@/store/useProfileStore";
import {
  getVerificationMyStatus,
  getVerificationWire,
  hasOpenDiditKycSession,
  shouldRedirectToDiditKyc,
  shouldRouteToKrafterProfileOnboarding,
  type VerificationMyStatus,
} from "@/lib/api/verification";

function formatKycSessionHint(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Didit session started just now";
  if (mins < 60) return `Didit session started ${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `Didit session started ${hrs}h ago`;
  return "Didit session is open — you can continue anytime";
}

export default function KrafterKycWelcomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { customerProfile, fetchCustomerProfile } = useProfileStore();
  const [checking, setChecking] = useState(true);
  const [allowedStatus, setAllowedStatus] = useState<VerificationMyStatus | null>(null);

  useEffect(() => {
    if (!customerProfile) {
      void fetchCustomerProfile();
    }
  }, [customerProfile, fetchCustomerProfile]);

  const firstName =
    ( user?.firstName || "there").trim().split(/\s+/)[0] || "there";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await getVerificationMyStatus();
        if (cancelled) return;
        if (!shouldRedirectToDiditKyc(status)) {
          const { verificationState, kycStatus } = getVerificationWire(status);
          if (shouldRouteToKrafterProfileOnboarding(status)) {
            router.replace("/krafter/dashboard");
          } else if (kycStatus === "REJECTED") {
            router.replace("/krafter/verification");
          } else if (verificationState === "PENDING") {
            router.replace("/krafter/dashboard");
          } else {
            router.replace("/krafter/verification");
          }
          return;
        }
        setAllowedStatus(status);
      } catch {
        if (!cancelled) router.replace("/krafter/verification");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const resumeDidit = hasOpenDiditKycSession(allowedStatus);
  const sessionHint = formatKycSessionHint(allowedStatus?.kycSessionCreatedAt);

  if (checking || !allowedStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#faf8f5]">
        <Loader />
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#faf8f5]">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-90 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255, 102, 0, 0.45) 0%, rgba(0, 0, 255, 0.12) 45%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-16 h-72 w-72 rounded-full opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(255, 102, 0, 0.2) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-5 pb-10 pt-14">
        <button
          type="button"
          onClick={() => router.push("/krafter/verification")}
          className="mb-8 flex w-fit items-center gap-2 rounded-full px-1 py-1 font-poppins text-[13px] text-[rgba(0,0,0,0.65)] transition-colors hover:text-black"
        >
          <ArrowLeft size={18} strokeWidth={2} />
          Back to profile
        </button>

        <div className="mb-8 flex justify-center">
          <div className="relative flex h-[120px] w-[120px] items-center justify-center">
            <div
              className="absolute inset-0 animate-pulse rounded-[32px] opacity-40"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 102, 0, 0.35) 0%, rgba(0, 0, 255, 0.15) 100%)",
              }}
            />
            <div className="relative flex h-[104px] w-[104px] items-center justify-center rounded-[28px] border border-white/80 bg-white/90 shadow-[0_20px_50px_rgba(255,102,0,0.15)] backdrop-blur-sm">
              <div className="flex gap-1">
                <FileCheck2 className="text-[#FF6600]" size={36} strokeWidth={1.75} />
                <Shield className="text-[rgba(0,0,0,0.35)]" size={28} strokeWidth={1.5} />
              </div>
            </div>
            <div className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6600] shadow-lg">
              <Sparkles className="text-white" size={18} strokeWidth={2} />
            </div>
          </div>
        </div>

        <p className="text-center font-poppins text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FF6600]">
          {resumeDidit ? "Pick up where you left off" : "Welcome back"}
        </p>
        <h1 className="mt-2 text-center font-gerat text-[28px] font-[850] leading-tight tracking-[-0.04em] text-[rgba(0,0,0,0.88)]">
          Hi, {firstName}
        </h1>
        <p className="mx-auto mt-4 max-w-[320px] text-center font-poppins text-[15px] leading-relaxed text-[rgba(0,0,0,0.62)]">
          {resumeDidit ? (
            <>
              You have an open identity verification session. Continue on Didit to finish KYC — it only
              takes a few minutes. If you closed the tab, no problem; your documents are still with us.
            </>
          ) : (
            <>
              Your Krafter documents are already with us and queued for review. One quick step left —
              complete secure identity verification (KYC) so we can finish checking your profile.
            </>
          )}
        </p>

        <div className="mx-auto mt-10 w-full max-w-[340px] rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white/80 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.06)] backdrop-blur-md">
          <p className="mb-4 font-poppins text-[12px] font-bold uppercase tracking-wide text-[rgba(0,0,0,0.45)]">
            Your progress
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF6600] text-[11px] font-bold text-white">
                ✓
              </span>
              <div>
                <p className="font-poppins text-[14px] font-semibold text-[rgba(0,0,0,0.85)]">
                  Documents submitted
                </p>
                <p className="font-poppins text-[12px] text-[rgba(0,0,0,0.5)]">
                  We&apos;re reviewing your application
                </p>
              </div>
            </div>
            <div className="ml-[13px] h-6 w-px bg-linear-to-b from-[#FF6600]/40 to-transparent" />
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  resumeDidit
                    ? "border-2 border-[#FF6600] bg-[#FF6600]/10 text-[#FF6600]"
                    : "border-2 border-dashed border-[#FF6600]/50 bg-[#FF6600]/5 text-[#FF6600]"
                }`}
              >
                {resumeDidit ? "→" : "2"}
              </span>
              <div>
                <p className="font-poppins text-[14px] font-semibold text-[rgba(0,0,0,0.85)]">
                  {resumeDidit ? "Continue identity verification" : "Identity verification (KYC)"}
                </p>
                <p className="font-poppins text-[12px] text-[rgba(0,0,0,0.5)]">
                  {resumeDidit
                    ? "We’ll open your Didit session again from our servers."
                    : "Powered by our secure partner — takes only a few minutes"}
                </p>
                {sessionHint && (
                  <p className="mt-2 font-poppins text-[11px] text-[rgba(0,0,0,0.42)]">{sessionHint}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-10">
          <Button
            type="button"
            fullWidth
            className="rounded-[14px] font-poppins! text-[15px] font-semibold shadow-[0_12px_28px_rgba(255,102,0,0.35)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
            onClick={() => router.push("/krafter/kyc")}
          >
            {resumeDidit ? "Continue Didit verification" : "Continue to KYC verification"}
          </Button>
          <button
            type="button"
            onClick={() => router.push("/tasker/dashboard")}
            className="py-2 text-center font-poppins text-[13px] text-[rgba(0,0,0,0.45)] underline-offset-4 hover:text-[rgba(0,0,0,0.7)] hover:underline"
          >
            I&apos;ll do this later
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
          <Image src="/images/pro.jpg" alt="" width={40} height={40} className="rounded-lg object-cover" />
          <span className="font-poppins text-[10px] text-[rgba(0,0,0,0.5)]">Kraftigo Krafter</span>
        </div>
      </div>
    </main>
  );
}
