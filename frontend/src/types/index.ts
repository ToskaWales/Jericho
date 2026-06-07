export type AppointmentStatus = 'BOOKED' | 'CANCELLED' | 'RECOVERED' | 'COMPLETED';
export type RecoveryJobStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'ESCALATED';
export type CandidateStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'NO_ANSWER'
  | 'VOICEMAIL'
  | 'CALLBACK_REQUESTED'
  | 'EXHAUSTED';
export type CallOutcome =
  | 'ACCEPTED'
  | 'DECLINED'
  | 'NO_ANSWER'
  | 'VOICEMAIL'
  | 'CALLBACK_REQUESTED'
  | 'FAILED';
export type CallAttemptStatus = 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
export type TimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'ANY';
export type WaitlistStatus = 'ACTIVE' | 'INACTIVE' | 'REMOVED';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  locationId: string;
  locationName: string;
  preferredTimeOfDay: TimeOfDay;
  preferredAppointmentTypeIds: string[];
  isActive: boolean;
  appointmentCount: number;
  lastVisitDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  timezone: string;
}

export interface AppointmentType {
  id: string;
  name: string;
  duration: number;
  price: number;
  locationId: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  appointmentTypeId: string;
  appointmentTypeName: string;
  locationId: string;
  locationName: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  cancelledAt?: string;
  cancelledBy?: string;
  recoveredAt?: string;
  recoveryJobId?: string;
  notes?: string;
  price: number;
  wantsEarlierSlot?: boolean;
  calcomBookingUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistEntry {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  appointmentTypeId: string;
  appointmentTypeName: string;
  locationId: string;
  locationName: string;
  preferredTimeOfDay: TimeOfDay;
  manualPriorityBoost: number;
  status: WaitlistStatus;
  consentGiven: boolean;
  joinedAt: string;
  updatedAt: string;
  notes?: string;
}

export interface RecoveryCandidate {
  customerId: string;
  customerName: string;
  customerPhone: string;
  score: number;
  reachabilityScore?: number;
  aiRankingReason?: string;
  status: CandidateStatus;
  retryCount: number;
  callAttemptIds: string[];
  lastAttemptAt?: string;
  contactedAt?: string;
}

export interface RecoveryJob {
  id: string;
  appointmentId: string;
  appointmentTypeId: string;
  appointmentTypeName: string;
  locationId: string;
  locationName: string;
  slotTime: string;
  status: RecoveryJobStatus;
  currentCandidateIndex: number;
  candidates: RecoveryCandidate[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  winnerCustomerId?: string;
  winnerCustomerName?: string;
  totalAttempts: number;
  price: number;
  escalationReason?: string;
  callAttempts?: CallAttempt[];
}

export interface CallAttempt {
  id: string;
  recoveryJobId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  appointmentId: string;
  fonioCallId?: string;
  status: CallAttemptStatus;
  outcome?: CallOutcome;
  attemptNumber: number;
  initiatedAt: string;
  completedAt?: string;
  duration?: number;
  callbackScheduledAt?: string;
  errorMessage?: string;
  transcript?: string | null;
  declineReason?: string | null;
  customerResponse?: string | null;
}

export type PersonalityTrait =
  | 'warm' | 'professional' | 'empathetic'
  | 'energetic' | 'calm' | 'friendly' | 'direct';

export interface PersonaStats {
  totalCalls: number;
  acceptedCalls: number;
  acceptanceRate: number;
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  personality: PersonalityTrait[];
  objective: string;
  dos: string[];
  donts: string[];
  closingStyle: string;
  assignedTypeIds: string[];
  isActive: boolean;
  generatedPrompt: string;
  stats: PersonaStats;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonaPayload {
  name: string;
  role: string;
  personality: PersonalityTrait[];
  objective: string;
  dos: string[];
  donts: string[];
  closingStyle: string;
  assignedTypeIds: string[];
}

export interface Settings {
  id: string;
  aiSystemPrompt: string;
  maxRetries: number;
  callbackDelayMinutes: number;
  voiceSettings: {
    voiceId: string;
    language: string;
    speakingStyle: string;
    tone: string;
  };
  updatedAt: string;
}

export interface AnalyticsOverview {
  recoveryRate: number;
  totalRecovered: number;
  totalCancelled: number;
  revenueRecovered: number;
  avgCallsPerRecovery: number;
  acceptanceRate: number;
  callbackRate: number;
  failedRecoveryRate: number;
  avgRecoveryTimeMinutes: number;
  noAnswerRate: number;
  retrySuccessRate: number;
  totalActiveJobs: number;
  totalCallAttempts: number;
}

export interface AnalyticsTrend {
  date: string;
  recovered: number;
  cancelled: number;
  recoveryRate: number;
  revenue: number;
  attempts: number;
}

export interface OutcomeDistribution {
  outcome: CallOutcome;
  count: number;
  percentage: number;
}
