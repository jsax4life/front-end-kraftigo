"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, Landmark, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";
import Loader from "@/components/ui/loader";
import {
  connectPayoutAccount,
  getPayoutAccountStatus,
  refreshPayoutOnboarding,
  PAYOUT_ACCOUNT_STATUS_INVALIDATE_EVENT,
  type PayoutAccountStatus,
} from "@/lib/api/payouts";

/** Stripe requirement codes are dotted, e.g. `individual.verification.document` — humanize for display. */
function humanizeRequirement(code: string): string {
  return code
    .split(".")
    .join(" · ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function errorMessage(err: unknown, fallback: string): string {
  const ax = err as { response?: { data?: { message?: string } } };
  return ax?.response?.data?.message || fallback;
}

const Page = () => {
  const router = useRouter();

  const [status, setStatus] = useState<PayoutAccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const loadStatus = useCallback(async () => {
    setStatusError(null);
    try {
      const data = await getPayoutAccountStatus();
      setStatus(data);
    } catch (err) {
      setStatusError(errorMessage(err, "Could not load your payout account status."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  // Refresh when returning from Stripe's hosted onboarding, or on the
  // `ARTISAN_STRIPE_CONNECTED` / `ARTISAN_STRIPE_ONBOARDING_COMPLETED` realtime events.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadStatus();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(PAYOUT_ACCOUNT_STATUS_INVALIDATE_EVENT, onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(PAYOUT_ACCOUNT_STATUS_INVALIDATE_EVENT, onVisible);
    };
  }, [loadStatus]);

  const handleBack = () => router.back();

  const goToOnboarding = async (mode: "connect" | "refresh") => {
    setIsRedirecting(true);
    try {
      const link = mode === "connect" ? await connectPayoutAccount() : await refreshPayoutOnboarding();
      if (!link.onboardingUrl) {
        toast.error("Stripe didn't return an onboarding link. Please try again.");
        return;
      }
      window.location.href = link.onboardingUrl;
    } catch (err) {
      // `connect-account` 400s once onboarding is already complete; `refresh-onboarding`
      // 400s if no Connect account exists yet — either way, re-sync and show the right state.
      if (mode === "connect") {
        toast.error(errorMessage(err, "Could not start Stripe onboarding. Please try again."));
        await loadStatus();
      } else {
        try {
          const link = await connectPayoutAccount();
          if (link.onboardingUrl) {
            window.location.href = link.onboardingUrl;
            return;
          }
        } catch (fallbackErr) {
          toast.error(errorMessage(fallbackErr, "Could not resume Stripe onboarding. Please try again."));
          await loadStatus();
          return;
        }
        toast.error(errorMessage(err, "Could not resume Stripe onboarding. Please try again."));
      }
    } finally {
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  const requirementsDue = status?.requirementsDue ?? [];
  const needsAttention =
    !!status?.connected &&
    (!status.onboardingCompleted || requirementsDue.length > 0 || status.accountStatus !== "ACTIVE");
  const isFullySetUp =
    !!status?.connected && status.onboardingCompleted && requirementsDue.length === 0 && status.accountStatus === "ACTIVE";

  return (
    <div className="relative w-full min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl mx-auto min-h-screen flex flex-col py-8">
        <div className="space-y-6 flex-1">
          <div className="flex items-center justify-between mb-5">
            <button onClick={handleBack} className="text-2xl hover:opacity-70 transition-opacity">
              <ArrowLeft />
            </button>
            <span className="text-[14px] text-gray-500 font-poppins">Step 6 of 6</span>
          </div>
          <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-gerat font-bold mb-2">
            Payout Setup
          </h1>
          <p className="text-[16px] font-poppins text-[#2B2F32] mb-6">
            Payouts are handled by Stripe — verify your identity and add a bank account to get paid.
            We never see or store your bank details.
          </p>

          {statusError && (
            <p className="text-[13px] font-poppins text-red-500 mb-4" role="alert">
              {statusError}
            </p>
          )}

          {!status?.connected && (
            <div className="rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-orange/10 text-brand-orange rounded-xl">
                  <Landmark size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-gerat font-bold text-[#1D2939]">
                    Connect your Stripe account
                  </h3>
                  <p className="text-[13px] font-poppins text-[#667085] mt-0.5">
                    Takes a few minutes. Stripe verifies your identity and bank details directly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {needsAttention && status?.connected && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                  <ShieldAlert size={22} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[16px] font-gerat font-bold text-[#1D2939]">
                    {status.onboardingCompleted ? "Action needed on your Stripe account" : "Finish your Stripe onboarding"}
                  </h3>
                  <p className="text-[13px] font-poppins text-[#667085] mt-0.5">
                    Status: <span className="font-semibold">{status.accountStatus}</span>
                  </p>
                </div>
              </div>
              {requirementsDue.length > 0 && (
                <ul className="space-y-1.5 pl-1">
                  {requirementsDue.map((req) => (
                    <li key={req} className="text-[13px] font-poppins text-[#475467] flex gap-2">
                      <span className="text-amber-600">•</span>
                      {humanizeRequirement(req)}
                    </li>
                  ))}
                </ul>
              )}
              {!status.chargesEnabled || !status.payoutsEnabled ? (
                <p className="text-[12px] font-poppins text-[#98A2B3]">
                  {!status.payoutsEnabled
                    ? "Stripe hasn't enabled payouts on this account yet."
                    : "Stripe hasn't enabled charges on this account yet."}
                </p>
              ) : null}
            </div>
          )}

          {isFullySetUp && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                  <CheckCircle2 size={22} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-[16px] font-gerat font-bold text-[#1D2939]">You&apos;re all set</h3>
                  <p className="text-[13px] font-poppins text-[#667085] mt-0.5">
                    Your Stripe account is verified and ready to receive payouts.
                  </p>
                </div>
              </div>
              {status?.stripeAccountId && (
                <p className="text-[11px] font-poppins text-[#98A2B3]">
                  Stripe account: {status.stripeAccountId}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="text-center text-[14px] font-poppins mt-8 pb-3 space-y-3">
          {!status?.connected && (
            <Button
              variant="primary"
              onClick={() => void goToOnboarding("connect")}
              disabled={isRedirecting}
              fullWidth
              className="py-4 text-[16px] font-gerat font-bold flex items-center justify-center gap-2"
            >
              {isRedirecting ? "Opening Stripe…" : "Connect Stripe Account"}
              {!isRedirecting && <ExternalLink size={16} />}
            </Button>
          )}

          {needsAttention && status?.connected && (
            <Button
              variant="primary"
              onClick={() => void goToOnboarding("refresh")}
              disabled={isRedirecting}
              fullWidth
              className="py-4 text-[16px] font-gerat font-bold flex items-center justify-center gap-2"
            >
              {isRedirecting ? "Opening Stripe…" : "Continue with Stripe"}
              {!isRedirecting && <ExternalLink size={16} />}
            </Button>
          )}

          {isFullySetUp && (
            <Button
              variant="primary"
              onClick={() => router.push("/tasker/profile/earnings")}
              fullWidth
              className="py-4 text-[16px] font-gerat font-bold"
            >
              Go to Wallet
            </Button>
          )}

          <button
            onClick={() => void loadStatus()}
            disabled={isLoading}
            className="font-bold mt-1 disabled:opacity-50 text-[13px] text-[#667085]"
          >
            Refresh status
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;
