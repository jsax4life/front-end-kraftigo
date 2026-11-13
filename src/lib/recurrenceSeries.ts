import type { BookingRecurrenceFrequency } from '@/lib/bookingRecurrence'
import { parseRecurrenceFrequency } from '@/lib/bookingRecurrence'
import type { Booking } from '@/types'
import type { BookingLike } from '@/lib/bookingDisplay'

export interface RecurrenceSeriesOccurrence {
  bookingId: string
  recurrenceOccurrenceIndex: number
  preferredDate?: string
  preferredTime?: string
  status: string
  isRoot?: boolean
}

export interface RecurrenceSeriesResponse {
  /**
   * Null/undefined until first payment confirm activates the series.
   * Intent-only snapshots still return root + previewNextDates.
   */
  seriesId: string | null
  seriesActive: boolean
  rootBookingId: string
  recurrenceFrequency: BookingRecurrenceFrequency
  recurrenceDaysOfWeek?: number[] | null
  occurrences: RecurrenceSeriesOccurrence[]
  previewNextDates?: string[]
}

/** True once BE has activated the series (children can exist). */
export function isRecurrenceSeriesActivated(
  series: Pick<RecurrenceSeriesResponse, 'seriesId'> | null | undefined,
): boolean {
  return Boolean(series?.seriesId?.trim())
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
}

function pickStr(r: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = r[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return undefined
}

function normalizeOccurrenceRow(raw: unknown): RecurrenceSeriesOccurrence | null {
  const r = asRecord(raw)
  const bookingId = pickStr(r, 'bookingId', 'booking_id', 'id')
  if (!bookingId) return null
  const idx = Number(r.recurrenceOccurrenceIndex ?? r.recurrence_occurrence_index ?? 0)
  return {
    bookingId,
    recurrenceOccurrenceIndex: Number.isFinite(idx) ? idx : 0,
    preferredDate: pickStr(r, 'preferredDate', 'preferred_date'),
    preferredTime: pickStr(r, 'preferredTime', 'preferred_time'),
    status: pickStr(r, 'status') ?? 'UNKNOWN',
    isRoot: r.isRoot === true || r.is_root === true,
  }
}

export function normalizeRecurrenceSeriesResponse(data: unknown): RecurrenceSeriesResponse | null {
  const root = asRecord(data)
  const row =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? asRecord(root.data)
      : root

  // Intent-only (accepted / unpaid): seriesId is null — still a valid 200 snapshot.
  const seriesId = pickStr(row, 'seriesId', 'series_id') ?? null
  const rootBookingId = pickStr(row, 'rootBookingId', 'root_booking_id')
  const frequency = parseRecurrenceFrequency(
    pickStr(row, 'recurrenceFrequency', 'recurrence_frequency'),
  )
  if (!rootBookingId || !frequency) return null

  const rawOcc = row.occurrences
  const occurrences = Array.isArray(rawOcc)
    ? rawOcc
        .map(normalizeOccurrenceRow)
        .filter((o): o is RecurrenceSeriesOccurrence => o !== null)
    : []

  const daysRaw = row.recurrenceDaysOfWeek ?? row.recurrence_days_of_week
  const recurrenceDaysOfWeek = Array.isArray(daysRaw)
    ? daysRaw.map((d) => Number(d)).filter((n) => Number.isInteger(n) && n >= 1 && n <= 7)
    : null

  const previewRaw = row.previewNextDates ?? row.preview_next_dates
  const previewNextDates = Array.isArray(previewRaw)
    ? previewRaw.filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    : undefined

  return {
    seriesId,
    seriesActive: row.seriesActive !== false && row.series_active !== false,
    rootBookingId,
    recurrenceFrequency: frequency,
    recurrenceDaysOfWeek: recurrenceDaysOfWeek?.length ? recurrenceDaysOfWeek : null,
    occurrences,
    ...(previewNextDates?.length ? { previewNextDates } : {}),
  }
}

export function readBookingRecurrenceSeriesFields(b: Booking | BookingLike): {
  recurrenceSeriesId?: string
  recurrenceParentBookingId?: string
  recurrenceOccurrenceIndex?: number
  recurrenceSeriesActive?: boolean
} {
  const r = b as Record<string, unknown>
  const recurrenceSeriesId = pickStr(r, 'recurrenceSeriesId', 'recurrence_series_id')
  const recurrenceParentBookingId = pickStr(
    r,
    'recurrenceParentBookingId',
    'recurrence_parent_booking_id',
  )
  const idxRaw = r.recurrenceOccurrenceIndex ?? r.recurrence_occurrence_index
  const recurrenceOccurrenceIndex =
    idxRaw !== undefined && idxRaw !== null ? Number(idxRaw) : undefined
  const recurrenceSeriesActive =
    r.recurrenceSeriesActive === true ||
    r.recurrence_series_active === true
      ? true
      : r.recurrenceSeriesActive === false || r.recurrence_series_active === false
        ? false
        : undefined

  return {
    ...(recurrenceSeriesId ? { recurrenceSeriesId } : {}),
    ...(recurrenceParentBookingId ? { recurrenceParentBookingId } : {}),
    ...(Number.isFinite(recurrenceOccurrenceIndex)
      ? { recurrenceOccurrenceIndex: recurrenceOccurrenceIndex as number }
      : {}),
    ...(recurrenceSeriesActive !== undefined ? { recurrenceSeriesActive } : {}),
  }
}

/** Fetch series UI when booking is recurring or already linked to a series. */
export function bookingShouldLoadRecurrenceSeries(b: Booking | BookingLike): boolean {
  const freq = parseRecurrenceFrequency(
    typeof b.recurrenceFrequency === 'string' ? b.recurrenceFrequency : undefined,
  )
  if (freq && freq !== 'ONCE') return true
  const { recurrenceSeriesId } = readBookingRecurrenceSeriesFields(b)
  return Boolean(recurrenceSeriesId)
}

export function formatSeriesOccurrenceDate(ymd: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd
  const d = new Date(`${ymd}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ymd
  return d.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatSeriesOccurrenceTime(t: string | undefined): string {
  if (!t?.trim()) return ''
  const part = t.trim().slice(0, 5)
  const m = part.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return t.trim()
  let h = parseInt(m[1], 10)
  const mins = m[2]
  const period = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return `${h}:${mins} ${period}`
}
