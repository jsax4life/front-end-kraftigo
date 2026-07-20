"use client";

import type { ReactNode } from "react";
import toast, { type Toast } from "react-hot-toast";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useDomainNotificationHistoryStore,
  type DomainNotificationFeedAction,
} from "@/store/useDomainNotificationHistoryStore";
import { emitWalletSummaryInvalidate, emitPayoutAccountStatusInvalidate } from "@/lib/api/payouts";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  CalendarCheck2,
  CircleOff,
  ClipboardList,
  Gavel,
  Coins,
  Landmark,
  Link2,
  Loader2,
  PartyPopper,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
  XOctagon,
} from "lucide-react";

type Tone = "brand" | "success" | "info" | "amber" | "danger";

const toneStyles: Record<
  Tone,
  { strip: string; iconBg: string; iconClass: string }
> = {
  brand: {
    strip: "from-brand-orange to-amber-500",
    iconBg: "bg-orange-50",
    iconClass: "text-brand-orange",
  },
  success: {
    strip: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-50",
    iconClass: "text-emerald-600",
  },
  info: {
    strip: "from-sky-500 to-brand-blue",
    iconBg: "bg-sky-50",
    iconClass: "text-brand-blue",
  },
  amber: {
    strip: "from-amber-500 to-orange-500",
    iconBg: "bg-amber-50",
    iconClass: "text-amber-700",
  },
  danger: {
    strip: "from-red-500 to-rose-600",
    iconBg: "bg-red-50",
    iconClass: "text-red-600",
  },
};

function fmtMoney(n: unknown): string | null {
  if (n == null || n === "") return null;
  const num = typeof n === "number" ? n : parseFloat(String(n));
  if (!Number.isFinite(num)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(num);
}

function fmtMoneyWithCurrency(n: unknown, currencyCode: unknown): string | null {
  if (n == null || n === "") return null;
  const num = typeof n === "number" ? n : parseFloat(String(n));
  if (!Number.isFinite(num)) return null;
  const code =
    typeof currencyCode === "string" && /^[A-Z]{3}$/i.test(currencyCode.trim())
      ? currencyCode.trim().toUpperCase()
      : "EUR";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return fmtMoney(n);
  }
}

function shortId(id: unknown): string {
  if (typeof id !== "string" || !id) return "";
  return id.length > 10 ? `${id.slice(0, 6)}…` : id;
}

function EventToastCard(props: {
  t: Toast;
  tone: Tone;
  icon: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { t, tone, icon, title, body, actionLabel, onAction } = props;
  const s = toneStyles[tone];

  return (
    <div
      className={`pointer-events-auto flex max-w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04] ${
        t.visible ? "animate-in fade-in slide-in-from-right-4 duration-300" : ""
      }`}
    >
      <div className={`w-1 shrink-0 bg-gradient-to-b ${s.strip}`} aria-hidden />
      <div className="flex min-w-0 flex-1 gap-3 p-3.5 pl-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.iconBg}`}
        >
          <span className={s.iconClass}>{icon}</span>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-gerat text-[15px] font-bold leading-tight text-gray-900">{title}</p>
          <p className="mt-1 font-poppins text-[12px] leading-snug text-gray-600">{body}</p>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={() => {
                onAction();
                toast.dismiss(t.id);
              }}
              className="mt-2 font-poppins text-[12px] font-semibold text-brand-orange hover:text-orange-700"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          className="shrink-0 self-start flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Dismiss notification"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

type DomainToastHistoryPayload = {
  eventType: string;
  action: DomainNotificationFeedAction;
  bookingId?: string;
};

/** Collapse identical toasts within a short window (e.g. rapid profile preference saves). */
const recentToastFingerprints = new Map<string, number>();
const TOAST_DEDUPE_MS = 4500;

function pushToast(
  tone: Tone,
  icon: ReactNode,
  title: string,
  body: string,
  opts?: { duration?: number; actionLabel?: string; onAction?: () => void },
  history?: DomainToastHistoryPayload,
) {
  const fingerprint = `${title}\0${body}`;
  const now = Date.now();
  const lastShown = recentToastFingerprints.get(fingerprint);
  if (lastShown != null && now - lastShown < TOAST_DEDUPE_MS) {
    return;
  }
  recentToastFingerprints.set(fingerprint, now);

  toast.custom(
    (t) => (
      <EventToastCard
        t={t}
        tone={tone}
        icon={icon}
        title={title}
        body={body}
        actionLabel={opts?.actionLabel}
        onAction={opts?.onAction}
      />
    ),
    {
      duration: opts?.duration ?? 9000,
      position: "top-right",
    },
  );
  if (history) {
    useDomainNotificationHistoryStore.getState().add({
      eventType: history.eventType,
      title,
      body,
      createdAt: Date.now(),
      action: history.action,
      bookingId: history.bookingId,
    });
  }
}

/** Rich notification for a domain `event` payload from `/events`. */
export function showDomainEventNotification(raw: unknown): void {
  if (!raw || typeof raw !== "object") return;
  const msg = raw as Record<string, unknown>;
  const type = typeof msg.type === "string" ? msg.type : "";
  const bookingId = msg.bookingId;
  const bid = shortId(bookingId);
  const money = fmtMoney(msg.amount ?? msg.proposedPrice ?? msg.offerAmount ?? msg.refundAmount);
  const goKrafts = () => {
    if (typeof window !== "undefined") window.location.assign("/user/krafts");
  };
  const goTaskerRequests = () => {
    if (typeof window !== "undefined") window.location.assign("/tasker/requests");
  };
  const goTaskerSchedule = (id?: unknown) => {
    if (typeof window === "undefined") return;
    const bookingIdParam = typeof id === "string" ? id.trim() : "";
    const target = bookingIdParam
      ? `/tasker/schedule?openJob=${encodeURIComponent(bookingIdParam)}`
      : "/tasker/schedule";
    window.location.assign(target);
  };
  const goHome = () => {
    if (typeof window !== "undefined") window.location.assign("/");
  };
  const goTaskerEarnings = () => {
    if (typeof window !== "undefined") window.location.assign("/tasker/profile/earnings");
  };
  const goTaskerPayouts = () => {
    if (typeof window !== "undefined") window.location.assign("/tasker/dashboard/paymentMethod");
  };

  const hist = (
    eventType: string,
    action: DomainNotificationFeedAction,
    bookingIdOverride?: string,
  ): DomainToastHistoryPayload => ({
    eventType,
    action,
    bookingId:
      bookingIdOverride ??
      (typeof msg.bookingId === "string" ? msg.bookingId : undefined),
  });

  switch (type) {
    case "BOOKING_CREATED": {
      const isTasker = useAuthStore.getState().isTasker();
      if (isTasker) {
        pushToast(
          "info",
          <ClipboardList className="h-5 w-5" />,
          "New request",
          bid ? `You have a new booking request (${bid}).` : "You have a new booking request.",
          { actionLabel: "View requests", onAction: goTaskerRequests },
          hist("BOOKING_CREATED", "requests"),
        );
      } else {
        pushToast(
          "info",
          <ClipboardList className="h-5 w-5" />,
          "New Kraft",
          bid ? `Booking ${bid} was created.` : "A new booking was created.",
          { actionLabel: "View Krafts", onAction: goKrafts },
          hist("BOOKING_CREATED", "krafts"),
        );
      }
      break;
    }
    case "BOOKING_CONFIRMED":
      pushToast(
        "success",
        <CalendarCheck2 className="h-5 w-5" />,
        "Booking confirmed",
        bid ? `Booking ${bid} is confirmed.` : "Your booking is confirmed.",
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_CONFIRMED", "krafts"),
      );
      break;
    case "BOOKING_IN_PROGRESS": {
      const isTasker = useAuthStore.getState().isTasker();
      pushToast(
        "brand",
        <Loader2 className="h-5 w-5" />,
        "In progress",
        bid ? `Booking ${bid} is now in progress.` : "A booking has started.",
        isTasker
          ? { actionLabel: "View schedule", onAction: () => goTaskerSchedule(msg.bookingId) }
          : { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_IN_PROGRESS", isTasker ? "schedule" : "krafts"),
      );
      break;
    }
    case "BOOKING_COMPLETED": {
      const isTasker = useAuthStore.getState().isTasker();
      pushToast(
        "success",
        <PartyPopper className="h-5 w-5" />,
        "Completed",
        bid ? `Booking ${bid} is complete.` : "A booking was completed.",
        isTasker
          ? { actionLabel: "View schedule", onAction: () => goTaskerSchedule(msg.bookingId) }
          : { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_COMPLETED", isTasker ? "schedule" : "krafts"),
      );
      break;
    }
    case "BOOKING_EXPIRED": {
      const isTasker = useAuthStore.getState().isTasker();
      pushToast(
        "amber",
        <AlertTriangle className="h-5 w-5" />,
        "Booking expired",
        isTasker
          ? "This booking expired before work started."
          : "This booking expired because the scheduled time passed.",
        isTasker
          ? { actionLabel: "View schedule", onAction: () => goTaskerSchedule(msg.bookingId) }
          : { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_EXPIRED", isTasker ? "schedule" : "krafts"),
      );
      break;
    }
    case "BOOKING_CANCELLED":
      pushToast(
        "amber",
        <CircleOff className="h-5 w-5" />,
        "Cancelled",
        bid ? `Booking ${bid} was cancelled.` : "A booking was cancelled.",
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_CANCELLED", "krafts"),
      );
      break;
    case "BOOKING_DECLINED":
      pushToast(
        "amber",
        <XCircle className="h-5 w-5" />,
        "Declined",
        bid ? `Booking ${bid} was declined.` : "A booking was declined.",
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_DECLINED", "krafts"),
      );
      break;
    case "BOOKING_COUNTERED":
      pushToast(
        "info",
        <RefreshCw className="h-5 w-5" />,
        "Counter offer",
        [
          bid ? `Booking ${bid}: counter received.` : "A counter offer was received.",
          money ? ` Proposed: ${money}.` : "",
        ].join(""),
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_COUNTERED", "krafts"),
      );
      break;
    case "KRAFTER_SELECTED":
      pushToast(
        "success",
        <UserCheck className="h-5 w-5" />,
        "Krafter selected",
        bid ? `A Krafter was selected for ${bid}.` : "A Krafter was selected for your booking.",
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("KRAFTER_SELECTED", "krafts"),
      );
      break;
    case "BOOKING_REOPENED_FOR_RECOMMENDATIONS":
      pushToast(
        "info",
        <Users className="h-5 w-5" />,
        "Pick a Krafter",
        bid
          ? `Booking ${bid} is open again — choose a Krafter.`
          : "A booking was reopened for recommendations.",
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_REOPENED_FOR_RECOMMENDATIONS", "krafts"),
      );
      break;
    case "BOOKING_PUBLISHED_TO_MARKETPLACE":
      pushToast(
        "brand",
        <Sparkles className="h-5 w-5" />,
        "Live on marketplace",
        bid
          ? `Listing ${bid} is public.${money ? ` From ${money}.` : ""}`
          : "Your task is live on the marketplace.",
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("BOOKING_PUBLISHED_TO_MARKETPLACE", "krafts"),
      );
      break;
    case "ARTISAN_APPLIED":
      pushToast(
        "brand",
        <Users className="h-5 w-5" />,
        "New applicant",
        bid ? `Someone applied to ${bid}.` : "A Krafter applied to your listing.",
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("ARTISAN_APPLIED", "krafts"),
      );
      break;
    case "MARKETPLACE_APPLICATION_REJECTED":
      pushToast(
        "amber",
        <XCircle className="h-5 w-5" />,
        "Application update",
        "Your marketplace application was not selected this time.",
        { actionLabel: "Requests", onAction: goTaskerRequests },
        hist("MARKETPLACE_APPLICATION_REJECTED", "requests"),
      );
      break;
    case "PAYMENT_PENDING":
      pushToast(
        "amber",
        <Wallet className="h-5 w-5" />,
        "Payment needed",
        bid ? `Complete payment for ${bid}.` : "Payment is required to continue.",
        { actionLabel: "View Krafts", onAction: goKrafts },
        hist("PAYMENT_PENDING", "krafts"),
      );
      break;
    case "PAYMENT_RELEASED":
      pushToast(
        "success",
        <Coins className="h-5 w-5" />,
        "Payout released",
        money ? `${money} was released.` : "A payment was released.",
        undefined,
        hist("PAYMENT_RELEASED", null),
      );
      break;
    case "PAYMENT_REFUNDED":
      pushToast(
        "info",
        <Banknote className="h-5 w-5" />,
        "Refund",
        money ? `${money} was refunded.` : "A refund was processed.",
        undefined,
        hist("PAYMENT_REFUNDED", null),
      );
      break;
    case "PAYMENT_SPLIT":
      pushToast(
        "info",
        <Banknote className="h-5 w-5" />,
        "Payment split",
        "A payment was split between parties.",
        undefined,
        hist("PAYMENT_SPLIT", null),
      );
      break;
    case "PAYMENT_INITIATED":
      pushToast(
        "info",
        <Wallet className="h-5 w-5" />,
        "Payment started",
        money ? `Payment of ${money} initiated.` : "A payment was initiated.",
        undefined,
        hist("PAYMENT_INITIATED", null),
      );
      break;
    case "PAYMENT_DISPUTED":
      pushToast(
        "danger",
        <ShieldAlert className="h-5 w-5" />,
        "Payment disputed",
        typeof msg.reason === "string" && msg.reason.trim()
          ? msg.reason.trim().slice(0, 140)
          : "A payment is under dispute.",
        { duration: 12_000 },
        hist("PAYMENT_DISPUTED", null),
      );
      break;
    case "PAYMENT_ESCROWED":
      pushToast(
        "info",
        <Wallet className="h-5 w-5" />,
        "Funds in escrow",
        money ? `${money} is held in escrow.` : "Funds are held in escrow.",
        undefined,
        hist("PAYMENT_ESCROWED", null),
      );
      break;
    case "PAYMENT_AUTHORIZED":
      pushToast(
        "success",
        <BadgeCheck className="h-5 w-5" />,
        "Card authorized",
        "Your card was authorized successfully.",
        undefined,
        hist("PAYMENT_AUTHORIZED", null),
      );
      break;
    case "ARTISAN_WALLET_WITHDRAWN": {
      emitWalletSummaryInvalidate();
      if (!useAuthStore.getState().isTasker()) break;
      const withdrawn = fmtMoneyWithCurrency(msg.amount, msg.currency);
      const countRaw =
        typeof msg.payoutCount === "number" && Number.isFinite(msg.payoutCount)
          ? msg.payoutCount
          : parseInt(String(msg.payoutCount ?? ""), 10);
      const count = Number.isFinite(countRaw) ? countRaw : NaN;
      const tid =
        typeof msg.transferId === "string" && msg.transferId.trim()
          ? shortId(msg.transferId)
          : "";
      let body = withdrawn ? `${withdrawn} sent to your bank.` : "Funds were withdrawn.";
      if (tid) body += ` Transfer ${tid}.`;
      if (Number.isFinite(count) && count > 0) {
        body += ` ${count} payout${count === 1 ? "" : "s"}.`;
      }
      pushToast(
        "success",
        <Coins className="h-5 w-5" />,
        "Withdrawal sent",
        body,
        { actionLabel: "Wallet", onAction: goTaskerEarnings },
        hist("ARTISAN_WALLET_WITHDRAWN", null),
      );
      break;
    }
    case "ARTISAN_WALLET_WITHDRAWAL_FAILED": {
      emitWalletSummaryInvalidate();
      if (!useAuthStore.getState().isTasker()) break;
      const reversedAmount = fmtMoneyWithCurrency(msg.amount, msg.currency);
      pushToast(
        "danger",
        <XOctagon className="h-5 w-5" />,
        "Withdrawal reversed",
        reversedAmount
          ? `${reversedAmount} could not be transferred and was reversed. Check your Stripe account.`
          : "A withdrawal was reversed. Check your Stripe account.",
        { actionLabel: "Payouts", onAction: goTaskerPayouts, duration: 12_000 },
        hist("ARTISAN_WALLET_WITHDRAWAL_FAILED", null),
      );
      break;
    }
    case "ARTISAN_STRIPE_CONNECTED": {
      emitPayoutAccountStatusInvalidate();
      if (!useAuthStore.getState().isTasker()) break;
      pushToast(
        "info",
        <Link2 className="h-5 w-5" />,
        "Stripe account created",
        "Finish onboarding to start receiving payouts.",
        { actionLabel: "Continue setup", onAction: goTaskerPayouts },
        hist("ARTISAN_STRIPE_CONNECTED", null),
      );
      break;
    }
    case "ARTISAN_STRIPE_ONBOARDING_COMPLETED": {
      emitPayoutAccountStatusInvalidate();
      if (!useAuthStore.getState().isTasker()) break;
      pushToast(
        "success",
        <BadgeCheck className="h-5 w-5" />,
        "Payouts ready",
        "Your Stripe account is set up. You can now withdraw your balance.",
        { actionLabel: "Wallet", onAction: goTaskerEarnings },
        hist("ARTISAN_STRIPE_ONBOARDING_COMPLETED", null),
      );
      break;
    }
    case "ARTISAN_BANK_PAYOUT_PAID": {
      if (!useAuthStore.getState().isTasker()) break;
      const paidAmount = fmtMoneyWithCurrency(msg.amount, msg.currency);
      pushToast(
        "success",
        <Landmark className="h-5 w-5" />,
        "Funds in your bank",
        paidAmount ? `${paidAmount} landed in your bank account.` : "Funds landed in your bank account.",
        { actionLabel: "Wallet", onAction: goTaskerEarnings },
        hist("ARTISAN_BANK_PAYOUT_PAID", null),
      );
      break;
    }
    case "ARTISAN_BANK_PAYOUT_FAILED": {
      if (!useAuthStore.getState().isTasker()) break;
      const failedAmount = fmtMoneyWithCurrency(msg.amount, msg.currency);
      pushToast(
        "danger",
        <Landmark className="h-5 w-5" />,
        "Bank payout failed",
        failedAmount
          ? `Stripe could not deposit ${failedAmount} into your bank. Check your account details.`
          : "Stripe could not deposit funds into your bank. Check your account details.",
        { actionLabel: "Payouts", onAction: goTaskerPayouts, duration: 12_000 },
        hist("ARTISAN_BANK_PAYOUT_FAILED", null),
      );
      break;
    }
    case "DISPUTE_OPENED":
      pushToast(
        "danger",
        <Gavel className="h-5 w-5" />,
        "Dispute opened",
        "A dispute was opened on a booking.",
        { duration: 12_000 },
        hist("DISPUTE_OPENED", null),
      );
      break;
    case "DISPUTE_UNDER_REVIEW":
      pushToast(
        "amber",
        <Gavel className="h-5 w-5" />,
        "Dispute in review",
        "A dispute is being reviewed.",
        undefined,
        hist("DISPUTE_UNDER_REVIEW", null),
      );
      break;
    case "DISPUTE_RESOLVED":
      pushToast(
        "success",
        <Gavel className="h-5 w-5" />,
        "Dispute resolved",
        typeof msg.resolutionType === "string"
          ? `Resolution: ${msg.resolutionType.replace(/_/g, " ")}`
          : "A dispute was resolved.",
        undefined,
        hist("DISPUTE_RESOLVED", null),
      );
      break;
    case "ARTISAN_VERIFIED":
      pushToast(
        "success",
        <BadgeCheck className="h-5 w-5" />,
        "Verified",
        "Your Krafter profile is verified.",
        { actionLabel: "Open requests", onAction: goTaskerRequests },
        hist("ARTISAN_VERIFIED", "requests"),
      );
      break;
    case "PROFILE_UPDATED":
      pushToast(
        "info",
        <Sparkles className="h-5 w-5" />,
        "Profile updated",
        "Your profile was updated.",
        undefined,
        hist("PROFILE_UPDATED", null),
      );
      break;
    case "CUSTOM_KRAFT_PUBLISHED":
      pushToast(
        "brand",
        <Sparkles className="h-5 w-5" />,
        "Custom Kraft live",
        "Your custom Kraft request is published.",
        { actionLabel: "Home", onAction: goHome },
        hist("CUSTOM_KRAFT_PUBLISHED", "home"),
      );
      break;
    case "CUSTOM_KRAFT_EXPIRED":
      pushToast(
        "amber",
        <AlertTriangle className="h-5 w-5" />,
        "Custom Kraft expired",
        "A custom Kraft listing has expired.",
        { actionLabel: "Home", onAction: goHome },
        hist("CUSTOM_KRAFT_EXPIRED", "home"),
      );
      break;
    case "CUSTOM_KRAFT_CANCELLED":
      pushToast(
        "amber",
        <XCircle className="h-5 w-5" />,
        "Custom Kraft cancelled",
        "A custom Kraft was cancelled.",
        { actionLabel: "Home", onAction: goHome },
        hist("CUSTOM_KRAFT_CANCELLED", "home"),
      );
      break;
    default:
      pushToast(
        "info",
        <Sparkles className="h-5 w-5" />,
        "Update",
        type ? `Event: ${type.replace(/_/g, " ")}` : "You have a new update.",
        undefined,
        hist(type || "DOMAIN_EVENT", null),
      );
  }
}
