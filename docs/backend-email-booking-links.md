# Backend note: customer email links to `/bookings/:bookingId`

## Where receipts live

Receipt UI is **frontend-only**:

- List: `GET /api/payments/my` → `/user/profile/transactions`
- Detail: `GET /api/payments/:paymentId` → `/user/profile/receipt?id={paymentId}`

There is **no** server-rendered PDF route in this repo. “View Receipt” in email should land on the FE, not the API host.

## Supported public URL (implemented)

Both transactional emails can keep using the same pattern:

```text
https://www.kraftigo.app/bookings/{bookingUuid}
```

Optional query (recommended for clarity):

| Email CTA              | Suggested URL                                      |
|------------------------|----------------------------------------------------|
| Proceed to payment     | `/bookings/{uuid}?intent=pay`                      |
| View receipt           | `/bookings/{uuid}?intent=receipt`                  |

If `intent` is omitted, the page infers from booking status + `GET /api/payments/my` rows linked by `bookingId` / `contextId`.

## Frontend behaviour (`src/app/bookings/[id]/page.tsx`)

1. Requires customer login; unauthenticated users go to `/user/login?redirect=/bookings/{id}`.
2. Loads `GET /api/bookings/{id}?includePaymentSummary=true`.
3. **Pay:** `ACCEPTED` may call `POST /api/bookings/{id}/proceed-to-payment`, then opens Stripe checkout (`BookingPaymentConfirmModal`, `resume-checkout` as fallback).
4. **Receipt:** resolves payment id from `/api/payments/my` and redirects to `/user/profile/receipt?id={paymentId}`.
5. Otherwise redirects to `/user/book-service/active-job?status=accepted&id={id}`.

## Backend checks if links still fail

- Email base URL must be the **Next.js app** (`FRONTEND_URL` / `APP_URL`), not `API_URL`.
- `GET /api/bookings/:id` must allow the **booking customer** (JWT).
- Payment rows should include `bookingId` or `contextId` = booking uuid so receipt resolution works.
- Optional: include `paymentId` on booking detail when `includePaymentSummary=true` to avoid an extra list call (not required today).

## Display ID vs UUID

Emails may show `#KRF-3BD9F`; links correctly use the booking **UUID**. No change required unless you want short-id URLs (would need a new FE route + API lookup).
