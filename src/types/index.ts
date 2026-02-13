export type user = {
    id?: string;
    fullName?: string;
    email: string;
    phone?: string;
    password?: string;
    roles?: string[]; 
    status?: 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED';
}
