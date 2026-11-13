"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Repeat } from "lucide-react";
import toast from "react-hot-toast";
import {
  getBookingRecurrenceSeries,
  getBookingById,
  proceedToPayment,
  normalizeBookingDetailResponse,
  stopRecurrenceSeries,
} from "@/lib/api/bookings";
import { formatRecurrenceScheduleLabel, type IsoWeekday } from "@/lib/bookingRecurrence";
import {
  formatSeriesOccurrenceDate,
  formatSeriesOccurrenceTime,
  isRecurrenceSeriesActivated,
  type RecurrenceSeriesResponse,
} from "@/lib/recurrenceSeries";
import type { Booking } from "@/types";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  booking: Booking;
  onPayOccurrence: (booking: Booking) => void;
  onSeriesChanged?: () => void;
  onSelectOccurrence?: (bookingId: string) => void;
};

const OCCURRENCE_STATUS_KEYS: Record<string, string> = {
  PAYMENT_PENDING: "occurrenceStatus.paymentPending",
  CONFIRMED: "occurrenceStatus.confirmed",
  BOOKING_CONFIRMED: "occurrenceStatus.confirmed",
  IN_PROGRESS: "occurrenceStatus.inProgress",
  COMPLETED: "occurrenceStatus.completed",
  CANCELLED: "occurrenceStatus.cancelled",
  REQUESTED: "occurrenceStatus.requested",
  ACCEPTED: "occurrenceStatus.accepted",
};

function occurrenceStatusLabel(
  status: string | null | undefined,
  t: ReturnType<typeof useTranslations>,
): string {
  const s = String(status ?? "")
    .toUpperCase()
    .replace(/-/g, "_");
  const key = OCCURRENCE_STATUS_KEYS[s];
  return key ? t(key) : status || "—";
}

export default function CustomerRecurrenceSeriesPanel({
  booking,
  onPayOccurrence,
  onSeriesChanged,
  onSelectOccurrence,
}: Props) {
  const t = useTranslations("krafts.recurrenceSeries");
  const tPattern = useTranslations("booking.serviceDetailsStep");
  const tShared = useTranslations("shared.datePicker");
  const locale = useLocale();

  const [series, setSeries] = useState<RecurrenceSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  const weekdayShort = useMemo(
    () => [
      tShared("weekDays.mo"),
      tShared("weekDays.tu"),
      tShared("weekDays.we"),
      tShared("weekDays.th"),
      tShared("weekDays.fr"),
      tShared("weekDays.sa"),
      tShared("weekDays.su"),
    ],
    [tShared],
  );

  const patternLabel = useMemo(() => {
    if (!series) return null;
    return formatRecurrenceScheduleLabel(
      {
        recurrenceFrequency: series.recurrenceFrequency,
        recurrenceDaysOfWeek: (series.recurrenceDaysOfWeek ?? undefined) as
          | IsoWeekday[]
          | undefined,
      },
      {
        once: tPattern("recurrenceOnce"),
        weekly: tPattern("recurrenceWeekly"),
        biweekly: tPattern("recurrenceBiweekly"),
        monthly: tPattern("recurrenceMonthly"),
        quarterly: tPattern("recurrenceQuarterly"),
        customDays: tPattern("recurrenceCustomDays"),
        weekdayShort,
      },
    );
  }, [series, tPattern, weekdayShort]);

  const loadSeries = useCallback(async () => {
    if (!booking.id) return;
    setLoading(true);
    try {
      const data = await getBookingRecurrenceSeries(booking.id);
      setSeries(data);
    } catch {
      setSeries(null);
    } finally {
      setLoading(false);
    }
  }, [booking.id]);

  useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  const handleStopSeries = async () => {
    const stopId = series?.rootBookingId ?? booking.id;
    if (!stopId) return;
    if (!window.confirm(t("stopConfirm"))) return;
    setStopping(true);
    try {
      await stopRecurrenceSeries(stopId);
      toast.success(t("stopSuccess"));
      await loadSeries();
      onSeriesChanged?.();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      toast.error(ax.response?.data?.message ?? t("stopError"));
    } finally {
      setStopping(false);
    }
  };

  const handlePay = async (occurrenceId: string) => {
    setPayingId(occurrenceId);
    try {
      let detail = await getBookingById(occurrenceId, { includePaymentSummary: true });
      if (detail.status === "PAYMENT_PENDING") {
        try {
          detail = normalizeBookingDetailResponse(await proceedToPayment(occurrenceId));
        } catch {
          detail = await getBookingById(occurrenceId, { includePaymentSummary: true });
        }
      }
      onPayOccurrence(detail);
    } catch {
      toast.error(t("payError"));
    } finally {
      setPayingId(null);
    }
  };

  if (loading && !series) {
    return (
      <p className="text-[13px] font-poppins text-gray-500 mb-4">{t("loading")}</p>
    );
  }

  if (!series) {
    return null;
  }

  const seriesActivated = isRecurrenceSeriesActivated(series);
  // Stop only after BE activated the series (seriesId set). Intent-only unpaid roots have seriesId null.
  const showStop =
    seriesActivated &&
    series.seriesActive &&
    booking.recurrenceSeriesActive !== false;

  return (
    <div className="mb-4 rounded-2xl border border-[#FF660033] bg-[#FF660008] p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Repeat size={18} className="text-brand-orange shrink-0" aria-hidden />
          <h3 className="text-[15px] font-poppins font-semibold text-gray-900">
            {t("title")}
          </h3>
        </div>
        <button
          type="button"
          onClick={() => void loadSeries()}
          className="p-1 text-gray-500 hover:text-gray-800 rounded-lg"
          aria-label={t("refresh")}
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {patternLabel ? (
        <p className="text-[13px] font-poppins text-gray-700 mb-1">{patternLabel}</p>
      ) : null}
      <p className="text-[12px] font-poppins text-gray-500 mb-3">{t("payPerVisitNote")}</p>

      {!seriesActivated && series.seriesActive ? (
        <p className="text-[12px] font-poppins text-blue-900 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3">
          {t("intentOnlyPendingPayment")}
        </p>
      ) : null}

      {!series.seriesActive ? (
        <p className="text-[12px] font-poppins text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          {t("seriesStopped")}
        </p>
      ) : null}

      <ul className="space-y-2 mb-3">
        {(Array.isArray(series.occurrences) ? series.occurrences : []).map((occ) => {
          const isCurrent = occ.bookingId === booking.id;
          const statusNorm = String(occ.status ?? "")
            .toUpperCase()
            .replace(/-/g, "_");
          const needsPay = statusNorm === "PAYMENT_PENDING";
          const dateStr = occ.preferredDate
            ? formatSeriesOccurrenceDate(occ.preferredDate, locale)
            : "—";
          const timeStr = formatSeriesOccurrenceTime(occ.preferredTime);

          return (
            <li
              key={occ.bookingId}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[13px] font-poppins ${
                isCurrent ? "border-brand-orange bg-white" : "border-gray-100 bg-white/80"
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900">
                  {occ.isRoot || occ.recurrenceOccurrenceIndex === 0
                    ? t("visitRoot")
                    : t("visitNumber", { n: occ.recurrenceOccurrenceIndex + 1 })}
                  {isCurrent ? ` · ${t("currentVisit")}` : ""}
                </p>
                <p className="text-gray-600 text-[12px]">
                  {dateStr}
                  {timeStr ? ` · ${timeStr}` : ""}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {occurrenceStatusLabel(occ.status, t)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!isCurrent && onSelectOccurrence ? (
                  <button
                    type="button"
                    onClick={() => onSelectOccurrence(occ.bookingId)}
                    className="text-[12px] font-semibold text-brand-orange"
                  >
                    {t("viewVisit")}
                  </button>
                ) : null}
                {needsPay ? (
                  <button
                    type="button"
                    disabled={payingId === occ.bookingId}
                    onClick={() => void handlePay(occ.bookingId)}
                    className="px-3 py-1.5 rounded-lg bg-brand-orange text-white text-[12px] font-semibold disabled:opacity-60"
                  >
                    {payingId === occ.bookingId ? t("paying") : t("payVisit")}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {series.previewNextDates && series.previewNextDates.length > 0 ? (
        <div className="mb-3">
          <p className="text-[11px] font-poppins font-semibold text-gray-500 uppercase tracking-wide mb-1">
            {t("upcomingPreview")}
          </p>
          <p className="text-[12px] font-poppins text-gray-600">
            {series.previewNextDates
              .map((d) => formatSeriesOccurrenceDate(d, locale))
              .join(" · ")}
          </p>
        </div>
      ) : null}

      {showStop ? (
        <button
          type="button"
          onClick={() => void handleStopSeries()}
          disabled={stopping}
          className="w-full py-2.5 rounded-xl border border-red-200 text-red-700 text-[13px] font-poppins font-semibold hover:bg-red-50 disabled:opacity-60"
        >
          {stopping ? t("stopping") : t("stopSeries")}
        </button>
      ) : null}
    </div>
  );
}
