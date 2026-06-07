import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query key factory
export const queryKeys = {
  customers: {
    all: ['customers'] as const,
    detail: (id: string) => ['customers', id] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    filtered: (params: object) => ['appointments', params] as const,
    detail: (id: string) => ['appointments', id] as const,
    types: ['appointments', 'types'] as const,
    locations: ['appointments', 'locations'] as const,
  },
  waitlist: {
    all: ['waitlist'] as const,
    filtered: (params: object) => ['waitlist', params] as const,
    detail: (id: string) => ['waitlist', id] as const,
  },
  recoveryJobs: {
    all: ['recovery-jobs'] as const,
    active: ['recovery-jobs', 'active'] as const,
    filtered: (params: object) => ['recovery-jobs', params] as const,
    detail: (id: string) => ['recovery-jobs', id] as const,
  },
  analytics: {
    overview: ['analytics', 'overview'] as const,
    trends: (days: number) => ['analytics', 'trends', days] as const,
    outcomes: ['analytics', 'outcomes'] as const,
  },
  settings: ['settings'] as const,
  personas: {
    all: ['personas'] as const,
    detail: (id: string) => ['personas', id] as const,
  },
};
