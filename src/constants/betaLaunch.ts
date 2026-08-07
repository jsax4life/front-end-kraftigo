/** Beta launch — only these service categories can be booked. */
export const BETA_BOOKABLE_CATEGORY_IDS = new Set([
  "d676ea81-a67e-4751-9cb7-db38ad57d1cd", // House Cleaning
  "316d1de2-9a72-4109-8d6e-ffae3cfe9ea7", // Moving Help
  "52a286af-c0b3-40d5-8d1f-c9e48f40b635", // Furniture Assembly
]);

export const BETA_HOUSE_CLEANING_CATEGORY_ID =
  "d676ea81-a67e-4751-9cb7-db38ad57d1cd";

const BETA_BOOKABLE_NAME_ALIASES = new Set([
  "house cleaning",
  "cleaning services",
  "cleaning",
  "moving help",
  "furniture assembly",
]);

export const BETA_UNAVAILABLE_ROUTE = "/user/book-service/unavailable";

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase();
}

export function isBetaBookableCategory(
  categoryId?: string | null,
  categoryName?: string | null,
): boolean {
  if (categoryId && BETA_BOOKABLE_CATEGORY_IDS.has(categoryId)) {
    return true;
  }
  if (!categoryName?.trim()) {
    return false;
  }
  const normalized = normalizeCategoryName(categoryName);
  if (BETA_BOOKABLE_NAME_ALIASES.has(normalized)) {
    return true;
  }
  if (normalized.includes("cleaning")) return true;
  if (normalized.includes("moving help") || normalized === "moving") return true;
  if (normalized.includes("furniture assembly")) return true;
  return false;
}

export function buildCategoryBookingUrl(
  categoryId: string | undefined,
  categoryName: string,
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams({
    category: categoryName,
    ...extraParams,
  });
  if (categoryId) {
    params.set("categoryId", categoryId);
  }

  if (isBetaBookableCategory(categoryId, categoryName)) {
    return `/user/book-service?${params.toString()}`;
  }
  return `${BETA_UNAVAILABLE_ROUTE}?${params.toString()}`;
}
