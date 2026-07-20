"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Home, ExternalLink, ShieldAlert } from "lucide-react";
import TaskerNav from "@/components/shared/taskerNav";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getWalletSummary,
  getPayoutAccountStatus,
  postPayoutWithdraw,
  WALLET_SUMMARY_INVALIDATE_EVENT,
  PAYOUT_ACCOUNT_STATUS_INVALIDATE_EVENT,
  type ArtisanWalletSummary,
  type PayoutAccountStatus,
  type WalletDailyEarning,
  type WalletRecentActivity,
} from "@/lib/api/payouts";

function formatWalletMoney(amount: number, currency: string): string {
  const code = typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase() : "EUR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code}`;
  }
}

function formatNextRelease(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatActivityDate(raw: string | undefined): string {
  if (!raw?.trim()) return "—";
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }
  return raw;
}

function firstString(o: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function firstNumber(o: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return 0;
}

type ActivityTone = "success" | "info" | "danger";

function activityTone(statusRaw: string): ActivityTone {
  const u = statusRaw.toUpperCase();
  if (u.includes("CANCEL") || u.includes("FAIL") || u.includes("REFUND")) return "danger";
  if (u.includes("PEND") || u.includes("PROCESS") || u.includes("HOLD")) return "info";
  return "success";
}

function mapRecentActivities(items: WalletRecentActivity[]): {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  statusLabel: string;
  tone: ActivityTone;
}[] {
  return items.map((raw, i) => {
    const o = raw as Record<string, unknown>;
    const title =
      firstString(o, ["title", "jobTitle", "bookingTitle", "label", "description"]) ||
      (typeof o.type === "string" ? o.type : "Activity");
    const rawDate = firstString(o, [
      "date",
      "occurredAt",
      "createdAt",
      "completedAt",
      "timestamp",
      "scheduledAt",
    ]);
    const amount = firstNumber(o, ["amount", "netAmount", "value", "grossAmount"]);
    const statusRaw = firstString(o, ["status", "state"]) || "Completed";
    return {
      id: `${i}-${title.slice(0, 20)}`,
      title,
      subtitle: formatActivityDate(rawDate),
      amount,
      statusLabel: statusRaw.replace(/_/g, " "),
      tone: activityTone(statusRaw),
    };
  });
}

function WeeklyEarningsChart({ daily }: { daily: WalletDailyEarning[] }) {
  const w = 400;
  const h = 120;
  const padL = 20;
  const padR = 16;
  const padT = 10;
  const padB = 22;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const series = daily.length ? daily : [{ date: "", dayLabel: "—", amount: 0 }];
  const amounts = series.map((d) => d.amount);
  const maxA = Math.max(...amounts, 0);
  const flat = maxA <= 0;
  const denom = flat ? 1 : maxA;
  const n = series.length;

  const xs = series.map((_, i) =>
    n === 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW,
  );
  const ys = series.map((d) => {
    if (flat) return padT + plotH * 0.92;
    return padT + plotH * (1 - d.amount / denom);
  });

  const pathMain = series
    .map((_, i) => `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`)
    .join(" ");

  const pathGuide = series
    .map((d, i) => {
      const y = flat ? padT + plotH * 0.75 : padT + plotH * (1 - (d.amount * 0.85) / denom);
      return `${i === 0 ? "M" : "L"} ${xs[i].toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="w-full h-32 relative mt-4">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {[0, 0.33, 0.66].map((t) => (
          <line
            key={t}
            x1={padL}
            y1={padT + plotH * t}
            x2={w - padR}
            y2={padT + plotH * t}
            stroke="#F2F4F7"
            strokeWidth="1"
          />
        ))}
        <path
          d={pathGuide}
          fill="none"
          stroke="#FF6600"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.45"
        />
        <path d={pathMain} fill="none" stroke="#FF6600" strokeWidth="2.5" strokeLinecap="round" />
        {series.map((_, i) => (
          <circle
            key={i}
            cx={xs[i]}
            cy={ys[i]}
            r="3"
            fill="#1D2939"
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
        {series.map((d, i) => (
          <text
            key={`${d.dayLabel}-${d.date}-${i}`}
            x={xs[i] ?? padL}
            y={h - 4}
            fontSize="10"
            fill="#98A2B3"
            fontFamily="Poppins"
            textAnchor="middle"
          >
            {d.dayLabel || "—"}
          </text>
        ))}
      </svg>
    </div>
  );
}

const toneClass: Record<ActivityTone, string> = {
  success: "text-[#00A651]",
  info: "text-brand-blue",
  danger: "text-[#F04438]",
};

const ActivityRow = ({
  title,
  subtitle,
  amountText,
  statusLabel,
  tone,
}: {
  title: string;
  subtitle: string;
  amountText: string;
  statusLabel: string;
  tone: ActivityTone;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-[#F2F4F7] last:border-0 hover:bg-gray-50 px-2 transition-colors">
    <div className="flex items-center gap-4 min-w-0">
      <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-xl shrink-0">
        <Home size={22} strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-poppins font-medium text-[#1D2939] leading-tight truncate">{title}</p>
        <p className="text-[12px] font-poppins text-[#667085] mt-0.5 truncate">{subtitle}</p>
      </div>
    </div>
    <div className="text-right shrink-0 pl-2">
      <p className={`text-[15px] font-poppins font-bold ${toneClass[tone]}`}>{amountText}</p>
      <p className="text-[10px] font-poppins text-[#98A2B3] mt-0.5 uppercase tracking-wider line-clamp-1">
        {statusLabel}
      </p>
    </div>
  </div>
);

const EarningsPage = () => {
  const router = useRouter();
  const [wallet, setWallet] = useState<ArtisanWalletSummary | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [payoutAccount, setPayoutAccount] = useState<PayoutAccountStatus | null>(null);
  const [payoutAccountLoading, setPayoutAccountLoading] = useState(true);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const data = await getWalletSummary();
      setWallet(data);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      const msg = ax.response?.data?.message ?? "Could not load wallet.";
      setWalletError(msg);
      setWallet(null);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadPayoutAccount = useCallback(async () => {
    setPayoutAccountLoading(true);
    try {
      const data = await getPayoutAccountStatus();
      setPayoutAccount(data);
    } catch {
      setPayoutAccount(null);
    } finally {
      setPayoutAccountLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
    void loadPayoutAccount();
  }, [loadWallet, loadPayoutAccount]);

  useEffect(() => {
    const onInvalidate = () => {
      void loadWallet();
    };
    window.addEventListener(WALLET_SUMMARY_INVALIDATE_EVENT, onInvalidate);
    return () => window.removeEventListener(WALLET_SUMMARY_INVALIDATE_EVENT, onInvalidate);
  }, [loadWallet]);

  useEffect(() => {
    const onInvalidate = () => {
      void loadPayoutAccount();
    };
    window.addEventListener(PAYOUT_ACCOUNT_STATUS_INVALIDATE_EVENT, onInvalidate);
    return () => window.removeEventListener(PAYOUT_ACCOUNT_STATUS_INVALIDATE_EVENT, onInvalidate);
  }, [loadPayoutAccount]);

  const withdrawableAmount = wallet
    ? Math.max(wallet.availableToWithdrawAmount, wallet.availableForWithdrawal)
    : 0;

  // `canWithdraw` from `account-status` is a UX gate only — the backend always
  // re-verifies balance/hold/Stripe eligibility server-side on the actual withdraw call.
  const isStripeConnected = payoutAccount?.connected ?? false;
  const canWithdrawPerAccount = payoutAccount?.canWithdraw ?? false;

  const handleWithdraw = async () => {
    if (!wallet || withdrawableAmount <= 0 || withdrawLoading) return;
    setWithdrawLoading(true);
    try {
      const result = await postPayoutWithdraw();
      const amountLabel = result.amount > 0 ? formatWalletMoney(result.amount, result.currency || cur) : null;
      toast.success(
        amountLabel
          ? `${amountLabel} is on its way to your bank.`
          : "Withdrawal started. Balances update when the transfer completes.",
      );
      await Promise.all([loadWallet(), loadPayoutAccount()]);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message ?? "Withdrawal could not be started. Try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const cur = "EUR";
  const fmt = useCallback((n: number) => formatWalletMoney(n, cur), [cur]);
  const nextLabel = formatNextRelease(wallet?.nextReleaseAt ?? null);

  const activityRows = useMemo(
    () => (wallet ? mapRecentActivities(wallet.recentActivities) : []),
    [wallet],
  );

  const weekly = wallet?.weeklyEarnings;
  const daily = weekly?.daily?.length ? weekly.daily : [];

  const recentWithdrawalLine = useMemo(() => {
    const rw = wallet?.recentWithdrawal;
    if (!rw || typeof rw !== "object") return null;
    const o = rw as Record<string, unknown>;
    const amt = firstNumber(o, ["amount", "value"]);
    const when = firstString(o, ["completedAt", "createdAt", "occurredAt"]);
    const status = firstString(o, ["status", "state"]);
    if (amt <= 0 && !when && !status) return null;
    const parts: string[] = [];
    if (amt > 0) parts.push(fmt(amt));
    if (when) parts.push(formatActivityDate(when));
    if (status) parts.push(status.replace(/_/g, " "));
    return parts.length ? parts.join(" · ") : null;
  }, [wallet, fmt]);

  return (
    <main className="min-h-screen bg-white">
      <div className="w-full flex items-center justify-between py-6 px-4 bg-white border-b border-[#F2F4F7]">
        <button type="button" onClick={() => router.back()} className="p-1 hover:opacity-70 transition-opacity">
          <ChevronLeft className="w-8 h-8 text-[#1D2939]" strokeWidth={1.5} />
        </button>
        <div className="text-center pr-10 flex-1">
          <h1 className="text-[20px] font-gerat font-bold text-[#1D2939]">Earnings</h1>
        </div>
      </div>

      <div className="px-5 py-8 space-y-8 max-w-4xl mx-auto pb-32">
        <section className="bg-white rounded-3xl p-6 border border-[#EAECF0] shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-[13px] font-poppins text-[#667085]">Weekly earnings</p>
              {walletLoading && !wallet ? (
                <h3 className="text-[32px] font-gerat font-bold text-[#1D2939] leading-tight">…</h3>
              ) : (
                <h3 className="text-[32px] font-gerat font-bold text-[#1D2939] leading-tight">
                  {fmt(weekly?.total ?? 0)}
                </h3>
              )}
              <p className="text-[11px] font-poppins text-[#98A2B3]">{weekly?.label ?? "This week"}</p>
            </div>
            <span className="shrink-0 flex items-center gap-2 bg-[#F6F6F6] text-[#475467] font-poppins text-[12px] font-medium px-4 py-2 rounded-xl border border-[#D0D5DD]">
              Week <ChevronLeft size={14} className="-rotate-90" aria-hidden />
            </span>
          </div>
          {walletLoading && !wallet ? (
            <div className="flex justify-center py-10 mt-4">
              <div className="animate-spin rounded-full h-9 w-9 border-2 border-brand-orange border-t-transparent" />
            </div>
          ) : (
            <WeeklyEarningsChart daily={daily} />
          )}
        </section>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-[#EAECF0]">
            <p className="text-[12px] font-poppins text-[#667085] mb-2 font-medium">Tasks completed</p>
            <p className="text-[32px] font-gerat font-bold text-[#1D2939]">
              {walletLoading && !wallet ? "…" : wallet != null ? wallet.tasksCompleted : "—"}
            </p>
          </div>
          <div className="bg-[#F9FAFB] p-5 rounded-2xl border border-[#EAECF0]">
            <p className="text-[12px] font-poppins text-[#667085] mb-2 font-medium">Avg hourly rate</p>
            <p className="text-[32px] font-gerat font-bold text-[#1D2939]">
              {walletLoading && !wallet ? "…" : fmt(wallet?.averageHourlyRate ?? 0)}
              {!walletLoading && wallet ? (
                <span className="text-[14px] font-poppins font-medium text-[#667085]">/hr</span>
              ) : null}
            </p>
          </div>
        </div>

        <section className="space-y-6 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h2 className="text-[18px] font-gerat font-bold text-[#475467]">Wallet</h2>
              <p className="text-[12px] font-poppins text-[#667085]">
                {walletLoading ? "Loading…" : `Balances · ${cur}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadWallet()}
              disabled={walletLoading}
              className="shrink-0 text-[12px] font-poppins font-semibold text-brand-orange hover:text-orange-700 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {walletError && (
            <p className="text-sm text-red-600 font-poppins" role="alert">
              {walletError}
            </p>
          )}

          {walletLoading && !wallet ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-9 w-9 border-2 border-brand-orange border-t-transparent" />
            </div>
          ) : wallet ? (
            <>
              <div className="space-y-1">
                <p className="text-[13px] font-poppins text-[#667085]">Available to withdraw</p>
                <p className="text-[36px] font-gerat font-bold text-brand-orange leading-tight">
                  {fmt(withdrawableAmount)}
                </p>
                <p className="text-[13px] font-poppins text-[#667085]">
                  {wallet.availableToWithdrawCount} payout
                  {wallet.availableToWithdrawCount === 1 ? "" : "s"} ready for transfer
                </p>
                {wallet.availableForWithdrawal !== wallet.availableToWithdrawAmount ? (
                  <p className="text-[11px] font-poppins text-[#98A2B3]">
                    Alternate field: {fmt(wallet.availableForWithdrawal)}
                  </p>
                ) : null}
                {nextLabel ? (
                  <p className="text-[12px] font-poppins text-[#98A2B3] pt-1">
                    Next funds release: {nextLabel}
                  </p>
                ) : null}
              </div>

              {recentWithdrawalLine ? (
                <div className="rounded-2xl border border-[#EAECF0] bg-[#F9FAFB] px-4 py-3">
                  <p className="text-[11px] font-poppins font-semibold uppercase tracking-wide text-[#667085]">
                    Last withdrawal
                  </p>
                  <p className="text-[13px] font-poppins text-[#1D2939] mt-0.5">{recentWithdrawalLine}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#EAECF0] shadow-sm">
                  <p className="text-[12px] font-poppins text-[#667085] mb-1 font-medium">On 24h hold</p>
                  <p className="text-[24px] font-gerat font-bold text-[#1D2939]">{fmt(wallet.pendingHoldAmount)}</p>
                  <p className="text-[11px] font-poppins text-[#98A2B3] mt-1">
                    {wallet.pendingHoldCount} payout{wallet.pendingHoldCount === 1 ? "" : "s"}
                  </p>
                  {wallet.pendingClearance !== wallet.pendingHoldAmount ? (
                    <p className="text-[10px] font-poppins text-[#98A2B3] mt-1">
                      Clearance: {fmt(wallet.pendingClearance)}
                    </p>
                  ) : null}
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#EAECF0] shadow-sm">
                  <p className="text-[12px] font-poppins text-[#667085] mb-1 font-medium">Total withdrawn</p>
                  <p className="text-[24px] font-gerat font-bold text-[#1D2939]">
                    {fmt(wallet.totalWithdrawnAmount)}
                  </p>
                  <p className="text-[11px] font-poppins text-[#98A2B3] mt-1">Completed payouts</p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#EAECF0] bg-white px-5 py-4 shadow-sm">
                <p className="text-[12px] font-poppins text-[#667085] font-medium">Lifetime earnings</p>
                <p className="text-[26px] font-gerat font-bold text-[#1D2939] mt-1">{fmt(wallet.lifetimeEarnings)}</p>
                <p className="text-[11px] font-poppins text-[#98A2B3] mt-1">From completed work (before fees / splits)</p>
              </div>
            </>
          ) : null}

          {!payoutAccountLoading && !isStripeConnected && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[12px] font-poppins text-amber-800">
                Connect your Stripe payout account to withdraw your balance.
              </p>
            </div>
          )}
          {!payoutAccountLoading && isStripeConnected && !canWithdrawPerAccount && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
              <ShieldAlert size={18} className="text-amber-700 shrink-0 mt-0.5" strokeWidth={1.5} />
              <p className="text-[12px] font-poppins text-amber-800">
                {payoutAccount?.requirementsDue?.length
                  ? "Stripe needs more information before you can withdraw."
                  : "Your Stripe account isn't ready for payouts yet."}
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => void handleWithdraw()}
              disabled={
                withdrawLoading ||
                walletLoading ||
                !wallet ||
                withdrawableAmount <= 0
              }
              className="w-full bg-brand-orange py-4 rounded-2xl text-white font-gerat font-bold text-[16px] hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {withdrawLoading ? "Withdrawing…" : "Withdraw funds"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/tasker/dashboard/paymentMethod")}
              className="w-full bg-brand-blue py-4 rounded-2xl text-white font-gerat font-bold text-[16px] hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {isStripeConnected ? "Manage payout account" : "Connect Stripe Account"}
              {!isStripeConnected && <ExternalLink size={16} />}
            </button>
          </div>
        </section>

        <section className="pt-4 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-gerat font-bold text-[#1D2939]">Recent activity</h2>
          </div>
          {activityRows.length === 0 ? (
            <p className="text-center text-[#98A2B3] font-poppins text-sm py-8">No recent activity yet.</p>
          ) : (
            <div className="space-y-1">
              {activityRows.map((row) => (
                <ActivityRow
                  key={row.id}
                  title={row.title}
                  subtitle={row.subtitle}
                  amountText={
                    row.amount > 0
                      ? `+${fmt(row.amount)}`
                      : row.amount < 0
                        ? fmt(row.amount)
                        : fmt(0)
                  }
                  statusLabel={row.statusLabel}
                  tone={row.tone}
                />
              ))}
            </div>
          )}
        </section>
      </div>
      <TaskerNav />
    </main>
  );
};

export default EarningsPage;
