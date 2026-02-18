export type user = {
    id?: string;
    fullName?: string;
    email: string;
    phone?: string;
    password?: string;
    roles?: string[]; 
    status?: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
    hasAcceptedTerms?: boolean;
}

export type JobStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Job {
    id: string;
    created_by: string; // user_id
    assigned_to?: string; // artisan_id
    category: string;
    job_title: string;
    description: string;
    location: string;
    preferred_date: string;
    budget_optional?: number;
    status: JobStatus;
    applications: string[]; // application_id list
    created_at?: string;
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Application {
    id: string;
    job_id: string;
    artisan_id: string;
    artisan_name: string;
    proposal_message: string;
    proposed_price_optional?: number;
    price: string; // Formatting string like "$41.29/hr"
    status: ApplicationStatus;
    rating: number;
    reviews_count: number;
    tasks_count: number;
    image: string;
    description: string;
    is_top_pro?: boolean;
    created_at?: string;
}
