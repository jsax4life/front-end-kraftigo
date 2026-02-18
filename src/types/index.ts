// ─── Auth ────────────────────────────────────────────────────────────────────
export type user = {
  id?: string;
  fullName?: string;
  email: string;
  phone?: string;
  password?: string;
  roles?: string[];
  status?: "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED";
  hasAcceptedTerms?: boolean;
};

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
  counter_price?: number;
  created_at: string;
  updated_at: string;
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
export type JobStatus = "open" | "assigned" | "in_progress" | "completed" | "cancelled";

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

