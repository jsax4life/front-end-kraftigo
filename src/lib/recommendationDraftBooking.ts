/** sessionStorage key for the id returned from `POST .../create-for-recommendation` */
export const RECOMMENDATION_DRAFT_BOOKING_SESSION_KEY =
  "kraftigo_recommendation_draft_booking_id";

export function persistRecommendationDraftBookingId(id: string): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(RECOMMENDATION_DRAFT_BOOKING_SESSION_KEY, id);
  } catch {
    /* private mode / quota */
  }
}

export function readRecommendationDraftBookingIdFromSession(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(RECOMMENDATION_DRAFT_BOOKING_SESSION_KEY);
  } catch {
    return null;
  }
}

export function clearRecommendationDraftBookingIdFromSession(): void {
  try {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(RECOMMENDATION_DRAFT_BOOKING_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
