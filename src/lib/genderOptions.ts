/** Legal gender options for Germany (Personenstandsgesetz): männlich, weiblich, divers, keine Angabe. */
export type GenderApiValue = "MALE" | "FEMALE" | "DIVERS" | "NOT_SPECIFIED";

export const GENDER_SELECT_OPTIONS: { value: GenderApiValue; label: string }[] = [
  { value: "MALE", label: "Male (Männlich)" },
  { value: "FEMALE", label: "Female (Weiblich)" },
  { value: "DIVERS", label: "Divers" },
  { value: "NOT_SPECIFIED", label: "Keine Angabe" },
];

export function normalizeGenderApiValue(raw: string | null | undefined): GenderApiValue | "" {
  const u = raw?.trim().toUpperCase();
  if (u === "MALE") return "MALE";
  if (u === "FEMALE") return "FEMALE";
  if (u === "DIVERS" || u === "DIVERSE" || u === "OTHER") return "DIVERS";
  if (u === "NOT_SPECIFIED" || u === "UNSPECIFIED" || u === "NONE" || u === "UNKNOWN") {
    return "NOT_SPECIFIED";
  }
  // Legacy UI labels
  if (raw === "Male" || raw === "Männlich") return "MALE";
  if (raw === "Female" || raw === "Weiblich") return "FEMALE";
  return "";
}

export function formatGenderLabel(raw: string | null | undefined): string | undefined {
  const normalized = normalizeGenderApiValue(raw);
  if (!normalized) return undefined;
  return GENDER_SELECT_OPTIONS.find((o) => o.value === normalized)?.label ?? raw ?? undefined;
}

export function isValidGenderSelection(value: string): value is GenderApiValue {
  return GENDER_SELECT_OPTIONS.some((o) => o.value === value);
}
