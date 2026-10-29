import type { KrafterDetail } from "@/components/shared/KrafterDetailModal";

const BADGE_PRIORITY = ["IDENTITY_VERIFIED", "TOP_PRO", "NEW_KRAFTER"] as const;

/** Generic avatar for home/browse listings — real photos on book-service flows only. */
export const KRAFTER_LISTING_PLACEHOLDER_IMAGE = "/avatar.svg";

export const KRAFTER_NEAR_YOU_MAX_CARDS = 5;

export function maskKrafterDetailForPublicListing(
  detail: KrafterDetail,
): KrafterDetail {
  return {
    ...detail,
    profileImage: KRAFTER_LISTING_PLACEHOLDER_IMAGE,
    portfolioImages: [],
  };
}

export function formatKrafterBadgeLabel(badge: string): string {
  const normalized = badge.trim().toUpperCase();
  if (normalized === "IDENTITY_VERIFIED") return "Verified";
  return badge.replace(/_/g, " ");
}

export function isKrafterIdentityVerifiedFields(input: {
  identityVerified?: boolean | null;
  badges?: string[] | null;
}): boolean {
  if (input.identityVerified === true) return true;
  const badges = input.badges ?? [];
  return badges.some((b) => String(b).trim().toUpperCase() === "IDENTITY_VERIFIED");
}

/** Prefer verified badge for display; server handles list ranking. */
export function pickPrimaryKrafterBadge(input: {
  badges?: string[] | null;
  identityVerified?: boolean | null;
  badge?: string | null;
}): string | null {
  const badges = [...(input.badges ?? [])];
  if (input.identityVerified && !badges.some((b) => b.toUpperCase() === "IDENTITY_VERIFIED")) {
    badges.unshift("IDENTITY_VERIFIED");
  }

  for (const preferred of BADGE_PRIORITY) {
    const match = badges.find((b) => b.trim().toUpperCase() === preferred);
    if (match) return formatKrafterBadgeLabel(match);
  }

  if (input.badge?.trim()) {
    return formatKrafterBadgeLabel(input.badge);
  }

  const first = badges[0];
  return first ? formatKrafterBadgeLabel(first) : null;
}

export function krafterVerifiedTooltip(input: {
  identityVerified?: boolean | null;
  badges?: string[] | null;
}): string | null {
  if (!isKrafterIdentityVerifiedFields(input)) return null;
  return "Identity verified with Didit";
}
