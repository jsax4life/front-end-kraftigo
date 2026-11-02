# Frontend: booking verification settings (implemented)

The Krafter and customer apps read runtime flags from:

- `GET /api/bookings/verification-settings` (customer JWT)
- `GET /api/artisan/bookings/verification-settings` (Krafter JWT)

Cached for the browser session in `src/lib/bookingVerificationSettings.ts` (`useBookingVerificationSettings` hook).

| Flag | FE when `false` (default) |
|------|---------------------------|
| `arrivalPinEnabled` | Hide customer PIN UI; Krafter start omits `arrivalPin` in `POST …/start` |
| `completionProofRequired` | Allow 0–3 completion images; optional copy in complete UI |

When flags are `true`, previous PIN and required-photo behaviour is restored.
