"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Repeat } from "lucide-react";
import { getArtisanBookingRecurrenceSeries } from "@/lib/api/bookings";
import { formatRecurrenceScheduleLabel, type IsoWeekday } from "@/lib/bookingRecurrence";
import {
  formatSeriesOccurrenceDate,
  formatSeriesOccurrenceTime,
  type RecurrenceSeriesResponse,
} from "@/lib/recurrenceSeries";
import type { Booking } from "@/types";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  booking: Booking;
  highlightBookingId?: string;
};

const STATUS_KEYS: Record<string, string> = {
  PAYMENT_PENDING: "occurrenceStatus.paymentPending",
  CONFIRMED: "occurrenceStatus.confirmed",
  BOOKING_CONFIRMED: "occurrenceStatus.confirmed",
  IN_PROGRESS: "occurrenceStatus.inProgress",
  COMPLETED: "occurrenceStatus.completed",
  CANCELLED: "occurrenceStatus.cancelled",
  REQUESTED: "occurrenceStatus.requested",
  ACCEPTED: "occurrenceStatus.accepted",
};

export default function KrafterRecurrenceSeriesPanel({
  booking,
  highlightBookingId,
}: Props) {
  const t = useTranslations("tasker.recurrenceSeries");
  const tCustomer = useTranslations("krafts.recurrenceSeries");
  const tPattern = useTranslations("booking.serviceDetailsStep");
  const tShared = useTranslations("shared.datePicker");
  const locale = useLocale();

  const [series, setSeries] = useState<RecurrenceSeriesResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  const loadSeries = useCallback(async () => {
    if (!booking.id) return;
    setLoading(true);
    try {
      const data = await getArtisanBookingRecurrenceSeries(booking.id);
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

  if (loading && !series) {
    return (
      <p className="text-[13px] font-poppins text-gray-500 px-5 mb-4">{t("loading")}</p>
    );
  }

  if (!series) return null;

  const currentId = highlightBookingId ?? booking.id;

  return (
    <div className="mx-5 mb-5 rounded-2xl border border-[#FF660033] bg-[#FF660008] p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Repeat size={18} className="text-brand-orange shrink-0" aria-hidden />
          <h3 className="text-[15px] font-poppins font-semibold text-gray-900">{t("title")}</h3>
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
      <p className="text-[12px] font-poppins text-gray-500 mb-3">{t("customerPaysPerVisit")}</p>

      {!series.seriesActive ? (
        <p className="text-[12px] font-poppins text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
          {t("seriesStopped")}
        </p>
      ) : null}

      <ul className="space-y-2 mb-3">
        {series.occurrences.map((occ) => {
          const isCurrent = occ.bookingId === currentId;
          const statusKey = STATUS_KEYS[occ.status.toUpperCase().replace(/-/g, "_")];
          const dateStr = occ.preferredDate
            ? formatSeriesOccurrenceDate(occ.preferredDate, locale)
            : "—";
          const timeStr = formatSeriesOccurrenceTime(occ.preferredTime);

          return (
            <li
              key={occ.bookingId}
              className={`rounded-xl border px-3 py-2 text-[13px] font-poppins ${
                isCurrent ? "border-brand-orange bg-white" : "border-gray-100 bg-white/80"
              }`}
            >
              <p className="font-medium text-gray-900">
                {occ.isRoot || occ.recurrenceOccurrenceIndex === 0
                  ? tCustomer("visitRoot")
                  : tCustomer("visitNumber", { n: occ.recurrenceOccurrenceIndex + 1 })}
                {isCurrent ? ` · ${tCustomer("currentVisit")}` : ""}
              </p>
              <p className="text-gray-600 text-[12px]">
                {dateStr}
                {timeStr ? ` · ${timeStr}` : ""}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {statusKey ? tCustomer(statusKey) : occ.status}
              </p>
            </li>
          );
        })}
      </ul>

      {series.previewNextDates?.length && series.seriesActive ? (
        <p className="text-[12px] font-poppins text-gray-600">
          <span className="font-semibold text-gray-700">{tCustomer("upcomingPreview")}: </span>
          {series.previewNextDates
            .map((d) => formatSeriesOccurrenceDate(d, locale))
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
