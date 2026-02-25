export interface Request {
  id: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  reviewsCount: number;
  offerAmount: number;
  description: string;
  showRenegotiate?: boolean;
  jobId: string;
  createdAt: string;
}

export const dummyRequests: Request[] = [
  {
    id: "req-1",
    customerName: "Edith R.",
    customerAvatar: "/images/pro.jpg",
    rating: 4,
    reviewsCount: 23,
    offerAmount: 85,
    description: "I need someone with six years of experience cleaning houses, whose priority is to bring a good service and is...",
    showRenegotiate: false,
    jobId: "job-1",
    createdAt: "2026-02-24T10:00:00Z",
  },
  {
    id: "req-2",
    customerName: "Edith R.",
    customerAvatar: "/images/pro.jpg",
    rating: 4,
    reviewsCount: 23,
    offerAmount: 85,
    description: "I need someone with six years of experience cleaning houses, whose priority is to bring a good service and is...",
    showRenegotiate: true,
    jobId: "job-2",
    createdAt: "2026-02-24T11:00:00Z",
  },
  {
    id: "req-3",
    customerName: "John D.",
    customerAvatar: "/images/pro.jpg",
    rating: 5,
    reviewsCount: 45,
    offerAmount: 120,
    description: "Looking for a professional plumber to fix kitchen pipes. Need someone reliable and experienced with modern plumbing systems.",
    showRenegotiate: false,
    jobId: "job-3",
    createdAt: "2026-02-24T12:00:00Z",
  },
  {
    id: "req-4",
    customerName: "Sarah M.",
    customerAvatar: "/images/pro.jpg",
    rating: 4,
    reviewsCount: 18,
    offerAmount: 95,
    description: "Need electrical work done in my apartment. Must be certified and have experience with residential electrical systems.",
    showRenegotiate: true,
    jobId: "job-4",
    createdAt: "2026-02-24T13:00:00Z",
  },
];
