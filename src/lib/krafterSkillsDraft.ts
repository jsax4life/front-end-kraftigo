import type { ServiceCategoryOffering } from "@/lib/api/krafter-profile-completion";
import type { ServiceSkillGroup } from "@/lib/api/services";

export type SkillOfferingDraft = {
  categoryId: string;
  categoryName: string;
  rateType: "HOURLY" | "FLAT";
  price: string;
  experienceYears: string;
  iconUrl?: string | null;
  photoUrl?: string;
};

function pickNum(raw: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = parseFloat(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function pickStr(raw: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = raw[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function normalizeOffering(raw: unknown): ServiceCategoryOffering | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const serviceCategoryId = pickStr(o, "serviceCategoryId", "service_category_id");
  if (!serviceCategoryId) return null;
  const pricingTypeRaw = pickStr(o, "pricingType", "pricing_type") ?? "HOURLY";
  const pricingType = pricingTypeRaw.toUpperCase() === "FLAT" ? "FLAT" : "HOURLY";
  return {
    serviceCategoryId,
    serviceCategoryName: pickStr(o, "serviceCategoryName", "service_category_name"),
    pricingType,
    hourlyRate: pickNum(o, "hourlyRate", "hourly_rate"),
    flatRate: pickNum(o, "flatRate", "flat_rate"),
    experienceYears: pickNum(o, "experienceYears", "experience_years"),
    photoUrl: pickStr(o, "photoUrl", "photo_url"),
  };
}

/** Read offerings from GET skills status or PATCH skills summary response. */
export function extractServiceCategoryOfferings(data: unknown): ServiceCategoryOffering[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const nestedSkills =
    root.skills && typeof root.skills === "object"
      ? (root.skills as Record<string, unknown>)
      : null;
  const raw =
    nestedSkills?.serviceCategoryOfferings ??
    nestedSkills?.service_category_offerings ??
    root.serviceCategoryOfferings ??
    root.service_category_offerings;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeOffering).filter((x): x is ServiceCategoryOffering => x != null);
}

function categoryMetaFromGroups(
  groups: ServiceSkillGroup[],
  categoryId: string,
): { name: string; iconUrl?: string | null } {
  for (const group of groups) {
    if (group.category.id === categoryId) {
      return { name: group.category.name, iconUrl: group.category.iconUrl };
    }
    for (const skill of group.skills) {
      if (skill.id === categoryId) {
        return { name: skill.name, iconUrl: skill.iconUrl ?? group.category.iconUrl };
      }
    }
  }
  return { name: "Skill category" };
}

export function mapOfferingsToSkillDrafts(
  offerings: ServiceCategoryOffering[],
  groups: ServiceSkillGroup[] = [],
): SkillOfferingDraft[] {
  return offerings.map((o) => {
    const meta = categoryMetaFromGroups(groups, o.serviceCategoryId);
    const categoryName =
      o.serviceCategoryName?.trim() ||
      (meta.name !== "Skill category" ? meta.name : o.serviceCategoryId);
    const price =
      o.pricingType === "HOURLY"
        ? o.hourlyRate != null
          ? String(o.hourlyRate)
          : ""
        : o.flatRate != null
          ? String(o.flatRate)
          : "";
    return {
      categoryId: o.serviceCategoryId,
      categoryName,
      iconUrl: meta.iconUrl,
      rateType: o.pricingType,
      price,
      experienceYears: o.experienceYears != null ? String(o.experienceYears) : "",
      photoUrl: o.photoUrl,
    };
  });
}
