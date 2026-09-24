"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ArtisanProfile } from "@/types";
import ProfileCollapsibleSection, {
  ProfileInfoRow,
} from "@/components/shared/ProfileCollapsibleSection";
import Button from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  getVerificationMyStatus,
  hasOpenDiditKycSession,
  resolveEffectiveKycStatus,
  startDiditKycSession,
} from "@/lib/api/verification";
import {
  formatTransportType,
  formatVerificationStatus,
  maskBic,
  maskIban,
  readProfileField,
  readVerificationField,
} from "@/lib/artisanProfileDisplay";

type KrafterProfileReadOnlySectionsProps = {
  profile: ArtisanProfile;
};

export default function KrafterProfileReadOnlySections({
  profile,
}: KrafterProfileReadOnlySectionsProps) {
  const router = useRouter();
  const [isStartingKyc, setIsStartingKyc] = useState(false);
  const kycStatus = readVerificationField(profile, "kycStatus", "kyc_status")?.toUpperCase();

  const handleContinueIdentityVerification = async () => {
    setIsStartingKyc(true);
    try {
      const status = await getVerificationMyStatus();
      const effectiveKyc = resolveEffectiveKycStatus(status);

      if (effectiveKyc === "APPROVED") {
        toast.success("Your identity is already verified!");
        return;
      }

      const isResuming = hasOpenDiditKycSession(status);
      const { verificationUrl } = await startDiditKycSession();
      toast.success(
        isResuming
          ? "Resuming your verification session..."
          : "Starting identity verification...",
      );
      window.location.href = verificationUrl;
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data &&
        typeof err.response.data.message === "string"
          ? err.response.data.message
          : "Failed to start identity verification. Please try again.";
      toast.error(message);
    } finally {
      setIsStartingKyc(false);
    }
  };
  const stripeConnected = Boolean(readProfileField(profile, "stripeAccountId", "stripe_account_id"));
  const toolsOwned =
    typeof profile.toolsOwned === "boolean" ? (profile.toolsOwned ? "Yes" : "No") : undefined;

  return (
    <div className="space-y-3">
      <ProfileCollapsibleSection title="Work setup" subtitle="From onboarding — not editable here">
        <ProfileInfoRow label="Own tools" value={toolsOwned} />
        <ProfileInfoRow label="Transport" value={formatTransportType(profile.transportType)} />
        <ProfileInfoRow label="Tax / VAT ID" value={readProfileField(profile, "taxOrVatId", "tax_or_vat_id")} />
        <ProfileInfoRow
          label="Country of residence"
          value={readProfileField(profile, "countryOfResidence", "country_of_residence")}
        />
        <ProfileInfoRow label="Postal code on file" value={profile.postalCode} />
        <p className="text-[12px] font-poppins text-[#667085] pt-2">
          These fields were captured during onboarding and cannot be changed from the profile editor.
        </p>
      </ProfileCollapsibleSection>

      <ProfileCollapsibleSection title="Verification & KYC" subtitle="Identity verified via Didit">
        <ProfileInfoRow
          label="Profile verification"
          value={formatVerificationStatus(
            readProfileField(profile, "verificationStatus", "verification_status") ??
              readVerificationField(profile, "status"),
          )}
        />
        <ProfileInfoRow
          label="KYC status"
          value={formatVerificationStatus(kycStatus)}
        />
        <ProfileInfoRow
          label="Government ID type"
          value={readVerificationField(profile, "governmentIdType", "government_id_type")}
        />
        <ProfileInfoRow
          label="Rejection reason"
          value={readVerificationField(profile, "rejectionReason", "rejection_reason")}
        />
        <div className="pt-3 space-y-2">
          {kycStatus !== "APPROVED" ? (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={isStartingKyc}
              onClick={() => void handleContinueIdentityVerification()}
            >
              {isStartingKyc ? "Opening Didit…" : "Continue identity verification"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => router.push("/tasker/dashboard/work-eligible")}
          >
            Manage work eligibility documents
          </Button>
        </div>
      </ProfileCollapsibleSection>

      <ProfileCollapsibleSection title="Payout" subtitle="Stripe Connect">
        <ProfileInfoRow label="Stripe connected" value={stripeConnected ? "Yes" : "Not connected"} />
        <ProfileInfoRow
          label="IBAN on file"
          value={maskIban(readProfileField(profile, "payoutIban", "payout_iban"))}
        />
        <ProfileInfoRow
          label="BIC on file"
          value={maskBic(readProfileField(profile, "payoutBic", "payout_bic"))}
        />
        <p className="text-[12px] font-poppins text-[#667085] pt-2">
          Payout details are managed through Stripe Connect, not manual bank edits.
        </p>
        <div className="pt-3">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => router.push("/tasker/dashboard/paymentMethod")}
          >
            {stripeConnected ? "Manage payout account" : "Connect payout account"}
          </Button>
        </div>
      </ProfileCollapsibleSection>
    </div>
  );
}
