"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Loader from "@/components/ui/loader";
import Button from "@/components/ui/button";
import {
  getVerificationMyStatus,
  getKrafterVerificationContinuePath,
  isProviderDiditApproved,
  isTerminalEffectiveKyc,
  normalizeKycStatusToken,
  resolveEffectiveKycStatus,
  shouldPollVerificationMyStatus,
  shouldRouteToKrafterProfileOnboarding,
  syncDiditVerificationReturn,
  type KycStatus,
  type VerificationMyStatus,
} from "@/lib/api/verification";
import { useProfileStore } from "@/store/useProfileStore";

const POLL_MS = 3000;
const MAX_POLLS = 80;

/** Didit may send `status` like `In+Review` — normalize for display. */
function formatProviderStatusParam(raw: string | null): string {
  if (!raw) return "";
  const withSpaces = raw.replace(/\+/g, " ");
  try {
    return decodeURIComponent(withSpaces);
  } catch {
    return withSpaces;
  }
}

function isTerminalKyc(kyc: KycStatus | null | undefined): kyc is KycStatus {
  return kyc === "APPROVED" || kyc === "REJECTED";
}

function shouldKeepPolling(status: VerificationMyStatus | null): boolean {
  return shouldPollVerificationMyStatus(status);
}

const KYC_DISPLAY: Record<string, string> = {
  NOT_STARTED: "Not started",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function DiditReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const verificationSessionId = searchParams.get("verificationSessionId");
  const providerStatusRaw = searchParams.get("status");
  const providerStatusLabel = formatProviderStatusParam(providerStatusRaw);

  const [myStatus, setMyStatus] = useState<VerificationMyStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const pollCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshStatus = useCallback(async () => {
    const data = await getVerificationMyStatus();
    setMyStatus(data);
    useProfileStore.setState({ verificationStatus: data });
    return data;
  }, []);

  const runServerSync = useCallback(async () => {
    const sessionId = verificationSessionId?.trim();
    if (!sessionId) return null;
    try {
      return await syncDiditVerificationReturn({
        verificationSessionId: sessionId,
        providerStatus: providerStatusRaw,
      });
    } catch {
      return null;
    }
  }, [providerStatusRaw, verificationSessionId]);

  const applyStatus = useCallback((data: VerificationMyStatus) => {
    setMyStatus(data);
    useProfileStore.setState({ verificationStatus: data });
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    pollCountRef.current = 0;
    setTimedOut(false);
    if (verificationSessionId?.trim()) setSyncAttempted(true);

    const scheduleNext = () => {
      if (cancelled) return;
      timeoutRef.current = setTimeout(runPoll, POLL_MS);
    };

    async function runPoll() {
      if (cancelled) return;
      try {
        setLoadError(null);
        const data = await refreshStatus();
        if (cancelled) return;

        if (isTerminalEffectiveKyc(data)) {
          setPolling(false);
          return;
        }

        if (shouldKeepPolling(data)) {
          pollCountRef.current += 1;
          if (pollCountRef.current >= MAX_POLLS) {
            setPolling(false);
            setTimedOut(true);
            return;
          }
          setPolling(true);
          scheduleNext();
          return;
        }

        setPolling(false);
      } catch (e: unknown) {
        if (cancelled) return;
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        setLoadError(
          err?.response?.data?.message || err?.message || "Could not load verification status",
        );
        setPolling(false);
      }
    }

    void (async () => {
      const synced = await runServerSync();
      if (cancelled) return;
      if (synced) {
        applyStatus(synced);
        if (isTerminalEffectiveKyc(synced)) {
          setPolling(false);
          return;
        }
      }
      void runPoll();
    })();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [applyStatus, refreshStatus, runServerSync, pollAttempt, verificationSessionId]);

  const handleRefreshStatus = () => {
    void (async () => {
      const synced = await runServerSync();
      if (synced) applyStatus(synced);
      setPollAttempt((n) => n + 1);
    })();
  };

  const kyc = resolveEffectiveKycStatus(myStatus);
  const terminal = isTerminalKyc(kyc);
  const krafterContinuePath = getKrafterVerificationContinuePath(myStatus);
  const providerApproved = isProviderDiditApproved(providerStatusRaw);
  const showProviderSyncDelay = !terminal && providerApproved && (polling || timedOut);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#faf8f5] px-5 pb-12 pt-14">
      <div
        className="pointer-events-none absolute -top-24 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full opacity-90 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(255, 102, 0, 0.35) 0%, rgba(0, 0, 255, 0.1) 50%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <h1 className="text-center font-gerat text-[24px] font-[850] tracking-[-0.03em] text-[rgba(0,0,0,0.88)]">
          Identity verification
        </h1>
        <p className="mx-auto mt-2 max-w-[320px] text-center font-poppins text-[13px] leading-relaxed text-[rgba(0,0,0,0.55)]">
          We&apos;re syncing your result with Kraftigo. Final status comes from our servers — not from
          the address bar.
        </p>

        {(verificationSessionId || providerStatusLabel) && (
          <div className="mt-8 rounded-[14px] border border-[rgba(0,0,0,0.06)] bg-white/90 p-4 text-left shadow-sm backdrop-blur-sm">
            <p className="font-poppins text-[11px] font-semibold uppercase tracking-wide text-[rgba(0,0,0,0.4)]">
              Didit callback (reference)
            </p>
            {verificationSessionId && (
              <p className="mt-2 break-all font-poppins text-[12px] text-[rgba(0,0,0,0.65)]">
                <span className="text-[rgba(0,0,0,0.45)]">Session: </span>
                {verificationSessionId}
              </p>
            )}
            {providerStatusLabel && (
              <p className="mt-1 font-poppins text-[12px] text-[rgba(0,0,0,0.65)]">
                <span className="text-[rgba(0,0,0,0.45)]">Provider status: </span>
                {providerStatusLabel}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 rounded-[20px] border border-[rgba(0,0,0,0.06)] bg-white/95 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          {loadError && (
            <p className="text-center font-poppins text-[14px] text-red-600">{loadError}</p>
          )}

          {!loadError && !myStatus && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="text-[#FF6600] animate-spin" size={32} />
              <p className="font-poppins text-[14px] text-[rgba(0,0,0,0.65)]">
                Loading your verification status…
              </p>
            </div>
          )}

          {!loadError && myStatus && (
            <>
              <div className="flex items-center gap-2 border-b border-[rgba(0,0,0,0.06)] pb-4">
                <span className="font-poppins text-[10px] font-bold uppercase tracking-wide text-[rgba(0,0,0,0.4)]">
                  Kraftigo KYC
                </span>
                {polling && !terminal && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6600]/10 px-2 py-0.5 font-poppins text-[10px] font-bold uppercase tracking-wide text-[#FF6600]">
                    <Loader2 className="animate-spin" size={12} />
                    Updating
                  </span>
                )}
              </div>

              <p className="mt-4 font-poppins text-[13px] text-[rgba(0,0,0,0.5)]">
                Current status
              </p>
              <p className="mt-1 font-poppins text-[20px] font-bold text-[rgba(0,0,0,0.88)]">
                {(kyc && KYC_DISPLAY[kyc]) ||
                  normalizeKycStatusToken(myStatus?.kycStatus)?.replace(/_/g, " ") ||
                  myStatus?.kycStatus?.replace(/_/g, " ") ||
                  "—"}
              </p>

              {kyc === "APPROVED" && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <CheckCircle2 className="text-emerald-600" size={44} strokeWidth={1.75} />
                  <p className="text-center font-poppins text-[14px] leading-relaxed text-[rgba(0,0,0,0.65)]">
                    {shouldRouteToKrafterProfileOnboarding(myStatus)
                      ? "Identity verification is complete. While we review your application, you can finish your Krafter profile."
                      : "Your identity verification is complete. Thank you!"}
                  </p>
                  <Button
                    type="button"
                    fullWidth
                    className="font-poppins! font-semibold"
                    onClick={() => router.push(krafterContinuePath)}
                  >
                    {shouldRouteToKrafterProfileOnboarding(myStatus)
                      ? "Continue Krafter profile"
                      : "Continue verification"}
                  </Button>
                  <button
                    type="button"
                    className="font-poppins text-[13px] text-[rgba(0,0,0,0.55)] underline-offset-4 hover:underline cursor-pointer"
                    onClick={() => router.push(krafterContinuePath)}
                  >
                    Back to profile
                  </button>
                </div>
              )}

              {kyc === "REJECTED" && (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <XCircle className="text-red-500" size={44} strokeWidth={1.75} />
                  <p className="text-center font-poppins text-[14px] leading-relaxed text-[rgba(0,0,0,0.65)]">
                    We couldn&apos;t verify your identity this time. Check your email or contact
                    support if you need help.
                  </p>
                  <Button
                    type="button"
                    fullWidth
                    className="font-poppins! font-semibold"
                    onClick={() => router.push("/krafter/kyc")}
                  >
                    Retry
                  </Button>
                  <button
                    type="button"
                    className="font-poppins text-[13px] text-[rgba(0,0,0,0.55)] underline-offset-4 hover:underline cursor-pointer"
                    onClick={() => router.push(krafterContinuePath)}
                  >
                    Back to profile
                  </button>
                </div>
              )}

              {!terminal && !timedOut && shouldKeepPolling(myStatus) && (
                <p className="mt-4 text-center font-poppins text-[13px] leading-relaxed text-[rgba(0,0,0,0.55)]">
                  {showProviderSyncDelay
                    ? "Didit marked your check as approved. Waiting for Kraftigo to finish syncing — this usually takes a few seconds."
                    : "Waiting for our servers to confirm your Didit session… This usually takes a few seconds."}
                </p>
              )}

              {showProviderSyncDelay && timedOut && (
                <p className="mt-4 text-center font-poppins text-[13px] leading-relaxed text-amber-900 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  Didit shows approved, but our servers have not updated yet. Try refresh below, or
                  continue and check your Krafter dashboard in a moment. If this persists, the Didit
                  webhook may need attention on the backend.
                </p>
              )}

              {timedOut && !terminal && (
                <div className="mt-6 space-y-3">
                  <p className="text-center font-poppins text-[14px] text-[rgba(0,0,0,0.65)]">
                    Status is still updating. You can check again from your profile in a moment.
                  </p>
                  <Button
                    type="button"
                    fullWidth
                    variant="outline"
                    className="font-poppins! font-semibold"
                    onClick={handleRefreshStatus}
                  >
                    Refresh status
                  </Button>
                  {providerApproved ? (
                    <Button
                      type="button"
                      fullWidth
                      className="font-poppins! font-semibold"
                      onClick={() => router.push(krafterContinuePath)}
                    >
                      Continue to Krafter profile
                    </Button>
                  ) : null}
                  <Link
                    href={krafterContinuePath}
                    className="block text-center font-poppins text-[13px] text-[#FF6600] underline-offset-4 hover:underline"
                  >
                    Back to Krafter profile
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        <p className="mx-auto mt-8 max-w-[340px] text-center font-poppins text-[11px] leading-relaxed text-[rgba(0,0,0,0.38)]">
          Kraftigo reads <code className="rounded bg-black/5 px-1">GET /api/verification/my-status</code>
          {syncAttempted ? " and requests a server sync when you land here." : "."}
        </p>
      </div>
    </main>
  );
}

export default function DiditReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#faf8f5]">
          <Loader />
          <p className="font-poppins text-[13px] text-[rgba(0,0,0,0.55)]">Loading…</p>
        </div>
      }
    >
      <DiditReturnContent />
    </Suspense>
  );
}
