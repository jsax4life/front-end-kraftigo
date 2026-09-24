import type { KrafterProfileCompletionSummary } from "@/lib/api/krafter-profile-completion";
import type { VerificationMyStatus } from "@/lib/api/verification";
import {
  resolveEffectiveKycStatus,
} from "@/lib/api/verification";
import { isKrafterIdentityVerified } from "@/lib/krafterProfileCompletionDisplay";

/** KYC approved — summary, verification status, or both. */
export function isKrafterIdentityVerifiedFromSources(sources: {
  summary?: KrafterProfileCompletionSummary | null;
  verificationStatus?: VerificationMyStatus | null;
}): boolean {
  if (isKrafterIdentityVerified(sources.summary)) return true;
  return resolveEffectiveKycStatus(sources.verificationStatus) === "APPROVED";
}
