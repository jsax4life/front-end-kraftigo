"use client";

import { useMemo } from "react";
import {
  type BookingRecurrenceFrequency,
  type IsoWeekday,
  type RecurrenceScheduleState,
  formatRecurrenceScheduleLabel,
  buildRecurrenceSchedulePayload,
  validateRecurrenceScheduleState,
  buildRecurrenceSummaryMessage,
} from "@/lib/bookingRecurrence";
import { formatLocalDateYmd } from "@/utils/date";
import { useTranslations, useLocale } from "next-intl";

interface RecurringScheduleSectionProps {
  state: RecurrenceScheduleState;
  onChange: (state: RecurrenceScheduleState) => void;
  /** Start date from “Choose date” (sets weekday / day-of-month for the pattern). */
  anchorDate?: Date;
  /** 24h `HH:mm` when known */
  preferredTime24?: string;
  /** Hide the optional toggle — always shown as enabled UI (e.g. verify step). */
  alwaysExpanded?: boolean;
  /** Flexible schedule is on — recurrence is not available. */
  blockedByFlexibleSchedule?: boolean;
}

const FREQUENCY_OPTIONS: BookingRecurrenceFrequency[] = [
  "WEEKLY",
  "BIWEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "CUSTOM_DAYS",
];

function formatTime12h(time24: string): string {
  const t = time24.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return t;
  let hour = parseInt(m[1], 10);
  const minutes = m[2];
  const period = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minutes} ${period}`;
}

export default function RecurringScheduleSection({
  state,
  onChange,
  anchorDate,
  preferredTime24 = "",
  alwaysExpanded = false,
  blockedByFlexibleSchedule = false,
}: RecurringScheduleSectionProps) {
  const t = useTranslations("booking.serviceDetailsStep");
  const tShared = useTranslations("shared.datePicker");
  const locale = useLocale();

  const weekdayShort = [
    tShared("weekDays.mo"),
    tShared("weekDays.tu"),
    tShared("weekDays.we"),
    tShared("weekDays.th"),
    tShared("weekDays.fr"),
    tShared("weekDays.sa"),
    tShared("weekDays.su"),
  ];

  const weekdayLong = useMemo(() => {
    if (!anchorDate) return "";
    return anchorDate.toLocaleDateString(locale, { weekday: "long" });
  }, [anchorDate, locale]);

  const startDateLabel = useMemo(() => {
    if (!anchorDate) return "";
    return anchorDate.toLocaleDateString(locale, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [anchorDate, locale]);

  const timeLabel = useMemo(
    () => formatTime12h(preferredTime24),
    [preferredTime24],
  );

  const labels = {
    once: t("recurrenceOnce"),
    weekly: t("recurrenceWeekly"),
    biweekly: t("recurrenceBiweekly"),
    monthly: t("recurrenceMonthly"),
    quarterly: t("recurrenceQuarterly"),
    customDays: t("recurrenceCustomDays"),
    weekdayShort,
  };

  const validationError = validateRecurrenceScheduleState(state);
  const showOptions =
    (alwaysExpanded || state.enabled) && !blockedByFlexibleSchedule;

  const selectedWeekdaysLabel = useMemo(() => {
    if (state.daysOfWeek.length === 0) return "";
    return [...state.daysOfWeek]
      .sort((a, b) => a - b)
      .map((d) => weekdayShort[d - 1])
      .filter(Boolean)
      .join(", ");
  }, [state.daysOfWeek, weekdayShort]);

  const summaryMessage = useMemo(
    () =>
      buildRecurrenceSummaryMessage(state, {
        anchorYmd: anchorDate ? formatLocalDateYmd(anchorDate) : undefined,
        weekdayLong,
        startDateLabel,
        timeLabel,
        selectedWeekdaysLabel,
        dayOfMonth: anchorDate ? anchorDate.getDate() : 0,
        locale,
      }),
    [
      state,
      anchorDate,
      weekdayLong,
      startDateLabel,
      timeLabel,
      selectedWeekdaysLabel,
      locale,
    ],
  );

  const toggleDay = (day: IsoWeekday) => {
    const has = state.daysOfWeek.includes(day);
    const daysOfWeek = has
      ? state.daysOfWeek.filter((d) => d !== day)
      : [...state.daysOfWeek, day].sort((a, b) => a - b);
    onChange({ ...state, daysOfWeek });
  };

  return (
    <div className="p-4 sm:p-5 border-b border-[#0000001A]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium">
          {t("recurringSchedule")}
        </h2>
        {!alwaysExpanded && (
          <label
            className={`flex items-center gap-2 ${
              blockedByFlexibleSchedule ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <span className="text-[13px] font-poppins text-gray-600">
              {t("recurringOptional")}
            </span>
            <input
              type="checkbox"
              checked={state.enabled}
              disabled={blockedByFlexibleSchedule}
              onChange={(e) => {
                if (blockedByFlexibleSchedule) return;
                onChange(
                  e.target.checked
                    ? { ...state, enabled: true, frequency: "WEEKLY" }
                    : { enabled: false, frequency: "WEEKLY", daysOfWeek: [] },
                );
              }}
              className="w-4 h-4 accent-brand-orange"
            />
          </label>
        )}
      </div>

      <p className="text-[13px] text-gray-500 font-poppins mb-2">
        {t("recurringScheduleHelp")}
      </p>

      {blockedByFlexibleSchedule && (
        <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-poppins mb-2">
          {t("recurringScheduleDisabledFlexible")}
        </p>
      )}

      {showOptions && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-600 font-poppins">{t("recurrenceHowOften")}</p>
          <div className="flex flex-wrap gap-2">
            {FREQUENCY_OPTIONS.map((frequency) => (
              <button
                key={frequency}
                type="button"
                onClick={() =>
                  onChange({
                    ...state,
                    enabled: true,
                    frequency,
                    daysOfWeek: frequency === "CUSTOM_DAYS" ? state.daysOfWeek : [],
                  })
                }
                className={`px-3 py-2 rounded-lg text-[12px] sm:text-[13px] font-poppins font-medium transition-colors ${
                  state.frequency === frequency
                    ? "bg-brand-orange text-white"
                    : "bg-[#F6F6F6] text-gray-800 hover:bg-gray-100"
                }`}
              >
                {formatRecurrenceScheduleLabel(
                  { recurrenceFrequency: frequency },
                  labels,
                )}
              </button>
            ))}
          </div>

          {summaryMessage ? (
            <div
              className="rounded-lg border border-[#FF660033] bg-[#FF66000D] px-3 py-2.5"
              role="status"
            >
              <p className="text-[13px] sm:text-[14px] font-poppins font-semibold text-gray-900">
                {t(summaryMessage.key, summaryMessage.values)}
              </p>
              {summaryMessage.addTimeHint ? (
                <p className="text-[12px] text-gray-600 font-poppins mt-1">
                  {t("recurrenceSummaryAddTime")}
                </p>
              ) : null}
            </div>
          ) : null}

          {state.frequency === "CUSTOM_DAYS" && (
            <div>
              <p className="text-[13px] text-gray-600 font-poppins mb-2">
                {t("recurrenceSelectWeekdays")}
              </p>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3, 4, 5, 6, 7] as IsoWeekday[]).map((day, i) => {
                  const selected = state.daysOfWeek.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-11 h-11 rounded-full text-[12px] font-poppins font-semibold transition-colors ${
                        selected
                          ? "bg-brand-orange text-white"
                          : "bg-[#F6F6F6] text-gray-800 hover:bg-gray-100"
                      }`}
                      aria-pressed={selected}
                    >
                      {weekdayShort[i]?.slice(0, 2) ?? day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {validationError && (
            <p className="text-[12px] text-red-600 font-poppins">{validationError}</p>
          )}
        </div>
      )}
    </div>
  );
}
