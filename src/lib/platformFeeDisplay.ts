import { parseBookingMoney } from "@/lib/bookingDisplay";

/** Parsed platform / service fee amount (0 when waived or disabled). */
export function platformFeeAmount(...candidates: unknown[]): number {
  for (const raw of candidates) {
    const n = parseBookingMoney(raw);
    if (n !== null) return n;
  }
  return 0;
}

/** Show Kraftigo / platform / service fee row only when the API charged a fee. */
export function shouldShowPlatformFee(fee: number | null | undefined): boolean {
  return Number(fee) > 0;
}

/**
 * Customer total from locked booking pricing: job price plus fee when fees are on.
 * Prefer `finalAgreedPrice` from the API; do not add a client-side fee estimate.
 */
export function customerTotalFromBookingPricing(
  finalAgreedPrice: number | null,
  platformFee: number | null,
  fallbackJobPrice: number,
): number {
  const job =
    finalAgreedPrice !== null && Number.isFinite(finalAgreedPrice)
      ? finalAgreedPrice
      : fallbackJobPrice;
  const fee = platformFee !== null && shouldShowPlatformFee(platformFee) ? platformFee : 0;
  return job + fee;
}
