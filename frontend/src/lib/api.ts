import axios from 'axios';
import type {
  Appointment,
  WaitlistEntry,
  RecoveryJob,
  Customer,
  Settings,
  Persona,
  CreatePersonaPayload,
  AnalyticsOverview,
  AnalyticsTrend,
  OutcomeDistribution,
  Location,
  AppointmentType,
} from '../types';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? error.message ?? 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// ─── Customers ────────────────────────────────────────────────────────────────

export const customersApi = {
  list: () => apiClient.get<{ data: Customer[]; total: number }>('/customers').then((r) => r.data),
  get: (id: string) => apiClient.get<Customer>(`/customers/${id}`).then((r) => r.data),
  create: (data: {
    name: string; phone: string; email?: string; locationId: string;
    preferredTimeOfDay?: string; preferredAppointmentTypeIds?: string[];
  }) => apiClient.post<Customer>('/customers', data).then((r) => r.data),
  update: (id: string, data: Partial<Customer>) =>
    apiClient.patch<Customer>(`/customers/${id}`, data).then((r) => r.data),
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointmentsApi = {
  list: (params?: { status?: string; locationId?: string }) =>
    apiClient.get<{ data: Appointment[]; total: number }>('/appointments', { params }).then((r) => r.data),
  get: (id: string) => apiClient.get<Appointment>(`/appointments/${id}`).then((r) => r.data),
  create: (data: {
    customerId: string; appointmentTypeId: string; locationId: string;
    startTime: string; notes?: string; wantsEarlierSlot?: boolean;
  }) => apiClient.post<Appointment>('/appointments', data).then((r) => r.data),
  cancel: (id: string, cancelledBy: string) =>
    apiClient.patch<Appointment>(`/appointments/${id}/cancel`, { cancelledBy }).then((r) => r.data),
  listTypes: () =>
    apiClient.get<{ data: AppointmentType[] }>('/appointments/meta/types').then((r) => r.data),
  createType: (data: { name: string; duration: number; price: number; locationId: string }) =>
    apiClient.post<AppointmentType>('/appointments/meta/types', data).then((r) => r.data),
  listLocations: () =>
    apiClient.get<{ data: Location[] }>('/appointments/meta/locations').then((r) => r.data),
};

// ─── Waitlist ─────────────────────────────────────────────────────────────────

export const waitlistApi = {
  list: (params?: { locationId?: string; appointmentTypeId?: string }) =>
    apiClient.get<{ data: WaitlistEntry[]; total: number }>('/waitlist', { params }).then((r) => r.data),
};

// ─── Recovery Jobs ────────────────────────────────────────────────────────────

export const recoveryJobsApi = {
  list: (params?: { status?: string; locationId?: string }) =>
    apiClient.get<{ data: RecoveryJob[]; total: number }>('/recovery-jobs', { params }).then((r) => r.data),
  listActive: () =>
    apiClient.get<{ data: RecoveryJob[]; total: number }>('/recovery-jobs/active').then((r) => r.data),
  get: (id: string) => apiClient.get<RecoveryJob>(`/recovery-jobs/${id}`).then((r) => r.data),
  escalate: (id: string, reason?: string) =>
    apiClient.post<RecoveryJob>(`/recovery-jobs/${id}/escalate`, { reason }).then((r) => r.data),
};

// ─── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  overview: () => apiClient.get<AnalyticsOverview>('/analytics/overview').then((r) => r.data),
  trends: (days = 30) =>
    apiClient.get<{ data: AnalyticsTrend[] }>('/analytics/trends', { params: { days } }).then((r) => r.data),
  outcomes: () =>
    apiClient.get<{ data: OutcomeDistribution[] }>('/analytics/outcomes').then((r) => r.data),
};

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => apiClient.get<Settings>('/settings').then((r) => r.data),
  update: (data: Partial<Settings>) =>
    apiClient.put<Settings>('/settings', data).then((r) => r.data),
};

// ─── Personas ─────────────────────────────────────────────────────────────────

export const personasApi = {
  list: () => apiClient.get<{ data: Persona[] }>('/personas').then((r) => r.data),
  get: (id: string) => apiClient.get<Persona>(`/personas/${id}`).then((r) => r.data),
  create: (data: CreatePersonaPayload) =>
    apiClient.post<Persona>('/personas', data).then((r) => r.data),
  update: (id: string, data: Partial<CreatePersonaPayload>) =>
    apiClient.patch<Persona>(`/personas/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/personas/${id}`),
  activate: (id: string) =>
    apiClient.post<Persona>(`/personas/${id}/activate`).then((r) => r.data),
};
