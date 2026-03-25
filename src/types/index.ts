// ─── Auth ────────────────────────────────────────────────────────────────────
export type User = {
  id?: string;
  fullName?: string;
  email: string;
  phone?: string;
  password?: string;
  roles?: string[];
  status?: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED";
  avatar?: string;
  hasAcceptedTerms?: boolean;
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
}

// ─── Services ─────────────────────────────────────────────────────────────────
export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
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
  | "CANCELLED"
  | "DISPUTED";

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
  // Optional enriched fields returned by the backend in some responses
  title?: string;
  image?: string;
  customerName?: string;
  artisanName?: string;
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
export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: "PENDING" | "HELD" | "RELEASED" | "REFUNDED";
  created_at: string;
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
}

/** JSON body for `POST /api/profile/artisan/url` (URL-based media, no multipart). */
export type ArtisanProfileUrlSubmitPayload = {
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
  countryOfResidence: string;
  idCardUrl?: string;
  employmentStatus: "SELF_EMPLOYED" | "FREELANCING";
};

export interface ArtisanProfile {
  legalFullName: string;
  displayName: string;
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
  travelRadiusKm: number;
  primaryTrade: string;
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
}

export interface CustomerProfile {
  fullName: string;
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
  };
  participants?: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: number;
  isLocked: boolean;
  contextType?: string;
  contextId?: string;
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


