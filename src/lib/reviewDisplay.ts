export type MyReview = {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  revieweeName?: string;
  direction?: string;
  standoutTags?: string[];
};

function pickStr(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNum(o: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function normalizeReviewStatus(raw: unknown): MyReview["status"] | undefined {
  if (typeof raw !== "string") return undefined;
  const u = raw.toUpperCase();
  if (u === "PENDING" || u === "APPROVED" || u === "REJECTED") return u;
  return undefined;
}

/** Normalize one item from `GET /api/reviews/my`. */
export function normalizeMyReview(raw: unknown): MyReview | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const bookingNested =
    o.booking && typeof o.booking === "object" ? (o.booking as Record<string, unknown>) : null;
  const revieweeNested =
    o.reviewee && typeof o.reviewee === "object" ? (o.reviewee as Record<string, unknown>) : null;

  const bookingId =
    pickStr(o, "bookingId", "booking_id") ??
    (bookingNested ? pickStr(bookingNested, "id") : undefined);
  if (!bookingId) return null;

  const rating = pickNum(o, "rating");
  if (rating == null) return null;

  const tagsRaw = o.standoutTags ?? o.standout_tags ?? o.tags ?? o.highlights;
  const standoutTags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((t): t is string => typeof t === "string")
    : undefined;

  return {
    id: pickStr(o, "id") ?? bookingId,
    bookingId,
    rating,
    comment:
      pickStr(o, "comment", "feedback", "details", "reviewText", "review_text") ?? undefined,
    status: normalizeReviewStatus(o.status),
    revieweeName:
      pickStr(revieweeNested ?? {}, "displayName", "fullName", "name") ??
      pickStr(o, "revieweeName", "reviewee_name") ??
      undefined,
    direction: pickStr(o, "direction"),
    standoutTags,
  };
}

export function normalizeMyReviews(data: unknown): MyReview[] {
  const list = Array.isArray(data) ? data : [];
  return list.map(normalizeMyReview).filter((r): r is MyReview => r != null);
}

export function findMyReviewForBooking(reviews: MyReview[], bookingId: string): MyReview | undefined {
  const id = bookingId.trim();
  if (!id) return undefined;
  return reviews.find((r) => r.bookingId === id);
}

export function formatReviewStatusLabel(status?: MyReview["status"]): string {
  if (status === "PENDING") return "Pending review";
  if (status === "APPROVED") return "Published";
  if (status === "REJECTED") return "Not published";
  return "Submitted";
}

export function reviewStarsLabel(rating: number): string {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(n) + "☆".repeat(5 - n);
}
