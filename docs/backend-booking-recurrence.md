# Frontend note: recurring booking preference

## Context

Customers can already set an **optional flexible schedule** on the service-details step (`preferredDateEnd`, `additionalPreferredDates`). Separately, they may indicate that work should **repeat** (weekly, bi-weekly, monthly, quarterly, or on selected weekdays).

The verify-details step previously collected frequency in the URL only; it was **not** sent to the API. The frontend now forwards recurrence fields on booking creation (see below).

## Distinction

| Feature | Purpose | Existing API fields |
|--------|---------|---------------------|
| Flexible schedule | Alternative **dates** for a single booking window | `preferredDateEnd`, `additionalPreferredDates` |
| Recurring preference | **Repeat pattern** for ongoing service | `recurrenceFrequency`, `recurrenceDaysOfWeek` (new) |

**Frontend rule:** customers cannot enable **flexible schedule** and **recurring booking** at the same time. If legacy URLs contain both, the client prefers **recurrence** and drops flexible fields before submit.

## Request fields (multipart FormData)

Sent on:

- `POST /api/bookings`
- `POST /api/bookings/create-for-recommendation`
- `POST /api/bookings/publish-to-marketplace`

Omitted when the customer leaves recurring **off** (equivalent to one-time / `ONCE`).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `recurrenceFrequency` | string enum | When recurring enabled | See enum below |
| `recurrenceDaysOfWeek` | repeated integer **or** comma-separated | When `CUSTOM_DAYS` | ISO weekday **Monday = 1** … **Sunday = 7**; at least one day |

### `recurrenceFrequency` enum

```
ONCE          — default when field omitted (no recurrence)
WEEKLY
BIWEEKLY
MONTHLY
QUARTERLY
CUSTOM_DAYS   — requires recurrenceDaysOfWeek
```

Aligns with custom-kraft `frequency` (`ONCE`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`) plus `QUARTERLY` and `CUSTOM_DAYS`.

### Example

```
preferredDate=2026-03-10
preferredTime=10:00
recurrenceFrequency=CUSTOM_DAYS
recurrenceDaysOfWeek=2
recurrenceDaysOfWeek=4
recurrenceDaysOfWeek=6
```

## Response / booking model

Please persist and return on booking detail/list (camelCase or snake_case):

```json
{
  "recurrenceFrequency": "BIWEEKLY",
  "recurrenceDaysOfWeek": null
}
```

```json
{
  "recurrenceFrequency": "CUSTOM_DAYS",
  "recurrenceDaysOfWeek": [1, 3, 5]
}
```

## Product / fulfilment (backend-owned)

The frontend only captures **customer intent**. Suggested backend behaviour (not implemented in FE):

1. Store recurrence on the booking record.
2. Surface to Krafters in application/request UI.
3. When operationalising repeats: generate child bookings, subscriptions, or calendar series using `preferredDate` / `preferredTime` as anchor and `recurrenceFrequency` + `recurrenceDaysOfWeek` as rules.
4. Do **not** interpret flexible-schedule date lists as recurrence.

## Backward compatibility

- Bookings created without these fields behave as today (one-time).
- `CUSTOM_DAYS` without `recurrenceDaysOfWeek` should be rejected with 400.
