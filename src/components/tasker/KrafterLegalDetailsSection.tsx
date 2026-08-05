"use client";

import type { ArtisanProfile } from "@/types";
import ProfileCollapsibleSection, {
  ProfileInfoRow,
} from "@/components/shared/ProfileCollapsibleSection";
import {
  formatProfileDate,
  getKycExtractedDetails,
  readKycField,
} from "@/lib/artisanProfileDisplay";

import { formatGenderLabel } from "@/lib/genderOptions";

function formatKycGender(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return formatGenderLabel(raw) ?? raw;
}

type KrafterLegalDetailsSectionProps = {
  profile: ArtisanProfile;
};

export default function KrafterLegalDetailsSection({ profile }: KrafterLegalDetailsSectionProps) {
  const kyc = getKycExtractedDetails(profile);
  const hasKyc = Boolean(kyc && Object.keys(kyc).length > 0);

  return (
    <ProfileCollapsibleSection
      title="Legal details"
      subtitle="Identity verified via Didit — read only"
    >
      <div className="pt-1 space-y-1">
        {hasKyc ? (
          <>
            <ProfileInfoRow label="Full name" value={readKycField(profile, "full_name")} />
            <ProfileInfoRow label="First name" value={readKycField(profile, "first_name")} />
            <ProfileInfoRow label="Last name" value={readKycField(profile, "last_name")} />
            <ProfileInfoRow
              label="Date of birth"
              value={formatProfileDate(readKycField(profile, "date_of_birth"))}
            />
            <ProfileInfoRow
              label="Gender"
              value={formatKycGender(readKycField(profile, "gender"))}
            />
            <ProfileInfoRow label="Nationality" value={readKycField(profile, "nationality")} />
            <ProfileInfoRow label="Age" value={readKycField(profile, "age")} />
            <ProfileInfoRow label="Document type" value={readKycField(profile, "document_type")} />
            <ProfileInfoRow label="Document number" value={readKycField(profile, "document_number")} />
            <ProfileInfoRow
              label="Document expiry"
              value={formatProfileDate(readKycField(profile, "expiration_date"))}
            />
            <ProfileInfoRow
              label="Issuing country"
              value={
                readKycField(profile, "issuing_state_name") ??
                readKycField(profile, "issuing_state")
              }
            />
            <ProfileInfoRow label="Marital status" value={readKycField(profile, "marital_status")} />
          </>
        ) : (
          <p className="text-[13px] font-poppins text-[#667085] py-2">
            No verified identity details on file yet. Complete Didit verification to populate this
            section.
          </p>
        )}
        <p className="text-[11px] font-poppins text-[#667085] pt-2">
          These fields come from your government ID verification and cannot be edited manually.
        </p>
      </div>
    </ProfileCollapsibleSection>
  );
}
