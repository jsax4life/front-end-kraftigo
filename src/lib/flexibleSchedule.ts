import { formatLocalDateYmd, parseLocalDateYmd } from '@/utils/date'

export const MAX_ADDITIONAL_PREFERRED_DATES = 14

export interface FlexibleScheduleFields {
  preferredDateEnd?: string
  additionalPreferredDates?: string[]
}

export type FlexibleScheduleMode = 'single' | 'range' | 'multiple'

export interface FlexibleScheduleState {
  enabled: boolean
  mode: 'range' | 'multiple'
  rangeEndDate?: Date
  additionalDates: Date[]
}

/** Earliest YYYY-MM-DD from a list of dates. */
export function earliestDateYmd(dates: Date[]): string {
  if (dates.length === 0) return formatLocalDateYmd(new Date())
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  return formatLocalDateYmd(sorted[0])
}

/**
 * Build API fields from UI state. `primaryDate` is the date picked in the main picker.
 * `preferredDate` is always the earliest day across the selection.
 */
export function buildFlexibleSchedulePayload(
  primaryDate: Date,
  state: FlexibleScheduleState,
): { preferredDate: string } & FlexibleScheduleFields {
  const primaryYmd = formatLocalDateYmd(primaryDate)

  if (!state.enabled) {
    return { preferredDate: primaryYmd }
  }

  if (state.mode === 'range' && state.rangeEndDate) {
    const endYmd = formatLocalDateYmd(state.rangeEndDate)
    const preferredDate = primaryYmd <= endYmd ? primaryYmd : endYmd
    const preferredDateEnd = primaryYmd <= endYmd ? endYmd : primaryYmd
    if (preferredDate === preferredDateEnd) {
      return { preferredDate }
    }
    return { preferredDate, preferredDateEnd }
  }

  if (state.mode === 'multiple') {
    const all = [primaryDate, ...state.additionalDates]
    const seen = new Set<string>()
    const uniqueYmd: string[] = []
    for (const d of all) {
      const ymd = formatLocalDateYmd(d)
      if (!seen.has(ymd)) {
        seen.add(ymd)
        uniqueYmd.push(ymd)
      }
    }
    uniqueYmd.sort()
    const preferredDate = uniqueYmd[0]
    const additionalPreferredDates = uniqueYmd.slice(1, 1 + MAX_ADDITIONAL_PREFERRED_DATES)
    if (additionalPreferredDates.length === 0) {
      return { preferredDate }
    }
    return { preferredDate, additionalPreferredDates }
  }

  return { preferredDate: primaryYmd }
}

export function appendFlexibleScheduleToFormData(
  formData: FormData,
  fields: FlexibleScheduleFields,
): void {
  if (fields.preferredDateEnd) {
    formData.append('preferredDateEnd', fields.preferredDateEnd)
  }
  if (fields.additionalPreferredDates?.length) {
    for (const d of fields.additionalPreferredDates) {
      formData.append('additionalPreferredDates', d)
    }
  }
}

export function appendFlexibleScheduleToUrlParams(
  params: URLSearchParams,
  fields: FlexibleScheduleFields,
): void {
  if (fields.preferredDateEnd) {
    params.set('preferredDateEnd', fields.preferredDateEnd)
  } else {
    params.delete('preferredDateEnd')
  }
  if (fields.additionalPreferredDates?.length) {
    params.set('additionalPreferredDates', fields.additionalPreferredDates.join(','))
  } else {
    params.delete('additionalPreferredDates')
  }
}

export function readFlexibleScheduleFromUrlParams(
  params: URLSearchParams,
): FlexibleScheduleFields {
  const preferredDateEnd = params.get('preferredDateEnd')?.trim() || undefined
  const raw = params.get('additionalPreferredDates')?.trim()
  const additionalPreferredDates = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
    : undefined
  return {
    ...(preferredDateEnd ? { preferredDateEnd } : {}),
    ...(additionalPreferredDates?.length ? { additionalPreferredDates } : {}),
  }
}

export function mergeFlexibleScheduleIntoPayload<T extends Record<string, unknown>>(
  payload: T,
  fields: FlexibleScheduleFields,
): T & FlexibleScheduleFields {
  return {
    ...payload,
    ...(fields.preferredDateEnd ? { preferredDateEnd: fields.preferredDateEnd } : {}),
    ...(fields.additionalPreferredDates?.length
      ? { additionalPreferredDates: fields.additionalPreferredDates }
      : {}),
  }
}

export function parseAdditionalPreferredDatesFromBooking(
  raw: unknown,
): string[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const dates = raw
    .filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
  return dates.length > 0 ? dates : undefined
}

/** Human-readable schedule label for cards and detail views. */
export function formatFlexibleScheduleLabel(
  preferredDate?: string,
  preferredTime?: string,
  preferredDateEnd?: string,
  additionalPreferredDates?: string[],
): string {
  const timePart = preferredTime ? ` at ${preferredTime.slice(0, 5)}` : ''
  if (!preferredDate) return '—'

  if (preferredDateEnd && preferredDateEnd !== preferredDate) {
    return `${formatYmdDisplay(preferredDate)} – ${formatYmdDisplay(preferredDateEnd)}${timePart}`
  }

  const extra = additionalPreferredDates?.filter((d) => d !== preferredDate) ?? []
  if (extra.length > 0) {
    const all = [preferredDate, ...extra].sort()
    if (all.length === 2) {
      return `${formatYmdDisplay(all[0])} or ${formatYmdDisplay(all[1])}${timePart}`
    }
    return `${all.length} preferred days${timePart}`
  }

  return `${formatYmdDisplay(preferredDate)}${timePart}`
}

function formatYmdDisplay(ymd: string): string {
  const d = parseLocalDateYmd(ymd)
  if (!d) return ymd
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function validateFlexibleScheduleState(
  primaryDate: Date,
  state: FlexibleScheduleState,
): string | null {
  if (!state.enabled) return null

  const primaryYmd = formatLocalDateYmd(primaryDate)

  if (state.mode === 'range') {
    if (!state.rangeEndDate) return 'Please select an end date for your date range.'
    const endYmd = formatLocalDateYmd(state.rangeEndDate)
    if (endYmd <= primaryYmd) {
      return 'End date must be after your first date.'
    }
    return null
  }

  if (state.mode === 'multiple') {
    const extra = state.additionalDates.filter(
      (d) => formatLocalDateYmd(d) !== primaryYmd,
    )
    if (extra.length === 0) {
      return 'Add at least one more day, or turn off flexible schedule.'
    }
    if (extra.length > MAX_ADDITIONAL_PREFERRED_DATES) {
      return `You can add up to ${MAX_ADDITIONAL_PREFERRED_DATES} extra days.`
    }
    for (const d of extra) {
      if (formatLocalDateYmd(d) <= primaryYmd) {
        return 'Additional days must be after your first date.'
      }
    }
  }

  return null
}
