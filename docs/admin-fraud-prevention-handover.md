# Admin fraud-prevention — handover for admin repo

This customer/Krafter frontend **does not** implement admin UI. Admin flows live in a separate admin repository. Use this note with `frontend-fraud-prevention-integration.md` (§11) and the backend contract below.

**Auth:** JWT role must be exactly `ADMIN` (uppercase). `RolesGuard` does not accept `SUPER_ADMIN` or other aliases.

---

## Dispute queue & evidence

### List disputes

```http
GET /api/admin/disputes
Authorization: Bearer <JWT>
```

Returns all disputes, `createdAt` DESC. Use this for the queue — do not require manual dispute-id entry.

### Evidence packet

```http
GET /api/admin/disputes/:disputeId/evidence-packet
```

Stable top-level shape:

```json
{
  "generatedAt": "ISO8601",
  "dispute": { },
  "booking": { },
  "payment": { },
  "payouts": [],
  "escrow": [],
  "transactions": [],
  "verificationEvents": [],
  "evidenceSubmissions": [
    { "attachments": [{ "url": "presigned-15min" }] }
  ],
  "chat": {
    "conversation": null,
    "messages": [{ "id", "senderId", "content", "type", "createdAt" }]
  },
  "noShowEvents": [
    { "reversalId", "reversalReason", "reversedAt", "reversedById" }
  ],
  "participants": [{ "id", "email", "firstName", "lastName", "roles" }],
  "integrity": {
    "startPinVerified": true,
    "startLocationVerified": true,
    "completionLocationVerified": true,
    "workDurationSeconds": 3600,
    "beforeMedia": [],
    "afterMedia": [{ "url": "presigned" }],
    "anomalyFlags": []
  }
}
```

- Signed media TTL: **15 minutes**. On 403 from S3, refetch the packet — do not cache URLs.
- GPS: `booking.startLatitude`, `startLongitude`, `startAccuracyMeters`, completion equivalents, plus `verificationEvents`.
- Disable resolve while `dispute.status` is `RESOLVING` or `RESOLVED`.

### Review & resolve

```http
POST /api/admin/disputes/:disputeId/review
POST /api/admin/disputes/:disputeId/resolve
```

Resolve body:

```json
{
  "resolutionType": "REFUND_CUSTOMER" | "PAY_ARTISAN" | "SPLIT",
  "refundAmount": 100,
  "artisanAmount": 0,
  "adminNote": "Reasoned decision referencing the evidence."
}
```

For `SPLIT`, send explicit customer and Krafter amounts. Server validates cent-accurate allocation.

### Admin completion override

```http
POST /api/admin/bookings/:bookingId/confirm-completion
```

Use only after evidence review. Cannot override a booking already `DISPUTED`.

### Reverse no-show strike

```http
POST /api/admin/bookings/no-show-strikes/:eventId/reverse
Content-Type: application/json

{ "reason": "Evidence proved the Krafter was present." }
```

Reason is required. Event ids appear under `noShowEvents` in the evidence packet.

---

## Risk (operational signals — not fraud verdicts)

### Aggregate summary

```http
GET /api/admin/profiles/risk/summary
```

Response (array):

```json
[
  { "riskLevel": "LOW", "count": 42, "averageScore": "87.50" }
]
```

Higher `reliabilityScore` is better (0–100).

### Recalculate

```http
POST /api/admin/profiles/risk/recalculate
POST /api/admin/profiles/risk/:artisanId/recalculate
```

Per-artisan response:

```json
{
  "artisanId": "uuid",
  "reliabilityScore": 72,
  "riskLevel": "MEDIUM",
  "riskFactors": {
    "noShows": 0,
    "openDisputes": 1,
    "customerRefunds": 0,
    "splitResolutions": 0,
    "rejectedVerifications": 2,
    "flaggedVerifications": 0,
    "anomalousCompletions": 0,
    "completedJobs": 15
  },
  "marketplaceRiskSuspendedUntil": null
}
```

Profile detail: `GET /api/admin/profiles/artisans/:id` also exposes `reliabilityScore`, `riskLevel`, `riskFactors`.

---

## Payment operations

```http
GET  /api/admin/payments/operations/dashboard
GET  /api/admin/payments/operations/alerts?status=OPEN|RESOLVED
POST /api/admin/payments/operations/reconcile
POST /api/admin/payments/operations/alerts/:alertId/resolve
```

Resolve alert body: `{ "note": "…" }` (3–2000 chars).

Alert object uses field `id` (UUID). Fields include `type`, `severity`, `resourceType`, `resourceId`, `status`, `details`, `detectedAt`, `resolvedAt`, `resolutionNote`.

---

## Realtime (admin views)

Socket.IO namespace `/events`, event name `event`, body `{ type, timestamp, source, … }`.

Most fraud events include top-level `bookingId`. **Exception:** `DISPUTE_UNDER_REVIEW` and `DISPUTE_RESOLVED` emit `disputeId` only — refetch dispute list or resolve booking via dispute record.

Treat events as invalidation hints; always refetch REST canonical state.

---

## Shared party APIs (reference — implemented in this repo)

Customer/Krafter apps use:

- `POST /api/bookings/:id/arrival-pin`, `krafter-not-here`, `confirm-completion`, `dispute-completion`, `reauthorize-completion-payment`
- `POST /api/artisan/bookings/:id/start`, `complete`
- `POST /api/disputes`, `GET /api/disputes/my`, `POST /api/disputes/:id/evidence`
- `GET /api/payouts/wallet-summary`

See `frontend-fraud-prevention-integration.md` for full lifecycle rules.
