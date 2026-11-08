import {
  formatRecurrenceScheduleLabel,
  parseRecurrenceFrequency,
  readRecurrenceFromUrlParams,
  type RecurrenceScheduleFields,
} from '@/lib/bookingRecurrence'
import type { Booking } from '@/types'
import type { BookingLike } from '@/lib/bookingDisplay'

export function resolveBookingRecurrenceFields(
  searchParams: URLSearchParams,
  booking?: Booking | null,
): RecurrenceScheduleFields {
  const fromUrl = readRecurrenceFromUrlParams(searchParams)
  if (fromUrl.recurrenceFrequency) return fromUrl

  const b = booking as BookingLike | null | undefined
  const freq = parseRecurrenceFrequency(
    typeof b?.recurrenceFrequency === 'string' ? b.recurrenceFrequency : undefined,
  )
  if (!freq || freq === 'ONCE') return {}
  return {
    recurrenceFrequency: freq,
    ...(b?.recurrenceDaysOfWeek?.length
      ? { recurrenceDaysOfWeek: b.recurrenceDaysOfWeek as import('@/lib/bookingRecurrence').IsoWeekday[] }
      : {}),
  }
}

export function hasRecurringBookingIntent(fields: RecurrenceScheduleFields): boolean {
  return Boolean(fields.recurrenceFrequency && fields.recurrenceFrequency !== 'ONCE')
}

export function formatRecurringPatternForDisplay(
  fields: RecurrenceScheduleFields,
  labels: Parameters<typeof formatRecurrenceScheduleLabel>[1],
): string | null {
  if (!hasRecurringBookingIntent(fields)) return null
  return formatRecurrenceScheduleLabel(fields, labels)
}
