import { fetchKrafterPublicProfile } from "@/lib/api/bookings";
import { getServiceSkillGroups, type ServiceSkillGroup } from "@/lib/api/services";
import { buildCategoryBookingUrl } from "@/constants/betaLaunch";
import { formatFlatRate, formatHourlyRate } from "@/utils/currency";
import type { KrafterDetail } from "@/components/shared/KrafterDetailModal";

export type KrafterBookableOffering = {
  serviceCategoryId: string;
  serviceCategoryName: string;
  pricingType: "HOURLY" | "FLAT";
  hourlyRate?: number;
  flatRate?: number;
  experienceYears?: number;
};

type CategoryLike = { id: string; name: string };

export type KrafterProfileFetchContext = {
  skillGroups?: ServiceSkillGroup[];
  serviceCategories?: CategoryLike[];
  latitude?: number;
  longitude?: number;
};

let cachedSkillGroups: ServiceSkillGroup[] = [];
let skillGroupsLoadPromise: Promise<ServiceSkillGroup[]> | null = null;

/** Load skill taxonomy once (shared by home profile + booking flows). */
export async function ensureSkillGroupsLoaded(
  existing: ServiceSkillGroup[] = [],
): Promise<ServiceSkillGroup[]> {
  if (existing.length > 0) {
    cachedSkillGroups = existing;
    return existing;
  }
  if (cachedSkillGroups.length > 0) return cachedSkillGroups;
  if (!skillGroupsLoadPromise) {
    skillGroupsLoadPromise = getServiceSkillGroups()
      .then((groups) => {
        cachedSkillGroups = groups;
        return groups;
      })
      .finally(() => {
        skillGroupsLoadPromise = null;
      });
  }
  return skillGroupsLoadPromise;
}

function parseSkillTagLabelArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const tags: string[] = [];
  for (const entry of value) {
    if (typeof entry === "string" && entry.trim()) {
      tags.push(entry.trim());
      continue;
    }
    const obj = asRecord(entry);
    if (!obj) continue;
    const name = pickStr(
      obj,
      "name",
      "serviceCategoryName",
      "service_category_name",
      "label",
      "title",
    );
    if (name) tags.push(name);
  }
  return tags;
}

function categoryOptionsFromGroups(groups: ServiceSkillGroup[]): CategoryLike[] {
  return groups
    .map((group) => group.category)
    .filter((cat): cat is CategoryLike => Boolean(cat?.id && cat?.name));
}

/** Read skill tag labels from home / recommendation krafter rows. */
export function readSkillTagsFromHomeRaw(raw: Record<string, unknown>): string[] {
  const sources = [raw];
  for (const key of ["krafter", "profile", "artisan", "data"]) {
    const nested = asRecord(raw[key]);
    if (nested) sources.push(nested);
  }

  for (const src of sources) {
    for (const key of ["skillTags", "skill_tags"]) {
      const tags = parseSkillTagLabelArray(src[key]);
      if (tags.length > 0) return tags;
    }

    const skills = src.skills;
    if (Array.isArray(skills)) {
      const tags = parseSkillTagLabelArray(skills);
      if (tags.length > 0) return tags;
    }
  }

  const offerings = extractKrafterOfferings(raw);
  if (offerings.length > 0) {
    return skillTagsFromOfferings(offerings);
  }

  return extractSkillTags(raw, []);
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Normalize artisan API payload (nested or flat). */
export function unwrapArtisanApiPayload(raw: unknown): Record<string, unknown> | null {
  const root = asRecord(raw);
  if (!root) return null;
  return asRecord(root.artisan) ?? asRecord(root.data) ?? root;
}

/** Read krafter id from home / recommendations / compare rows. */
export function extractKrafterIdFromRow(raw: unknown): string | null {
  const root = asRecord(raw);
  if (!root) return null;
  const item = unwrapArtisanApiPayload(raw);
  return (
    pickStr(root, "krafterId", "krafter_id", "artisanId", "artisan_id", "id") ??
    (item ? pickStr(item, "krafterId", "krafter_id", "artisanId", "id") : undefined) ??
    null
  );
}

function readHourlyRateFromRow(raw: unknown): number | undefined {
  const root = asRecord(raw);
  const item = unwrapArtisanApiPayload(raw);
  return (
    pickNum(root ?? {}, "hourlyRate", "hourly_rate", "pricePerHour", "proposedPrice") ??
    (item ? pickNum(item, "hourlyRate", "hourly_rate", "pricePerHour") : undefined)
  );
}

function pushOffering(
  offerings: KrafterBookableOffering[],
  entry: Record<string, unknown>,
): void {
  const nestedCat = asRecord(entry.serviceCategory ?? entry.service_category);
  const serviceCategoryId =
    pickStr(entry, "serviceCategoryId", "service_category_id", "categoryId", "category_id") ??
    (nestedCat ? pickStr(nestedCat, "id") : undefined);
  if (!serviceCategoryId) return;
  if (offerings.some((o) => o.serviceCategoryId === serviceCategoryId)) return;

  const pricingRaw = pickStr(entry, "pricingType", "pricing_type") ?? "HOURLY";
  const pricingType = pricingRaw.toUpperCase() === "FLAT" ? "FLAT" : "HOURLY";
  offerings.push({
    serviceCategoryId,
    serviceCategoryName:
      pickStr(
        entry,
        "serviceCategoryName",
        "service_category_name",
        "categoryName",
        "name",
      ) ??
      (nestedCat ? pickStr(nestedCat, "name") : undefined) ??
      "Service",
    pricingType,
    hourlyRate: pickNum(entry, "hourlyRate", "hourly_rate"),
    flatRate: pickNum(entry, "flatRate", "flat_rate"),
    experienceYears: pickNum(entry, "experienceYears", "experience_years"),
  });
}

export function extractKrafterOfferings(raw: unknown): KrafterBookableOffering[] {
  const root = asRecord(raw);
  const item = unwrapArtisanApiPayload(raw);
  if (!item && !root) return [];

  const skillsBlock = asRecord(item?.skills ?? root?.skills);

  const list =
    item?.serviceCategoryOfferings ??
    item?.service_category_offerings ??
    item?.offerings ??
    skillsBlock?.serviceCategoryOfferings ??
    skillsBlock?.service_category_offerings ??
    root?.serviceCategoryOfferings ??
    root?.service_category_offerings;

  const offerings: KrafterBookableOffering[] = [];

  if (Array.isArray(list)) {
    for (const entry of list) {
      const o = asRecord(entry);
      if (o) pushOffering(offerings, o);
    }
  }

  const rateCard = item?.rateCard ?? item?.rate_card ?? root?.rateCard ?? root?.rate_card;
  if (Array.isArray(rateCard)) {
    for (const entry of rateCard) {
      const o = asRecord(entry);
      if (!o) continue;
      const nestedCat = asRecord(o.serviceCategory ?? o.service_category);
      const serviceCategoryId =
        pickStr(o, "serviceCategoryId", "service_category_id", "skillId", "categoryId") ??
        (nestedCat ? pickStr(nestedCat, "id") : undefined);
      if (!serviceCategoryId) continue;
      pushOffering(offerings, {
        ...o,
        serviceCategoryId,
        serviceCategoryName:
          pickStr(o, "serviceCategoryName", "service_category_name", "name") ??
          (nestedCat ? pickStr(nestedCat, "name") : undefined),
        hourlyRate:
          pickNum(o, "hourlyRate", "hourly_rate") ?? readHourlyRateFromRow(raw),
      });
    }
  }

  const rowSources = [item, root].filter(Boolean) as Record<string, unknown>[];
  for (const src of rowSources) {
    const rowCategoryId = pickStr(src, "serviceCategoryId", "service_category_id");
    if (!rowCategoryId || offerings.some((o) => o.serviceCategoryId === rowCategoryId)) {
      continue;
    }
    offerings.push({
      serviceCategoryId: rowCategoryId,
      serviceCategoryName:
        pickStr(src, "serviceCategoryName", "service_category_name", "categoryName") ??
        "Service",
      pricingType: "HOURLY",
      hourlyRate: readHourlyRateFromRow(raw),
    });
  }

  return offerings;
}

function normalizeSkillLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Map home / profile skill tag labels to bookable offerings via skill taxonomy or categories. */
export function buildOfferingsFromSkillTagNames(
  skillTags: string[],
  groups: ServiceSkillGroup[],
  hourlyRate?: number,
  categoryFallback: CategoryLike[] = [],
): KrafterBookableOffering[] {
  if (skillTags.length === 0) return [];

  const categories: CategoryLike[] = [];
  const seenCategoryIds = new Set<string>();
  for (const cat of [...categoryOptionsFromGroups(groups), ...categoryFallback]) {
    if (!cat.id || !cat.name || seenCategoryIds.has(cat.id)) continue;
    seenCategoryIds.add(cat.id);
    categories.push(cat);
  }
  if (categories.length === 0) return [];

  const offerings: KrafterBookableOffering[] = [];

  const matchTag = (tag: string, tagNorm: string): CategoryLike | null => {
    const tagLower = tag.trim().toLowerCase();

    for (const cat of categories) {
      if (cat.name.trim().toLowerCase() === tagLower) return cat;
    }

    for (const cat of categories) {
      if (normalizeSkillLabel(cat.name) === tagNorm) return cat;
    }

    for (const group of groups) {
      for (const skill of group.skills ?? []) {
        if (normalizeSkillLabel(skill.name) === tagNorm) {
          return { id: skill.id, name: skill.name };
        }
      }
    }

    for (const cat of categories) {
      const catNorm = normalizeSkillLabel(cat.name);
      if (catNorm.includes(tagNorm) || tagNorm.includes(catNorm)) return cat;
    }

    for (const group of groups) {
      for (const skill of group.skills ?? []) {
        const skillNorm = normalizeSkillLabel(skill.name);
        if (skillNorm.includes(tagNorm) || tagNorm.includes(skillNorm)) {
          return { id: skill.id, name: skill.name };
        }
      }
    }

    return null;
  };

  for (const tag of skillTags) {
    const tagNorm = normalizeSkillLabel(tag);
    if (!tagNorm) continue;

    const matched = matchTag(tag, tagNorm);
    if (!matched || offerings.some((o) => o.serviceCategoryId === matched.id)) continue;

    offerings.push({
      serviceCategoryId: matched.id,
      serviceCategoryName: matched.name,
      pricingType: "HOURLY",
      hourlyRate: hourlyRate && hourlyRate > 0 ? hourlyRate : undefined,
    });
  }

  return offerings;
}

function skillTagsFromOfferings(offerings: KrafterBookableOffering[]): string[] {
  return offerings
    .map((o) => o.serviceCategoryName)
    .filter((name) => name && name !== "Service");
}

const PUBLIC_PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
const publicProfileCache = new Map<
  string,
  { expires: number; payload: unknown }
>();

async function loadKrafterPublicProfile(
  krafterId: string,
  latitude?: number,
  longitude?: number,
): Promise<unknown | null> {
  const cacheKey = `${krafterId}:${latitude?.toFixed(3) ?? ""}:${longitude?.toFixed(3) ?? ""}`;
  const cached = publicProfileCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.payload;
  }

  const payload = await fetchKrafterPublicProfile(krafterId, {
    latitude,
    longitude,
  });
  if (payload) {
    publicProfileCache.set(cacheKey, {
      expires: Date.now() + PUBLIC_PROFILE_CACHE_TTL_MS,
      payload,
    });
  }
  return payload;
}

function detailHasBookableOfferings(detail: KrafterDetail): boolean {
  return (detail.serviceOfferings?.length ?? 0) > 0;
}

export function extractPortfolioImages(raw: unknown): string[] {
  const root = asRecord(raw);
  const item = unwrapArtisanApiPayload(raw);
  const work = item ? asRecord(item.work) : null;

  const candidates = [
    root?.portfolioPhotoUrls,
    root?.portfolio_photo_urls,
    root?.portfolioImages,
    root?.portfolio_images,
    item?.portfolioPhotoUrls,
    item?.portfolio_photo_urls,
    item?.portfolioImages,
    item?.portfolio_images,
    item?.workPhotos,
    item?.work_photos,
    work?.portfolioPhotoUrls,
    work?.portfolio_photo_urls,
  ];

  for (const c of candidates) {
    if (!Array.isArray(c)) continue;
    const urls = c.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
    if (urls.length > 0) return urls;
  }
  return [];
}

export function extractSkillTags(
  raw: unknown,
  offerings: KrafterBookableOffering[],
): string[] {
  const root = asRecord(raw);
  const item = unwrapArtisanApiPayload(raw);
  const skillSources = [root, item].filter(Boolean) as Record<string, unknown>[];

  for (const src of skillSources) {
    for (const key of ["skillTags", "skill_tags"]) {
      const tags = parseSkillTagLabelArray(src[key]);
      if (tags.length > 0) return tags;
    }
  }

  const fromOfferings = offerings
    .map((o) => o.serviceCategoryName)
    .filter((name) => name && name !== "Service");
  if (fromOfferings.length > 0) return fromOfferings;

  const primary = item ? pickStr(item, "primaryTrade", "primary_trade") : undefined;
  const secondary = item?.secondarySkills ?? item?.secondary_skills;
  const secondaryList = parseSkillTagLabelArray(secondary);
  return [primary, ...secondaryList].filter((s): s is string => Boolean(s));
}

export function formatOfferingRate(offering: KrafterBookableOffering): string {
  if (offering.pricingType === "FLAT" && offering.flatRate != null) {
    return formatFlatRate(offering.flatRate);
  }
  if (offering.hourlyRate != null) {
    return formatHourlyRate(offering.hourlyRate);
  }
  return "Rate on request";
}

export function offeringDisplayPrice(offering: KrafterBookableOffering): number {
  if (offering.pricingType === "FLAT" && offering.flatRate != null) {
    return offering.flatRate;
  }
  return offering.hourlyRate ?? 0;
}

/** Merge public-profile / home API payload into modal detail shape. */
export function mergeArtisanResponseIntoKrafterDetail(
  base: KrafterDetail,
  raw: unknown,
): KrafterDetail {
  const item = unwrapArtisanApiPayload(raw);
  if (!item && !asRecord(raw)) return base;

  const offerings = extractKrafterOfferings(raw);
  const portfolioImages = extractPortfolioImages(raw);
  const rootRecord = asRecord(raw);
  const apiSkillTags = rootRecord ? readSkillTagsFromHomeRaw(rootRecord) : [];
  const skillTags =
    apiSkillTags.length > 0
      ? apiSkillTags
      : offerings.length > 0
        ? skillTagsFromOfferings(offerings)
        : base.skillTags ?? [];

  const languagesRaw = item?.languagesSpoken ?? item?.languages;
  const languagesSpoken = Array.isArray(languagesRaw)
    ? languagesRaw
        .map((l) => {
          if (typeof l === "string") return l;
          const lang = asRecord(l);
          return lang ? pickStr(lang, "name", "code") : undefined;
        })
        .filter((l): l is string => Boolean(l))
    : base.languagesSpoken;

  const primaryRate =
    offerings.find((o) => o.pricingType === "HOURLY" && o.hourlyRate != null)?.hourlyRate ??
    offerings[0]?.hourlyRate ??
    offerings[0]?.flatRate ??
    base.pricePerHour;

  const profileSource = item ?? asRecord(raw)!;

  return {
    ...base,
    profileImage:
      pickStr(profileSource, "profilePhotoUrl", "profile_photo_url", "avatar") ??
      base.profileImage,
    bio: pickStr(profileSource, "bio", "description") ?? base.bio,
    description: pickStr(profileSource, "bio", "description") ?? base.description,
    uniqueSellingPoint:
      pickStr(profileSource, "uniqueSellingPoint", "unique_selling_point") ??
      base.uniqueSellingPoint,
    occupationDescription:
      pickStr(profileSource, "occupationDescription", "occupation_description", "primaryTrade") ??
      base.occupationDescription,
    languagesSpoken,
    skillTags: skillTags.length > 0 ? skillTags : base.skillTags,
    portfolioImages:
      portfolioImages.length > 0 ? portfolioImages : base.portfolioImages,
    responseRate:
      pickNum(profileSource, "responseRate", "response_rate") ?? base.responseRate,
    averageResponseHours:
      pickNum(profileSource, "averageResponseHours", "average_response_hours") ??
      base.averageResponseHours,
    yearsWithUs:
      pickNum(profileSource, "yearsWithUs", "years_with_us") ?? base.yearsWithUs,
    location:
      pickStr(profileSource, "address", "baseCity", "city", "location") ?? base.location,
    address: pickStr(profileSource, "address", "baseCity", "city") ?? base.address,
    distance:
      pickNum(profileSource, "distanceKm", "distance_km") ?? base.distance,
    distanceLabel:
      pickStr(profileSource, "distanceLabel", "distance_label") ?? base.distanceLabel,
    reviewCount:
      pickNum(profileSource, "reviewCount", "reviewsCount", "reviews_count") ??
      base.reviewCount,
    rating: pickNum(profileSource, "rating", "reviewsRating") ?? base.rating,
    taskCount:
      pickNum(profileSource, "completedKrafts", "completedJobs", "taskCount", "tasks_count") ??
      base.taskCount,
    pricePerHour: primaryRate,
    serviceOfferings: offerings.length > 0 ? offerings : base.serviceOfferings,
  };
}

export async function enrichKrafterDetailFromApi(
  base: KrafterDetail,
  krafterId: string,
  ctx?: KrafterProfileFetchContext,
): Promise<KrafterDetail> {
  if (!krafterId.trim()) return base;

  const groups = await ensureSkillGroupsLoaded(ctx?.skillGroups ?? []);
  const categoryFallback = ctx?.serviceCategories ?? [];
  const skillTags = base.skillTags?.length ? base.skillTags : [];

  let offerings = base.serviceOfferings ?? [];

  if (offerings.length === 0 && skillTags.length > 0) {
    offerings = buildOfferingsFromSkillTagNames(
      skillTags,
      groups,
      base.pricePerHour,
      categoryFallback,
    );
  }

  let detail: KrafterDetail = {
    ...base,
    serviceOfferings: offerings.length > 0 ? offerings : base.serviceOfferings,
    skillTags:
      skillTags.length > 0
        ? skillTags
        : offerings.length > 0
          ? skillTagsFromOfferings(offerings)
          : base.skillTags,
  };

  if (detailHasBookableOfferings(detail)) {
    return detail;
  }

  const profile = await loadKrafterPublicProfile(
    krafterId,
    ctx?.latitude,
    ctx?.longitude,
  );
  if (profile) {
    return mergeArtisanResponseIntoKrafterDetail(detail, profile);
  }

  return detail;
}

/** Build modal detail from a home / pros-of-week API row (already includes skillTags). */
export function buildKrafterDetailFromHomeRow(
  pro: {
    name: string;
    image: string;
    badge?: string;
    rating: number;
    reviews: number;
    tasks: number;
    description: string;
    distance?: string;
  },
  raw: Record<string, unknown>,
  skillGroups: ServiceSkillGroup[] = [],
  categoryFallback: CategoryLike[] = [],
): KrafterDetail {
  const skillTags = readSkillTagsFromHomeRaw(raw);
  const hourlyRate =
    pickNum(raw, "hourlyRate", "hourly_rate", "pricePerHour") ?? 0;

  let serviceOfferings = extractKrafterOfferings(raw);
  if (serviceOfferings.length === 0 && skillTags.length > 0) {
    serviceOfferings = buildOfferingsFromSkillTagNames(
      skillTags,
      skillGroups,
      hourlyRate,
      categoryFallback,
    );
  }

  const displaySkillTags =
    skillTags.length > 0
      ? skillTags
      : serviceOfferings.length > 0
        ? skillTagsFromOfferings(serviceOfferings)
        : [];

  const krafterId = extractKrafterIdFromRow(raw) ?? String(raw.krafterId ?? pro.name);

  return {
    id: krafterId,
    name: pro.name,
    profileImage: pro.image,
    badge: pro.badge,
    rating: pro.rating,
    reviewCount: pro.reviews,
    taskCount: pro.tasks,
    description: String(raw.description ?? raw.bio ?? pro.description ?? ""),
    location: String(raw.address ?? raw.baseCity ?? pro.distance ?? "Germany"),
    distance: typeof raw.distanceKm === "number" ? raw.distanceKm : undefined,
    distanceLabel: typeof raw.distanceLabel === "string" ? raw.distanceLabel : undefined,
    pricePerHour: hourlyRate,
    isAvailable: raw.isAvailable !== false,
    bio: String(raw.bio ?? raw.description ?? pro.description ?? ""),
    uniqueSellingPoint:
      typeof raw.uniqueSellingPoint === "string" ? raw.uniqueSellingPoint : undefined,
    occupationDescription:
      typeof raw.occupationDescription === "string" ? raw.occupationDescription : undefined,
    languagesSpoken: Array.isArray(raw.languagesSpoken)
      ? raw.languagesSpoken.filter((l): l is string => typeof l === "string")
      : [],
    skillTags: displaySkillTags,
    portfolioImages: Array.isArray(raw.portfolioImages)
      ? raw.portfolioImages.filter((u): u is string => typeof u === "string" && Boolean(u))
      : Array.isArray(raw.portfolioPhotoUrls)
        ? raw.portfolioPhotoUrls.filter((u): u is string => typeof u === "string" && Boolean(u))
        : [],
    serviceOfferings,
    responseRate: typeof raw.responseRate === "number" ? raw.responseRate : null,
    averageResponseHours:
      typeof raw.averageResponseHours === "number" ? raw.averageResponseHours : null,
    yearsWithUs: Number(raw.yearsWithUs ?? 0),
    address: typeof raw.address === "string" ? raw.address : undefined,
  };
}

export type ResolveHomeKrafterDetailOptions = {
  /** From `GET /api/services/categories` — not home carousel categories. */
  serviceCategories?: CategoryLike[];
  latitude?: number;
  longitude?: number;
};

/**
 * Home flow: prefer enriched card payload from GET /api/home; fall back to
 * GET /api/krafters/:id/public-profile for deep links / stale cards.
 */
export async function resolveHomeKrafterDetail(
  pro: Parameters<typeof buildKrafterDetailFromHomeRow>[0],
  raw: Record<string, unknown>,
  existingGroups: ServiceSkillGroup[] = [],
  options: ResolveHomeKrafterDetailOptions = {},
): Promise<KrafterDetail> {
  const groups = await ensureSkillGroupsLoaded(existingGroups);
  const categoryFallback = [
    ...(options.serviceCategories ?? []),
    ...categoryOptionsFromGroups(groups),
  ];
  let detail = buildKrafterDetailFromHomeRow(pro, raw, groups, categoryFallback);

  if (!detailHasBookableOfferings(detail) && (detail.skillTags?.length ?? 0) > 0) {
    const offerings = buildOfferingsFromSkillTagNames(
      detail.skillTags ?? [],
      groups,
      detail.pricePerHour,
      categoryFallback,
    );
    if (offerings.length > 0) {
      detail = { ...detail, serviceOfferings: offerings };
    }
  }

  if (detailHasBookableOfferings(detail)) {
    return detail;
  }

  const profile = await loadKrafterPublicProfile(
    detail.id,
    options.latitude,
    options.longitude,
  );
  if (profile) {
    return mergeArtisanResponseIntoKrafterDetail(detail, profile);
  }

  return detail;
}

export type DirectKrafterBookDisplay = {
  name?: string;
  profileImage?: string;
  badge?: string | null;
  distance?: number | null;
  distanceLabel?: string | null;
  taskCount?: number;
};

export function buildDirectKrafterBookServiceUrl(
  krafterId: string,
  offering: KrafterBookableOffering,
  display?: DirectKrafterBookDisplay,
): string {
  const extraParams: Record<string, string> = {
    artisanId: krafterId,
  };
  const rate = offeringDisplayPrice(offering);
  if (rate > 0) {
    extraParams.pricePerHour = String(rate);
  }
  if (display?.name) extraParams.artisanName = display.name;
  if (display?.profileImage) extraParams.artisanImage = display.profileImage;
  if (display?.badge) extraParams.artisanBadge = display.badge;
  if (display?.distanceLabel) extraParams.distanceLabel = display.distanceLabel;
  if (display?.distance != null && Number.isFinite(display.distance)) {
    extraParams.distanceKm = String(display.distance);
  }
  if (display?.taskCount != null) {
    extraParams.artisanKrafts = String(display.taskCount);
  }
  return buildCategoryBookingUrl(
    offering.serviceCategoryId,
    offering.serviceCategoryName,
    extraParams,
  );
}
