/**
 * Customer recurring booking preference (distinct from flexible schedule date options).
 */

export type BookingRecurrenceFrequency =
  | 'ONCE'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'CUSTOM_DAYS'

/** ISO weekday: Monday = 1 … Sunday = 7 */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const ISO_WEEKDAYS: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7]

export interface RecurrenceScheduleFields {
  recurrenceFrequency?: BookingRecurrenceFrequency
  recurrenceDaysOfWeek?: IsoWeekday[]
}

export interface RecurrenceScheduleState {
  enabled: boolean
  frequency: BookingRecurrenceFrequency
  daysOfWeek: IsoWeekday[]
}

export function createInitialRecurrenceScheduleState(): RecurrenceScheduleState {
  return {
    enabled: false,
    frequency: 'WEEKLY',
    daysOfWeek: [],
  }
}

const LEGACY_SLUG_TO_FREQUENCY: Record<string, BookingRecurrenceFrequency> = {
  'just-once': 'ONCE',
  weekly: 'WEEKLY',
  'every-2-weeks': 'BIWEEKLY',
  monthly: 'MONTHLY',
}

const FREQUENCY_ALIASES: Record<string, BookingRecurrenceFrequency> = {
  ONCE: 'ONCE',
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  BI_WEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  CUSTOM_DAYS: 'CUSTOM_DAYS',
  CUSTOM: 'CUSTOM_DAYS',
}

export function parseRecurrenceFrequency(raw: string | null | undefined): BookingRecurrenceFrequency | undefined {
  const t = raw?.trim()
  if (!t) return undefined
  const upper = t.toUpperCase().replace(/-/g, '_')
  if (FREQUENCY_ALIASES[upper]) return FREQUENCY_ALIASES[upper]
  const legacy = LEGACY_SLUG_TO_FREQUENCY[t.toLowerCase()]
  return legacy
}

function parseDaysOfWeek(raw: string | null | undefined): IsoWeekday[] | undefined {
  const t = raw?.trim()
  if (!t) return undefined
  const parts = t.split(',').map((s) => s.trim())
  const out: IsoWeekday[] = []
  const seen = new Set<number>()
  for (const p of parts) {
    const n = Number(p)
    if (!Number.isInteger(n) || n < 1 || n > 7) continue
    if (seen.has(n)) continue
    seen.add(n)
    out.push(n as IsoWeekday)
  }
  out.sort((a, b) => a - b)
  return out.length > 0 ? out : undefined
}

export function buildRecurrenceSchedulePayload(
  state: RecurrenceScheduleState,
): RecurrenceScheduleFields {
  if (!state.enabled) return {}
  const frequency = state.frequency
  if (frequency === 'ONCE') return {}

  if (frequency === 'CUSTOM_DAYS') {
    const days = [...state.daysOfWeek].sort((a, b) => a - b)
    if (days.length === 0) return {}
    return { recurrenceFrequency: frequency, recurrenceDaysOfWeek: days }
  }

  return { recurrenceFrequency: frequency }
}

export function appendRecurrenceToFormData(
  formData: FormData,
  fields: RecurrenceScheduleFields,
): void {
  if (!fields.recurrenceFrequency || fields.recurrenceFrequency === 'ONCE') return
  formData.append('recurrenceFrequency', fields.recurrenceFrequency)
  if (
    fields.recurrenceFrequency === 'CUSTOM_DAYS' &&
    fields.recurrenceDaysOfWeek?.length
  ) {
    for (const d of fields.recurrenceDaysOfWeek) {
      formData.append('recurrenceDaysOfWeek', String(d))
    }
  }
}

export function appendRecurrenceToUrlParams(
  params: URLSearchParams,
  fields: RecurrenceScheduleFields,
): void {
  if (!fields.recurrenceFrequency || fields.recurrenceFrequency === 'ONCE') {
    params.delete('recurrenceFrequency')
    params.delete('recurrenceDaysOfWeek')
    params.delete('frequency')
    return
  }
  params.set('recurrenceFrequency', fields.recurrenceFrequency)
  if (
    fields.recurrenceFrequency === 'CUSTOM_DAYS' &&
    fields.recurrenceDaysOfWeek?.length
  ) {
    params.set('recurrenceDaysOfWeek', fields.recurrenceDaysOfWeek.join(','))
  } else {
    params.delete('recurrenceDaysOfWeek')
  }
  params.delete('frequency')
}

export function readRecurrenceFromUrlParams(
  params: URLSearchParams,
): RecurrenceScheduleFields {
  const legacy = parseRecurrenceFrequency(params.get('frequency'))
  const recurrenceFrequency =
    parseRecurrenceFrequency(params.get('recurrenceFrequency')) ?? legacy
  const recurrenceDaysOfWeek = parseDaysOfWeek(params.get('recurrenceDaysOfWeek'))
  return {
    ...(recurrenceFrequency && recurrenceFrequency !== 'ONCE'
      ? { recurrenceFrequency }
      : {}),
    ...(recurrenceDaysOfWeek?.length ? { recurrenceDaysOfWeek } : {}),
  }
}

export function recurrenceFieldsToState(
  fields: RecurrenceScheduleFields,
): RecurrenceScheduleState {
  const frequency = fields.recurrenceFrequency ?? 'ONCE'
  if (frequency === 'ONCE') {
    return createInitialRecurrenceScheduleState()
  }
  return {
    enabled: true,
    frequency,
    daysOfWeek:
      frequency === 'CUSTOM_DAYS' ? (fields.recurrenceDaysOfWeek ?? []) : [],
  }
}

export function mergeRecurrenceIntoPayload<T extends Record<string, unknown>>(
  payload: T,
  fields: RecurrenceScheduleFields,
): T & RecurrenceScheduleFields {
  if (!fields.recurrenceFrequency || fields.recurrenceFrequency === 'ONCE') {
    return payload
  }
  return {
    ...payload,
    recurrenceFrequency: fields.recurrenceFrequency,
    ...(fields.recurrenceDaysOfWeek?.length
      ? { recurrenceDaysOfWeek: fields.recurrenceDaysOfWeek }
      : {}),
  }
}

export function validateRecurrenceScheduleState(
  state: RecurrenceScheduleState,
): string | null {
  if (!state.enabled) return null
  if (state.frequency === 'CUSTOM_DAYS' && state.daysOfWeek.length === 0) {
    return 'Select at least one day of the week, or turn off recurring booking.'
  }
  return null
}

export function formatRecurrenceFrequencyLabel(
  frequency: BookingRecurrenceFrequency,
  labels: {
    once: string
    weekly: string
    biweekly: string
    monthly: string
    quarterly: string
    customDays: string
  },
): string {
  switch (frequency) {
    case 'ONCE':
      return labels.once
    case 'WEEKLY':
      return labels.weekly
    case 'BIWEEKLY':
      return labels.biweekly
    case 'MONTHLY':
      return labels.monthly
    case 'QUARTERLY':
      return labels.quarterly
    case 'CUSTOM_DAYS':
      return labels.customDays
    default:
      return labels.once
  }
}

export type RecurrenceSummaryMessageKey =
  | 'recurrenceSummaryNeedsDate'
  | 'recurrenceSummaryWeekly'
  | 'recurrenceSummaryBiweekly'
  | 'recurrenceSummaryMonthly'
  | 'recurrenceSummaryQuarterly'
  | 'recurrenceSummaryCustomDays'
  | 'recurrenceSummaryCustomDaysPick'
  | 'recurrenceSummaryAddTime'

export interface RecurrenceSummaryMessage {
  key: RecurrenceSummaryMessageKey
  values: Record<string, string | number>
  /** Shown under the main line when start time is not chosen yet. */
  addTimeHint?: boolean
}

function formatAtTimePhrase(timeLabel: string, locale: string): string {
  const t = timeLabel.trim()
  if (!t) return ''
  return locale.startsWith('de') ? ` um ${t}` : ` at ${t}`
}

/** Plain-language summary for the recurring UI (message keys under `booking.serviceDetailsStep`). */
export function buildRecurrenceSummaryMessage(
  state: RecurrenceScheduleState,
  labels: {
    anchorYmd?: string
    weekdayLong: string
    startDateLabel: string
    timeLabel: string
    selectedWeekdaysLabel: string
    dayOfMonth: number
    locale: string
  },
): RecurrenceSummaryMessage | null {
  if (!state.enabled) return null

  if (!labels.anchorYmd?.trim()) {
    return { key: 'recurrenceSummaryNeedsDate', values: {} }
  }

  if (state.frequency === 'CUSTOM_DAYS' && state.daysOfWeek.length === 0) {
    return { key: 'recurrenceSummaryCustomDaysPick', values: {} }
  }

  const atTime = formatAtTimePhrase(labels.timeLabel, labels.locale)
  const base = {
    atTime,
    time: labels.timeLabel,
    startDate: labels.startDateLabel,
    weekday: labels.weekdayLong,
    dayOfMonth: labels.dayOfMonth,
  }

  let message: RecurrenceSummaryMessage | null = null

  switch (state.frequency) {
    case 'WEEKLY':
      message = { key: 'recurrenceSummaryWeekly', values: base }
      break
    case 'BIWEEKLY':
      message = { key: 'recurrenceSummaryBiweekly', values: base }
      break
    case 'MONTHLY':
      message = { key: 'recurrenceSummaryMonthly', values: base }
      break
    case 'QUARTERLY':
      message = { key: 'recurrenceSummaryQuarterly', values: base }
      break
    case 'CUSTOM_DAYS':
      message = {
        key: 'recurrenceSummaryCustomDays',
        values: { ...base, days: labels.selectedWeekdaysLabel },
      }
      break
    default:
      return null
  }

  if (!labels.timeLabel.trim()) {
    return { ...message, addTimeHint: true }
  }

  return message
}

export function formatRecurrenceScheduleLabel(
  fields: RecurrenceScheduleFields,
  labels: {
    once: string
    weekly: string
    biweekly: string
    monthly: string
    quarterly: string
    customDays: string
    weekdayShort: string[]
  },
): string | null {
  const frequency = fields.recurrenceFrequency
  if (!frequency || frequency === 'ONCE') return null
  const base = formatRecurrenceFrequencyLabel(frequency, labels)
  if (frequency === 'CUSTOM_DAYS' && fields.recurrenceDaysOfWeek?.length) {
    const names = fields.recurrenceDaysOfWeek
      .map((d) => labels.weekdayShort[d - 1])
      .filter(Boolean)
    if (names.length > 0) return `${base}: ${names.join(', ')}`
  }
  return base
}
