/** Format a Date as YYYY-MM-DD in the user's local timezone (avoids UTC shift from toISOString). */
export function formatLocalDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD (or ISO prefix) as local calendar date. */
export function parseLocalDateYmd(raw: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isCalendarDayBeforeToday(year: number, month: number, day: number): boolean {
  const cell = new Date(year, month, day);
  return cell < startOfLocalDay(new Date());
}

/** Parse "HH:mm", "H:mm", or "6:00pm" to minutes from midnight. */
export function parseTimeToMinutes(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;

  const twentyFour = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (twentyFour) {
    const h = Number(twentyFour[1]);
    const m = Number(twentyFour[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return h * 60 + m;
  }

  const twelve = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(t);
  if (twelve) {
    let h = Number(twelve[1]);
    const m = Number(twelve[2]);
    const ap = twelve[3].toLowerCase();
    if (m < 0 || m > 59) return null;
    if (h < 1 || h > 12) return null;
    if (h === 12) h = ap === "am" ? 0 : 12;
    else if (ap === "pm") h += 12;
    return h * 60 + m;
  }

  return null;
}

export function formatMinutesAs24Hour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Minimum lead time before a booking/reschedule slot (minutes). */
export const SCHEDULE_MIN_LEAD_MINUTES = 30;

export function minTimeInputForToday(): string {
  return minScheduleTimeInputForToday(0);
}

/** Earliest selectable HH:mm today, with optional lead time from now. */
export function minScheduleTimeInputForToday(
  leadMinutes = SCHEDULE_MIN_LEAD_MINUTES,
): string {
  const minMs = Date.now() + leadMinutes * 60_000;
  const minDate = new Date(minMs);
  return formatMinutesAs24Hour(minDate.getHours() * 60 + minDate.getMinutes());
}

export function isDateTimeTooSoon(
  date: Date,
  timeRaw: string,
  leadMinutes = SCHEDULE_MIN_LEAD_MINUTES,
): boolean {
  const mins = parseTimeToMinutes(timeRaw);
  if (mins == null) return false;
  const slot = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(mins / 60),
    mins % 60,
    0,
    0,
  );
  return slot.getTime() < Date.now() + leadMinutes * 60_000;
}

/** True when the slot is strictly before the current moment (no lead buffer). */
export function isDateTimeInPast(date: Date, timeRaw: string): boolean {
  return isDateTimeTooSoon(date, timeRaw, 0);
}
