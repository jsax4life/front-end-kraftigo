"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import DatePickerModal from "@/components/shared/DatePickerModal";
import MultiDatePickerModal from "@/components/shared/MultiDatePickerModal";
import {
  type FlexibleScheduleState,
  formatFlexibleScheduleLabel,
  validateFlexibleScheduleState,
} from "@/lib/flexibleSchedule";
import { formatLocalDateYmd, addLocalDays } from "@/utils/date";

interface FlexibleScheduleSectionProps {
  primaryDate: Date | undefined;
  state: FlexibleScheduleState;
  onChange: (state: FlexibleScheduleState) => void;
}

const defaultState = (): FlexibleScheduleState => ({
  enabled: false,
  mode: "range",
  additionalDates: [],
});

export function createInitialFlexibleScheduleState(): FlexibleScheduleState {
  return defaultState();
}

export default function FlexibleScheduleSection({
  primaryDate,
  state,
  onChange,
}: FlexibleScheduleSectionProps) {
  const [showRangeEndPicker, setShowRangeEndPicker] = useState(false);
  const [showMultiPicker, setShowMultiPicker] = useState(false);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const validationError = primaryDate ? validateFlexibleScheduleState(primaryDate, state) : null;

  const summary =
    primaryDate && state.enabled
      ? state.mode === "range" && state.rangeEndDate
        ? formatFlexibleScheduleLabel(
            formatLocalDateYmd(primaryDate),
            undefined,
            formatLocalDateYmd(state.rangeEndDate),
          )
        : state.mode === "multiple" && state.additionalDates.length > 0
          ? formatFlexibleScheduleLabel(
              formatLocalDateYmd(primaryDate),
              undefined,
              undefined,
              state.additionalDates.map((d) => formatLocalDateYmd(d)),
            )
          : null
      : null;

  return (
    <div className="p-4 sm:p-5 border-b border-[#0000001A]">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[20px] sm:text-[22px] font-poppins font-medium">
          Flexible schedule
        </h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-[13px] font-poppins text-gray-600">Optional</span>
          <input
            type="checkbox"
            checked={state.enabled}
            disabled={!primaryDate}
            onChange={(e) => {
              if (!primaryDate) return;
              onChange(
                e.target.checked
                  ? { ...state, enabled: true }
                  : { ...defaultState() },
              );
            }}
            className="w-4 h-4 accent-brand-orange"
          />
        </label>
      </div>

      {!primaryDate && (
        <p className="text-[13px] text-gray-500 font-poppins">
          Pick your first date above to add a range or extra days.
        </p>
      )}

      {primaryDate && state.enabled && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["range", "multiple"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  onChange({
                    ...state,
                    mode,
                    rangeEndDate: mode === "range" ? state.rangeEndDate : undefined,
                    additionalDates: mode === "multiple" ? state.additionalDates : [],
                  })
                }
                className={`flex-1 py-2.5 rounded-lg text-[13px] font-poppins font-medium transition-colors ${
                  state.mode === mode
                    ? "bg-brand-orange text-white"
                    : "bg-[#F6F6F6] text-gray-800 hover:bg-gray-100"
                }`}
              >
                {mode === "range" ? "Date range" : "Multiple days"}
              </button>
            ))}
          </div>

          {state.mode === "range" ? (
            <button
              type="button"
              onClick={() => setShowRangeEndPicker(true)}
              className="w-full flex items-center justify-left gap-2 py-2 transition-colors hover:text-brand-orange"
            >
              <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800">
                {state.rangeEndDate
                  ? `Through ${formatDate(state.rangeEndDate)}`
                  : "Select end date (after your first day)"}
              </span>
              <Plus size={16} className="text-gray-600" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowMultiPicker(true)}
              className="w-full flex items-center justify-left gap-2 py-2 transition-colors hover:text-brand-orange"
            >
              <span className="text-[14px] sm:text-[15px] font-poppins text-gray-800">
                {state.additionalDates.length > 0
                  ? `${state.additionalDates.length + 1} days selected`
                  : "Add more days"}
              </span>
              <Plus size={16} className="text-gray-600" />
            </button>
          )}

          {summary && (
            <p className="text-[12px] text-gray-600 font-poppins">{summary}</p>
          )}
          {validationError && (
            <p className="text-[12px] text-red-600 font-poppins">{validationError}</p>
          )}
        </div>
      )}

      <DatePickerModal
        isOpen={showRangeEndPicker}
        onClose={() => setShowRangeEndPicker(false)}
        selectedDate={
          state.rangeEndDate &&
          primaryDate &&
          formatLocalDateYmd(state.rangeEndDate) > formatLocalDateYmd(primaryDate)
            ? state.rangeEndDate
            : primaryDate
              ? addLocalDays(primaryDate, 1)
              : undefined
        }
        minDate={primaryDate ? addLocalDays(primaryDate, 1) : undefined}
        onSelectDate={(date) => onChange({ ...state, rangeEndDate: date })}
      />

      {primaryDate && (
        <MultiDatePickerModal
          isOpen={showMultiPicker}
          onClose={() => setShowMultiPicker(false)}
          selectedDates={[primaryDate, ...state.additionalDates]}
          lockedDate={primaryDate}
          minDate={addLocalDays(primaryDate, 1)}
          onSelectDates={(dates) => {
            const primaryYmd = formatLocalDateYmd(primaryDate);
            const additionalDates = dates.filter(
              (d) => formatLocalDateYmd(d) !== primaryYmd,
            );
            onChange({ ...state, additionalDates });
          }}
        />
      )}
    </div>
  );
}
