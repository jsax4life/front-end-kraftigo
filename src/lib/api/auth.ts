import api from "@/lib/axios";
import type { User } from "@/types";

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string;
  password: string;
}

export type SignupIntent = "krafter";

export interface RegisterPayload {
  email: string;
  password: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  hasAcceptedTerms?: boolean;
  signupIntent?: SignupIntent;
  role: "CUSTOMER" | "ARTISAN" | "TASKER";
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface GoogleAuthPayload {
  idToken: string;
  hasAcceptedTerms: boolean;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountPayload {
  password?: string;
  confirmation?: "DELETE_MY_KRAFTIGO_ACCOUNT";
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: User;
  verificationRequired: boolean;
  message: string;
}

export interface VerifyEmailResponse {
  user: User;
  message: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface HomeProOfWeek {
  krafterId: string;
  displayName: string;
  profilePhotoUrl: string;
  rating: number;
  reviewCount: number;
  completedKrafts: number;
  hourlyRate: number;
  badges: string[];
  distanceKm: number;
  distanceLabel?: string | null;
  description: string | null;
  isAvailable?: boolean;
  skillTags?: string[];
  serviceCategoryOfferings?: Array<Record<string, unknown>>;
  portfolioImages?: string[];
  portfolioPhotoUrls?: string[];
  occupationDescription?: string | null;
  address?: string | null;
  uniqueSellingPoint?: string | null;
  languagesSpoken?: string[];
  bio?: string | null;
  yearsWithUs?: number;
  responseRate?: number | null;
  averageResponseHours?: number | null;
}

export interface HomeUpcomingKrafter {
  id: string;
  displayName: string;
  profilePhotoUrl: string;
  distanceKm?: number | null;
  distanceLabel?: string | null;
}

export interface HomeUpcomingBooking {
  bookingId: string;
  jobTitle: string;
  status: string;
  scheduledAt: string;
  addressSummary: string;
  /** Absent for listings without an assigned Krafter yet (e.g. open marketplace). */
  krafter: HomeUpcomingKrafter | null;
}

export interface HomePageResponse {
  categories: HomeCategory[];
  prosOfWeek: HomeProOfWeek[];
  kraftersNearYou?: HomeProOfWeek[];
  upcoming: HomeUpcomingBooking[];
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export interface HomeCategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  activeListingsCount: number;
}



// ─── Customer Auth ────────────────────────────────────────────────────────────

/** POST /api/auth/login — log in as a customer */
export const loginUser = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  const response = await api.post("/api/auth/login", payload);
  return response.data;
};

/** POST /api/auth/register — register a new customer or artisan account */
export const registerUser = async (
  payload: Omit<RegisterPayload, "role"> & { role?: "CUSTOMER" | "ARTISAN" },
): Promise<RegisterResponse> => {
  const response = await api.post("/api/auth/register", {
    ...payload,
    role: payload.role || "CUSTOMER",
  });
  return response.data;
};

/** POST /api/auth/verify-email — verify email with OTP code */
export const verifyEmail = async (
  payload: VerifyEmailPayload,
): Promise<VerifyEmailResponse> => {
  const response = await api.post("/api/auth/verify-email", payload);
  return response.data;
};

/** POST /api/auth/resend-verification — resend OTP to email */
export const resendVerificationCode = async (
  email: string,
): Promise<{ message: string }> => {
  const response = await api.post("/api/auth/resend-verification", { email });
  return response.data;
};

/** POST /api/auth/forgot-password — Request password reset email */
export const forgotPassword = async (
  email: string,
): Promise<{ message: string }> => {
  const response = await api.post("/api/auth/forgot-password", { email });
  return response.data;
};

/** POST /api/auth/reset-password — Complete password reset */
export const resetPassword = async (
  payload: ResetPasswordPayload,
): Promise<{ message: string }> => {
  const response = await api.post("/api/auth/reset-password", payload);
  return response.data;
};

/** POST /api/auth/change-password — Authenticated password change (JWT required) */
export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<{ message: string }> => {
  const response = await api.post("/api/auth/change-password", payload);
  return response.data;
};

/** POST /api/auth/google — sign in / sign up via Google OAuth */
export const loginWithGoogle = async (
  payload: GoogleAuthPayload,
): Promise<AuthResponse> => {
  const response = await api.post("/api/auth/google", payload);
  return response.data;
};

/** POST /api/auth/logout — revoke current refresh token */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await api.post("/api/auth/logout", { refreshToken });
};

/** DELETE /api/auth/logout-all — revoke all refresh tokens (all devices) */
export const logoutAllDevices = async (): Promise<void> => {
  await api.delete("/api/auth/logout-all");
};

/** POST /api/auth/account/delete — close currently authenticated account */
export const deleteAccount = async (
  payload: DeleteAccountPayload,
): Promise<{ message?: string }> => {
  const response = await api.post("/api/auth/account/delete", payload);
  return response.data;
};

function readHomeSkillTags(row: Record<string, unknown>): string[] | undefined {
  const sources = [row];
  for (const key of ["krafter", "profile", "artisan", "data"]) {
    const nested = row[key];
    if (nested && typeof nested === "object") {
      sources.push(nested as Record<string, unknown>);
    }
  }

  for (const src of sources) {
    for (const key of ["skillTags", "skill_tags", "skills"]) {
      const value = src[key];
      if (!Array.isArray(value)) continue;
      const tags: string[] = [];
      for (const entry of value) {
        if (typeof entry === "string" && entry.trim()) {
          tags.push(entry.trim());
          continue;
        }
        if (!entry || typeof entry !== "object") continue;
        const obj = entry as Record<string, unknown>;
        const name =
          (typeof obj.name === "string" && obj.name.trim()) ||
          (typeof obj.serviceCategoryName === "string" && obj.serviceCategoryName.trim()) ||
          (typeof obj.service_category_name === "string" && obj.service_category_name.trim()) ||
          (typeof obj.label === "string" && obj.label.trim()) ||
          "";
        if (name) tags.push(name);
      }
      if (tags.length > 0) return tags;
    }
  }
  return undefined;
}

/** Normalize snake_case / partial home Krafter rows from GET /api/home. */
function normalizeHomeProRow(raw: unknown): HomeProOfWeek | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const krafterId = row.krafterId ?? row.krafter_id ?? row.id;
  const displayName = row.displayName ?? row.display_name;
  if (typeof krafterId !== "string" || !krafterId.trim()) return null;
  if (typeof displayName !== "string" || !displayName.trim()) return null;

  const badgesRaw = row.badges;
  const badges = Array.isArray(badgesRaw)
    ? badgesRaw.filter((b): b is string => typeof b === "string")
    : [];

  const portfolioImagesRaw = row.portfolioImages ?? row.portfolio_images;
  const portfolioPhotoUrlsRaw = row.portfolioPhotoUrls ?? row.portfolio_photo_urls;
  const offeringsRaw = row.serviceCategoryOfferings ?? row.service_category_offerings;

  return {
    krafterId: krafterId.trim(),
    displayName: displayName.trim(),
    profilePhotoUrl: String(row.profilePhotoUrl ?? row.profile_photo_url ?? ""),
    rating: Number(row.rating ?? 0) || 0,
    reviewCount: Number(row.reviewCount ?? row.review_count ?? 0) || 0,
    completedKrafts:
      Number(row.completedKrafts ?? row.completed_krafts ?? row.completedJobs ?? 0) || 0,
    hourlyRate: Number(row.hourlyRate ?? row.hourly_rate ?? row.pricePerHour ?? 0) || 0,
    badges,
    distanceKm: Number(row.distanceKm ?? row.distance_km ?? 0) || 0,
    distanceLabel:
      typeof row.distanceLabel === "string"
        ? row.distanceLabel
        : typeof row.distance_label === "string"
          ? row.distance_label
          : null,
    description:
      typeof row.description === "string"
        ? row.description
        : typeof row.bio === "string"
          ? row.bio
          : null,
    isAvailable: row.isAvailable !== false && row.is_available !== false,
    skillTags: readHomeSkillTags(row),
    serviceCategoryOfferings: Array.isArray(offeringsRaw)
      ? (offeringsRaw as Array<Record<string, unknown>>)
      : undefined,
    portfolioImages: Array.isArray(portfolioImagesRaw)
      ? portfolioImagesRaw.filter((u): u is string => typeof u === "string")
      : undefined,
    portfolioPhotoUrls: Array.isArray(portfolioPhotoUrlsRaw)
      ? portfolioPhotoUrlsRaw.filter((u): u is string => typeof u === "string")
      : undefined,
    occupationDescription:
      typeof row.occupationDescription === "string"
        ? row.occupationDescription
        : typeof row.occupation_description === "string"
          ? row.occupation_description
          : null,
    address:
      typeof row.address === "string"
        ? row.address
        : typeof row.baseCity === "string"
          ? row.baseCity
          : null,
    uniqueSellingPoint:
      typeof row.uniqueSellingPoint === "string"
        ? row.uniqueSellingPoint
        : typeof row.unique_selling_point === "string"
          ? row.unique_selling_point
          : null,
    languagesSpoken: Array.isArray(row.languagesSpoken)
      ? row.languagesSpoken.filter((l): l is string => typeof l === "string")
      : Array.isArray(row.languages_spoken)
        ? row.languages_spoken.filter((l): l is string => typeof l === "string")
        : undefined,
    bio: typeof row.bio === "string" ? row.bio : null,
    yearsWithUs: Number(row.yearsWithUs ?? row.years_with_us ?? 0) || 0,
    responseRate:
      typeof row.responseRate === "number"
        ? row.responseRate
        : typeof row.response_rate === "number"
          ? row.response_rate
          : null,
    averageResponseHours:
      typeof row.averageResponseHours === "number"
        ? row.averageResponseHours
        : typeof row.average_response_hours === "number"
          ? row.average_response_hours
          : null,
  };
}

function normalizeHomeProList(raw: unknown): HomeProOfWeek[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeHomeProRow)
    .filter((row): row is HomeProOfWeek => row !== null);
}

/** GET /api/home — dynamic customer home page data */
export const getHomeData = async (): Promise<HomePageResponse> => {
  const response = await api.get("/api/home");
  const body = response.data as Record<string, unknown>;
  const root = (body.data as Record<string, unknown> | undefined) ?? body;

  const prosOfWeekRaw = root.prosOfWeek ?? root.pros_of_week;
  const kraftersNearYouRaw = root.kraftersNearYou ?? root.krafters_near_you;
  const categoriesRaw = root.categories;
  const upcomingRaw = root.upcoming;

  return {
    categories: Array.isArray(categoriesRaw) ? (categoriesRaw as HomeCategory[]) : [],
    prosOfWeek: normalizeHomeProList(prosOfWeekRaw),
    kraftersNearYou: normalizeHomeProList(kraftersNearYouRaw),
    upcoming: Array.isArray(upcomingRaw) ? (upcomingRaw as HomeUpcomingBooking[]) : [],
  };
};

// ─── Tasker Auth ──────────────────────────────────────────────────────────────

/** POST /api/auth/login — log in as a tasker */
export const loginTasker = async (
  payload: LoginPayload,
): Promise<AuthResponse> => {
  const response = await api.post("/api/auth/login", payload);
  return response.data;
};

/** POST /api/auth/register — register a new artisan account */
export const registerTasker = async (
  payload: Omit<RegisterPayload, "role">,
): Promise<RegisterResponse> => {
  const response = await api.post("/api/auth/register", {
    ...payload,
    role: "ARTISAN",
  });
  return response.data;
};
