import api from "@/lib/axios";

/** Emitted after withdraw succeeds or when `ARTISAN_WALLET_WITHDRAWN` is received; earnings listens to refetch. */
export const WALLET_SUMMARY_INVALIDATE_EVENT = "kraftigo:wallet-summary-invalidate";

export function emitWalletSummaryInvalidate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WALLET_SUMMARY_INVALIDATE_EVENT));
}

/** Emitted on `ARTISAN_STRIPE_CONNECTED` / `ARTISAN_STRIPE_ONBOARDING_COMPLETED`; Payouts screens re-fetch `account-status`. */
export const PAYOUT_ACCOUNT_STATUS_INVALIDATE_EVENT = "kraftigo:payout-account-status-invalidate";

export function emitPayoutAccountStatusInvalidate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PAYOUT_ACCOUNT_STATUS_INVALIDATE_EVENT));
}

export type WalletDailyEarning = {
  date: string;
  dayLabel: string;
  amount: number;
};

export type WalletWeeklyEarnings = {
  weekStart: string;
  weekEnd: string;
  label: string;
  total: number;
  daily: WalletDailyEarning[];
};

/** Shape varies; common fields preserved for UI. */
export type WalletRecentWithdrawal = {
  amount?: number;
  currency?: string;
  transferId?: string;
  status?: string;
  createdAt?: string;
  completedAt?: string;
  [key: string]: unknown;
};

export type WalletRecentActivity = Record<string, unknown>;

/** GET /api/payouts/wallet-summary — JWT, ARTISAN */
export type ArtisanWalletSummary = {
  currency: string;
  pendingHoldAmount: number;
  pendingClearance: number;
  availableToWithdrawAmount: number;
  availableForWithdrawal: number;
  totalWithdrawnAmount: number;
  lifetimeEarnings: number;
  pendingHoldCount: number;
  availableToWithdrawCount: number;
  nextReleaseAt: string | null;
  tasksCompleted: number;
  averageHourlyRate: number;
  weeklyEarnings: WalletWeeklyEarnings | null;
  recentWithdrawal: WalletRecentWithdrawal | null;
  recentActivities: WalletRecentActivity[];
};

function pickNum(raw: Record<string, unknown>, camel: string, snake: string): number {
  const v = raw[camel] ?? raw[snake];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function pickInt(raw: Record<string, unknown>, camel: string, snake: string): number {
  return Math.floor(pickNum(raw, camel, snake));
}

function pickStr(raw: Record<string, unknown>, camel: string, snake: string): string | null {
  const v = raw[camel] ?? raw[snake];
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim();
}

function parseNextReleaseAt(raw: Record<string, unknown>): string | null {
  const v = raw.nextReleaseAt ?? raw.next_release_at;
  if (v === null || v === undefined) return null;
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function normalizeDailyEntry(item: unknown): WalletDailyEarning {
  if (!item || typeof item !== "object") {
    return { date: "", dayLabel: "", amount: 0 };
  }
  const d = item as Record<string, unknown>;
  return {
    date: pickStr(d, "date", "date") ?? "",
    dayLabel: pickStr(d, "dayLabel", "day_label") ?? "",
    amount: pickNum(d, "amount", "amount"),
  };
}

function normalizeWeeklyEarnings(raw: unknown): WalletWeeklyEarnings | null {
  if (!raw || typeof raw !== "object") return null;
  const w = raw as Record<string, unknown>;
  const dailyRaw = w.daily ?? w.daily_breakdown;
  const dailyArr = Array.isArray(dailyRaw) ? dailyRaw : [];
  return {
    weekStart: pickStr(w, "weekStart", "week_start") ?? "",
    weekEnd: pickStr(w, "weekEnd", "week_end") ?? "",
    label: pickStr(w, "label", "label") ?? "",
    total: pickNum(w, "total", "total"),
    daily: dailyArr.map(normalizeDailyEntry),
  };
}

function normalizeRecentWithdrawal(raw: unknown): WalletRecentWithdrawal | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object") return null;
  return { ...(raw as Record<string, unknown>) } as WalletRecentWithdrawal;
}

function normalizeRecentActivities(raw: unknown): WalletRecentActivity[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as WalletRecentActivity[];
}

function normalizeWalletSummary(data: unknown): ArtisanWalletSummary {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const currency = pickStr(raw, "currency", "currency_code") ?? "EUR";

  return {
    currency,
    pendingHoldAmount: pickNum(raw, "pendingHoldAmount", "pending_hold_amount"),
    pendingClearance: pickNum(raw, "pendingClearance", "pending_clearance"),
    availableToWithdrawAmount: pickNum(
      raw,
      "availableToWithdrawAmount",
      "available_to_withdraw_amount",
    ),
    availableForWithdrawal: pickNum(
      raw,
      "availableForWithdrawal",
      "available_for_withdrawal",
    ),
    totalWithdrawnAmount: pickNum(raw, "totalWithdrawnAmount", "total_withdrawn_amount"),
    lifetimeEarnings: pickNum(raw, "lifetimeEarnings", "lifetime_earnings"),
    pendingHoldCount: pickInt(raw, "pendingHoldCount", "pending_hold_count"),
    availableToWithdrawCount: pickInt(
      raw,
      "availableToWithdrawCount",
      "available_to_withdraw_count",
    ),
    nextReleaseAt: parseNextReleaseAt(raw),
    tasksCompleted: pickInt(raw, "tasksCompleted", "tasks_completed"),
    averageHourlyRate: pickNum(raw, "averageHourlyRate", "average_hourly_rate"),
    weeklyEarnings: normalizeWeeklyEarnings(raw.weeklyEarnings ?? raw.weekly_earnings),
    recentWithdrawal: normalizeRecentWithdrawal(raw.recentWithdrawal ?? raw.recent_withdrawal),
    recentActivities: normalizeRecentActivities(
      raw.recentActivities ?? raw.recent_activities,
    ),
  };
}

export async function getWalletSummary(): Promise<ArtisanWalletSummary> {
  const { data } = await api.get<unknown>("/api/payouts/wallet-summary");
  return normalizeWalletSummary(data);
}

// ─── Stripe Connect payout account ─────────────────────────────────────────

/** `GET /api/payouts/account-status` → `accountStatus`. */
export type PayoutAccountStatusValue = "PENDING" | "RESTRICTED" | "ACTIVE" | "DISABLED";

/** `GET /api/payouts/account-status` — JWT, ARTISAN. */
export type PayoutAccountStatus = {
  connected: boolean;
  stripeAccountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingCompleted: boolean;
  requirementsDue: string[];
  accountStatus: PayoutAccountStatusValue;
  canWithdraw: boolean;
  availableForWithdrawal: number;
  currency: string;
  lastSyncedAt: string | null;
};

function normalizePayoutAccountStatus(data: unknown): PayoutAccountStatus {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const requirementsDueRaw = raw.requirementsDue;
  const accountStatusRaw = typeof raw.accountStatus === "string" ? raw.accountStatus : "PENDING";
  return {
    connected: raw.connected === true,
    stripeAccountId: pickStr(raw, "stripeAccountId", "stripe_account_id"),
    chargesEnabled: raw.chargesEnabled === true,
    payoutsEnabled: raw.payoutsEnabled === true,
    detailsSubmitted: raw.detailsSubmitted === true,
    onboardingCompleted: raw.onboardingCompleted === true,
    requirementsDue: Array.isArray(requirementsDueRaw)
      ? requirementsDueRaw.filter((x): x is string => typeof x === "string")
      : [],
    accountStatus: (["PENDING", "RESTRICTED", "ACTIVE", "DISABLED"].includes(accountStatusRaw)
      ? accountStatusRaw
      : "PENDING") as PayoutAccountStatusValue,
    canWithdraw: raw.canWithdraw === true,
    availableForWithdrawal: pickNum(raw, "availableForWithdrawal", "available_for_withdrawal"),
    currency: pickStr(raw, "currency", "currency_code") ?? "EUR",
    lastSyncedAt: pickStr(raw, "lastSyncedAt", "last_synced_at"),
  };
}

export async function getPayoutAccountStatus(): Promise<PayoutAccountStatus> {
  const { data } = await api.get<unknown>("/api/payouts/account-status");
  return normalizePayoutAccountStatus(data);
}

/** Shared response shape for `connect-account` and `refresh-onboarding`. */
export type PayoutOnboardingLink = {
  onboardingUrl: string;
  stripeAccountId: string;
  /** Unix seconds — Stripe Account Links are single-use and short-lived. */
  expiresAt: number;
  /** `true` the first time (new Connect account); `false` on subsequent calls for the same in-progress account. */
  created: boolean;
};

function normalizePayoutOnboardingLink(data: unknown): PayoutOnboardingLink {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  return {
    onboardingUrl: pickStr(raw, "onboardingUrl", "onboarding_url") ?? "",
    stripeAccountId: pickStr(raw, "stripeAccountId", "stripe_account_id") ?? "",
    expiresAt: pickNum(raw, "expiresAt", "expires_at"),
    created: raw.created === true,
  };
}

/** `POST /api/payouts/connect-account` — JWT, ARTISAN; no body. 400 if onboarding already complete. */
export async function connectPayoutAccount(): Promise<PayoutOnboardingLink> {
  const { data } = await api.post<unknown>("/api/payouts/connect-account");
  return normalizePayoutOnboardingLink(data);
}

/** `POST /api/payouts/refresh-onboarding` — JWT, ARTISAN; no body. 400 if no Connect account exists yet. */
export async function refreshPayoutOnboarding(): Promise<PayoutOnboardingLink> {
  const { data } = await api.post<unknown>("/api/payouts/refresh-onboarding");
  return normalizePayoutOnboardingLink(data);
}

/** `POST /api/payouts/withdraw` response — JWT, ARTISAN; no body. */
export type PayoutWithdrawResult = {
  transferId: string;
  amount: number;
  currency: string;
  payoutIds: string[];
};

function normalizePayoutWithdrawResult(data: unknown): PayoutWithdrawResult {
  const raw = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const payoutIdsRaw = raw.payoutIds;
  return {
    transferId: pickStr(raw, "transferId", "transfer_id") ?? "",
    amount: pickNum(raw, "amount", "amount"),
    currency: pickStr(raw, "currency", "currency_code") ?? "EUR",
    payoutIds: Array.isArray(payoutIdsRaw)
      ? payoutIdsRaw.filter((x): x is string => typeof x === "string")
      : [],
  };
}

/**
 * `POST /api/payouts/withdraw` — JWT, ARTISAN; no body.
 * Backend always re-verifies balance/hold/Stripe eligibility server-side — always attempt the
 * call and handle the error rather than relying on cached `account-status` / `wallet-summary`.
 */
export async function postPayoutWithdraw(): Promise<PayoutWithdrawResult> {
  const { data } = await api.post<unknown>("/api/payouts/withdraw");
  return normalizePayoutWithdrawResult(data);
}
