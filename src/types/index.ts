// ─── Auth ────────────────────────────────────────────────────────────────────
export type User = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  roles?: string[];
  status?: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED";
  avatar?: string;
  hasAcceptedTerms?: boolean;
  authProvider?: string;
  hasStartedArtisanOnboarding?: boolean;
};

/** @deprecated Use User instead */
export type user = User;

// ─── Address ─────────────────────────────────────────────────────────────────
export interface Address {
  id: string;
  label: string;
  address: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  postalCode?: string;
  country?: string;
  externalPlaceId?: string;
  /** Backend persisted pin — current row is also returned first from GET /api/addresses. */
  isCurrent?: boolean;
}

// ─── Services ─────────────────────────────────────────────────────────────────
export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  /** Present on `GET /api/services/categories` responses. */
  imageUrl?: string | null;
  description?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price_per_hour: number;
  category: ServiceCategory;
  artisan: {
    id: string;
    fullName: string;
    avatar?: string;
    rating?: number;
    reviews_count?: number;
    completed_jobs?: number;
    bio?: string;
    skills?: string[];
    location?: string;
  };
  rating?: number;
  reviews_count?: number;
  images?: string[];
  is_active: boolean;
  created_at: string;
}

// ─── Bookings ─────────────────────────────────────────────────────────────────
export type BookingStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "COUNTERED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED"
  | "CANCELLED"
  | "DISPUTED"
  | "OPEN_FOR_APPLICATIONS"
  | "RECOMMENDATION_PENDING"
  | "KRAFTER_SELECTED"
  | "DECLINED"
  /** Krafter accepted direct request; customer must authorize payment in Stripe before CONFIRMED */
  | "PAYMENT_PENDING";

export interface Booking {
  id: string;
  service_id: string;
  service?: Service;
  customer_id: string;
  artisan_id?: string;
  status: BookingStatus;
  scheduled_date: string;
  scheduled_time?: string;
  location: string;
  notes?: string;
  price?: number;
  counterPrice?: number;
  created_at: string;
  updated_at: string;
  /** Canonical lifecycle timestamps from backend. */
  startedAt?: string | null;
  started_at?: string | null;
  completedAt?: string | null;
  completed_at?: string | null;
  /** Backend-computed elapsed work duration in seconds (preferred for completed jobs). */
  workDurationSeconds?: number | null;
  work_duration_seconds?: number | null;
  // Optional enriched fields returned by the backend in some responses
  title?: string;
  image?: string;
  customerName?: string;
  /** Populated on some booking detail responses (e.g. GET `/api/bookings/:id`). */
  customer?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    profilePhotoUrl?: string | null;
    avatar?: string | null;
  } | null;
  artisanName?: string;
  /** Artisan marketplace browse: customer already applied to this open job */
  hasApplied?: boolean;
  /** Krafter `GET .../marketplace-applications` — application row id (not the booking id). */
  marketplaceApplicationId?: string;
  /** Application lifecycle, e.g. `PENDING`. */
  marketplaceApplicationStatus?: string;
  /** Message sent with the application offer. */
  marketplaceApplicationMessage?: string;
  /** When the Krafter submitted the application. */
  marketplaceApplicationSubmittedAt?: string;
  /** Listing’s advertised price on the open job (distinct from the Krafter’s offered `price`). */
  listingProposedPrice?: number | string | null;
  /** Customer `/api/bookings/my` and similar responses (camelCase) */
  jobTitle?: string;
  jobDescription?: string;
  /** When returned separately from `jobDescription` (e.g. marketplace / detail). */
  specialInstructions?: string | null;
  openForNegotiation?: boolean | null;
  krafterRatingRequirement?: string | null;
  address?: string;
  preferredDate?: string;
  preferredTime?: string;
  /** Inclusive range end when customer offered a date range (≥ preferredDate). */
  preferredDateEnd?: string;
  /** Extra non-contiguous preferred days (max 14, each ≥ preferredDate). */
  additionalPreferredDates?: string[];
  mediaUrls?: string[];
  artisan?: {
    avatar?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    profilePhotoUrl?: string;
  } | null;
  /** API detail/list (camelCase) */
  artisanId?: string | null;
  serviceCategoryId?: string | null;
  serviceCategory?: { id: string; name: string; description?: string; imageUrl?: string };
  createdAt?: string;
  latitude?: string | number | null;
  longitude?: string | number | null;
  proposedPrice?: number | string | null;
  /** Marketplace listing/customer offer basis. */
  offerPricingType?: "FLAT" | "HOURLY" | string | null;
  /** Marketplace listing duration when offer is HOURLY. */
  offerDurationHours?: number | string | null;
  offer_duration_hours?: number | string | null;
  /** Krafter application pricing basis. */
  proposedPricingType?: "FLAT" | "HOURLY" | string | null;
  proposedDurationHours?: number | string | null;
  proposed_duration_hours?: number | string | null;
  finalAgreedPrice?: number | string | null;
  /** Customer-visible platform fee (camelCase or snake_case from API). */
  platformFee?: number | string | null;
  platform_fee?: number | string | null;
  /** Amount attributed to the service provider after fees (detail / list). */
  artisanEarning?: number | string | null;
  artisan_earning?: number | string | null;
  /** Pricing rule applied for this booking, when returned by the API. */
  pricingRuleId?: string | null;
  pricing_rule_id?: string | null;
  /** Job duration in hours (e.g. after select-krafter / verify flow). */
  durationHours?: number | string | null;
  duration_hours?: number | string | null;
  /** Platform / system fee from API */
  systemPrice?: number | string | null;
  system_price?: number | string | null;
  /** Latest checkout (e.g. after Krafter Accept); optional on list/detail responses */
  payment?: {
    clientSecret?: string;
    client_secret?: string;
    paymentIntentId?: string;
    payment_intent_id?: string;
  } | null;
  /** DM thread UUID from enriched booking APIs (`LISTED_KRAFT_ORDER` / booking id). */
  conversationId?: string | null;
  /** Automatic expiry metadata when a booking passes schedule grace period before start. */
  expiredAt?: string | null;
  expired_at?: string | null;
  expirationReason?: string | null;
  expiration_reason?: string | null;
  /** @deprecated Alias for legacy readers; prefer `conversationId`. */
  chatConversationId?: string | null;
  /** Great-circle distance to assigned Krafter / task (when API provides it). */
  distanceKm?: number | null;
  distanceLabel?: string | null;
  /** Backward-compatible aliases on booking detail. */
  krafterDistanceKm?: number | null;
  krafterDistanceLabel?: string | null;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  artisan_id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  tip_amount?: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export interface PaymentKrafterSummary {
  displayName?: string;
  profilePhotoUrl?: string;
  rating?: number;
  reviewCount?: number;
  completedKrafts?: number;
  badges?: string[];
}

export interface PaymentBreakdownLineItem {
  label: string;
  amount: number;
}

export interface PaymentReceiptBreakdown {
  lineItems?: PaymentBreakdownLineItem[];
  serviceFee?: number;
  discountLabel?: string | null;
  discountAmount?: number | null;
  totalPaid?: number;
}

export interface PaymentTimelineEvent {
  label?: string;
  status?: string;
  at?: string;
  timestamp?: string;
}

export interface Payment {
  id: string;
  booking_id?: string;
  contextType?: string;
  contextId?: string;
  context_type?: string;
  context_id?: string;
  amount: number;
  currency?: string;
  paymentIntentId?: string;
  payment_intent_id?: string;
  status: "PENDING" | "HELD" | "ESCROWED" | "RELEASED" | "REFUNDED" | string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
  updated_at?: string;
  /** Receipt summary (GET /api/payments/my) */
  transactionReference?: string;
  statusLabel?: string;
  transactionDate?: string;
  totalPaid?: number;
  jobTitle?: string;
  scheduledAt?: string;
  krafter?: PaymentKrafterSummary;
  /** Full receipt (GET /api/payments/:id) */
  breakdown?: PaymentReceiptBreakdown;
  timeline?: PaymentTimelineEvent[];
}

// ─── Disputes ─────────────────────────────────────────────────────────────────
export interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string;
  reason: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED";
  created_at: string;
}

// ─── Legacy (kept for compatibility) ─────────────────────────────────────────
export type JobStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface Job {
  id: string;
  created_by: string;
  assigned_to?: string;
  category: string;
  job_title: string;
  description: string;
  location: string;
  preferred_date: string;
  budget_optional?: number;
  status: JobStatus;
  applications: string[];
  created_at?: string;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface Application {
  id: string;
  job_id: string;
  artisan_id: string;
  artisan_name: string;
  proposal_message: string;
  proposed_price_optional?: number;
  price: string;
  status: ApplicationStatus;
  rating: number;
  reviews_count: number;
  tasks_count: number;
  image: string;
  description: string;
  is_top_pro?: boolean;
  created_at?: string;
  distance?: number | null;
  distanceLabel?: string | null;
}

/** JSON body for `POST /api/profile/artisan/url` (URL-based media, no multipart). */
export type ArtisanProfileUrlSubmitPayload = {
  rateCard?: { skillId: string; hourlyRate: number }[];
  legalFullName: string;
  displayName: string;
  profilePhotoUrl?: string;
  languages: { code: string; name: string; proficiency: string }[];
  baseCity: string;
  postalCode: string;
  travelRadiusKm: number;
  primarySkillCategoryId: string;
  secondarySkillIds: string[];
  yearsExperienceHomeCountry: number;
  yearsExperienceCurrentCountry: number;
  certifications: {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    documentUrl?: string;
  }[];
  portfolioPhotoUrls: string[];
  toolsOwned: boolean;
  transportType: "CAR" | "VAN" | "BIKE" | "NONE";
  taxOrVatId: string;
  bio: string;
  uniqueSellingPoint?: string;
  countryOfResidence: string;
  idCardUrl?: string;
  employmentStatus: "SELF_EMPLOYED" | "FREELANCING";
};

export interface ArtisanProfile {
  id?: string;
  userId?: string;
  legalFullName: string;
  displayName: string;
  displayFullName?: string;
  profilePhotoUrl?: string;
  /** Service category UUID from `GET /api/services/skills/groups` */
  primarySkillCategoryId?: string;
  languages: {
    code: string;
    name: string;
    proficiency: string;
  }[];
  baseCity: string;
  postalCode: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  travelRadiusKm: number;
  primaryTrade: string;
  occupationDescription?: string;
  secondarySkills: string[];
  /** Skill UUIDs from services catalog */
  secondarySkillIds?: string[];
  yearsExperienceHomeCountry: number;
  yearsExperienceCurrentCountry: number;
  certifications?: {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    documentUrl: string;
  }[];
  toolsOwned: boolean;
  transportType: 'CAR' | 'VAN' | 'BIKE' | 'NONE';
  taxOrVatId?: string;
  bio: string;
  uniqueSellingPoint?: string;
  countryOfResidence?: string;
  portfolioPhotoUrls?: string[];
  portfolioVideoUrl?: string | null;
  serviceCategoryOfferings?: Array<{
    serviceCategoryId: string;
    serviceCategoryName?: string;
    pricingType?: string;
    hourlyRate?: number;
    flatRate?: number;
    experienceYears?: number;
    photoUrl?: string | null;
  }>;
  rateCard?: Array<{
    serviceCategoryId?: string;
    skillId?: string;
    hourlyRate?: number;
    pricingType?: string;
  }>;
  payoutIban?: string;
  payoutBic?: string;
  stripeAccountId?: string;
  verificationStatus?: string;
  isProfileCompleted?: boolean;
  averageRating?: number | null;
  totalReviewsCount?: number;
  verification?: {
    status?: string;
    kycStatus?: string;
    governmentIdType?: string;
    submittedAt?: string;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
    kycVerifiedAt?: string;
    kycExtractedDetails?: Record<string, unknown>;
  };
  user?: {
    id?: string;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
    nationality?: string;
    status?: string;
    emailVerifiedAt?: string;
  };
}

export interface CustomerProfile {
  fullName?: string;
  user?: User;
  phone: string;
  serviceAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  profilePhotoUrl?: string;
  languagePreference: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    bookingUpdates: boolean;
    promotions: boolean;
  };
}

export interface Conversation {
  id?: string;
  conversationId?: string;
  otherParticipant?: {
    id: string;
    name: string;
    avatar?: string;
    /** When omitted or false, UI shows offline (grey). Only true when API explicitly reports online. */
    isOnline?: boolean;
  };
  participants?: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
  isLocked: boolean;
  contextType?: string;
  contextId?: string;
  /** Human-readable Kraft / booking label when API provides it. */
  jobTitle?: string;
  bookingTitle?: string;
  contextLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'image' | 'file';
  readBy: string[];
  createdAt: string;
}

// ─── Custom Krafts ───────────────────────────────────────────────────────────

export type CustomKraftFrequency = 'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'

export type CustomKraftExpiryOption = '24H' | '3DAYS' | '1WEEK' | 'CUSTOM'

export type CustomKraftStatus = 'DRAFT' | 'PUBLISHED' | 'MATCHED' | 'CANCELLED'

export interface CustomKraft {
  id: string
  description: string
  photos?: string[]
  roughCategoryId?: string
  scheduledDate?: string
  scheduledTime?: string
  addressId: string
  bookingHours: number
  frequency: CustomKraftFrequency
  offerAmount?: number
  openToNegotiation: boolean
  expiryOption: CustomKraftExpiryOption
  expiryDate?: string
  urgentBoost: boolean
  status: CustomKraftStatus
  userId: string
  createdAt: string
  updatedAt: string
}


