import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Job, Application, JobStatus, ApplicationStatus } from '../types'

interface JobState {
  jobs: Job[];
  applications: Application[];
  
  // Job Actions
  addJob: (job: Job) => void;
  updateJobStatus: (jobId: string, status: JobStatus) => void;
  assignArtisanToJob: (jobId: string, artisanId: string) => void;
  
  // Application Actions
  addApplication: (application: Application) => void;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;
  
  // Getters
  getJobById: (id: string) => Job | undefined;
  getApplicationsByJobId: (jobId: string) => Application[];
  getJobsByUser: (userId: string) => Job[];
  getAssignedJobsByArtisan: (artisanId: string) => Job[];
}

export const useJobStore = create<JobState>()(
  persist(
    (set, get) => ({
      jobs: [],
      applications: [],

      addJob: (job) => set((state) => ({
        jobs: [...state.jobs, { ...job, created_at: job.created_at || new Date().toISOString() }]
      })),

      addApplication: (application) => set((state) => ({
        applications: [...state.applications, { ...application, created_at: application.created_at || new Date().toISOString() }],
        // Also update the job's application list
        jobs: state.jobs.map(job => 
          job.id === application.job_id 
            ? { ...job, applications: [...job.applications, application.id] } 
            : job
        )
      })),

      updateJobStatus: (jobId, status) => set((state) => ({
        jobs: state.jobs.map(job => job.id === jobId ? { ...job, status } : job)
      })),

      assignArtisanToJob: (jobId, artisanId) => set((state) => ({
        jobs: state.jobs.map(job => 
          job.id === jobId 
            ? { ...job, assigned_to: artisanId, status: 'assigned' } 
            : job
        )
      })),

      updateApplicationStatus: (applicationId, status) => set((state) => ({
        applications: state.applications.map(app => app.id === applicationId ? { ...app, status } : app)
      })),

      getJobById: (id) => get().jobs.find(job => job.id === id),
      
      getApplicationsByJobId: (jobId) => get().applications.filter(app => app.job_id === jobId),
      
      getJobsByUser: (userId) => get().jobs.filter(job => job.created_by === userId),
      
      getAssignedJobsByArtisan: (artisanId) => get().jobs.filter(job => job.assigned_to === artisanId),
    }),
    {
      name: 'job-storage',
    }
  )
)
