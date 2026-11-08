import type { FlexibleScheduleState, FlexibleScheduleFields } from '@/lib/flexibleSchedule'
import type { RecurrenceScheduleState, RecurrenceScheduleFields } from '@/lib/bookingRecurrence'

export function isFlexibleScheduleFieldsActive(
  fields: FlexibleScheduleFields,
): boolean {
  return Boolean(
    fields.preferredDateEnd?.trim() ||
      (fields.additionalPreferredDates?.length ?? 0) > 0,
  )
}

export function isRecurrenceFieldsActive(fields: RecurrenceScheduleFields): boolean {
  const f = fields.recurrenceFrequency
  return Boolean(f && f !== 'ONCE')
}

/** Last-resort API payload: recurrence wins if both were set (should not happen in UI). */
export function resolveMutuallyExclusiveScheduleForApi(
  flex: FlexibleScheduleFields,
  recurrence: RecurrenceScheduleFields,
): { flex: FlexibleScheduleFields; recurrence: RecurrenceScheduleFields } {
  const flexActive = isFlexibleScheduleFieldsActive(flex)
  const recActive = isRecurrenceFieldsActive(recurrence)
  if (flexActive && recActive) {
    return { flex: {}, recurrence }
  }
  return { flex, recurrence }
}

export function isFlexibleScheduleActive(state: FlexibleScheduleState): boolean {
  return state.enabled
}

export function isRecurrenceScheduleActive(state: RecurrenceScheduleState): boolean {
  return state.enabled
}

/** Returns a message key under `booking.serviceDetailsStep` when both options are on. */
export function scheduleCombinationErrorKey(
  flexActive: boolean,
  recurrenceActive: boolean,
): 'scheduleMutexError' | null {
  if (flexActive && recurrenceActive) {
    return 'scheduleMutexError'
  }
  return null
}
