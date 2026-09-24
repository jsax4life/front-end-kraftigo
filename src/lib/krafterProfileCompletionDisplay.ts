import type { KrafterProfileCompletionSummary } from "@/lib/api/krafter-profile-completion";

/** Krafter dashboard requires ARTISAN role from complete-profile summary. */
export function canAccessKrafterDashboard(
  summary: KrafterProfileCompletionSummary | null | undefined,
): boolean {
  return summary?.account?.hasArtisanRole === true;
}

export type FinishProfileStepId = "personal" | "skills" | "eligibility" | "identity";

export type FinishProfileStepView = {
  id: FinishProfileStepId;
  /** Shown in checklist when step is not required for marketplace access. */
  optional: boolean;
  optionalBenefits?: string | null;
};

function isTruthyRequiredForMarketplace(value: boolean | undefined): boolean {
  return value === true;
}

export function isWorkEligibilityMarketplaceRequired(
  summary: KrafterProfileCompletionSummary | null | undefined,
): boolean {
  return isTruthyRequiredForMarketplace(summary?.workEligibility?.requiredForMarketplace);
}

export function isLegalIdentityMarketplaceRequired(
  summary: KrafterProfileCompletionSummary | null | undefined,
): boolean {
  return isTruthyRequiredForMarketplace(summary?.legalIdentity?.requiredForMarketplace);
}

export function isKrafterIdentityVerified(
  summary: KrafterProfileCompletionSummary | null | undefined,
): boolean {
  if (!summary) return false;
  if (summary.legalIdentity?.identityVerified === true) return true;
  const kyc = summary.legalIdentity?.kycStatus?.trim().toUpperCase();
  return kyc === "APPROVED";
}

/** Required-only progress for marketplace readiness (matches backend `allComplete`). */
export function computeMarketplaceRequiredProgress(
  summary: KrafterProfileCompletionSummary | null | undefined,
): { completed: number; total: number; percentage: number } {
  if (!summary) {
    return { completed: 0, total: 3, percentage: 0 };
  }

  const flags = [
    summary.initialOnboarding?.isComplete === true,
    summary.personalDetails?.isComplete === true,
    summary.skills?.isComplete === true,
  ];
  const total = flags.length;
  const completed = flags.filter(Boolean).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

/** Checklist rows for Finish Profile — required steps first, optional upsells when configured. */
export function buildFinishProfileSteps(
  summary: KrafterProfileCompletionSummary | null | undefined,
): FinishProfileStepView[] {
  if (!summary) {
    return [
      { id: "personal", optional: false },
      { id: "skills", optional: false },
    ];
  }

  const steps: FinishProfileStepView[] = [
    { id: "personal", optional: false },
    { id: "skills", optional: false },
  ];

  const identityRequired = isLegalIdentityMarketplaceRequired(summary);

  if (identityRequired || !isKrafterIdentityVerified(summary)) {
    steps.push({
      id: "identity",
      optional: !identityRequired,
      optionalBenefits: summary.legalIdentity?.optionalMarketplaceBenefits ?? null,
    });
  }

  return steps;
}

export function buildFinishProfileStepStatus(
  summary: KrafterProfileCompletionSummary | null | undefined,
): { completedStepIds: FinishProfileStepId[]; pendingStepIds: FinishProfileStepId[] } {
  const completedStepIds: FinishProfileStepId[] = [];
  const pendingStepIds: FinishProfileStepId[] = [];

  if (!summary) {
    return { completedStepIds, pendingStepIds };
  }

  if (summary.personalDetails?.isComplete) completedStepIds.push("personal");
  if (summary.skills?.isComplete) completedStepIds.push("skills");

  if (summary.workEligibility?.hasSubmittedAwaitingReview) {
    pendingStepIds.push("eligibility");
  } else if (summary.workEligibility?.isComplete) {
    completedStepIds.push("eligibility");
  }

  if (isKrafterIdentityVerified(summary)) {
    completedStepIds.push("identity");
  }

  return { completedStepIds, pendingStepIds };
}

export function routeForFinishProfileStep(stepId: FinishProfileStepId): string | null {
  const routeMap: Record<FinishProfileStepId, string> = {
    personal: "/tasker/profile/complete",
    skills: "/tasker/profile/complete?step=5",
    eligibility: "/tasker/dashboard/work-eligible",
    identity: "",
  };
  const route = routeMap[stepId];
  return route || null;
}

/** Prefer backend `recommendedNextStep` when present (snake_case tokens). */
export function routeForRecommendedNextStep(
  recommendedNextStep: string | null | undefined,
): string | null {
  if (!recommendedNextStep?.trim()) return null;
  const token = recommendedNextStep.trim().toLowerCase();
  const map: Record<string, string> = {
    personal_details: "/tasker/profile/complete",
    skills: "/tasker/profile/complete?step=5",
    work_eligibility: "/tasker/dashboard/work-eligible",
    legal_identity: "",
    initial_onboarding: "/tasker/switch-acct",
    payout: "/tasker/dashboard/paymentMethod",
  };
  return map[token] ?? null;
}
