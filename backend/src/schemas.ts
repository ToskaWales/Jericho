import { z } from 'zod';

const TimeOfDay = z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANY']);
const WaitlistStatus = z.enum(['ACTIVE', 'INACTIVE', 'REMOVED']);

export const CreateCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  locationId: z.string().min(1),
  preferredTimeOfDay: TimeOfDay.default('ANY'),
  preferredAppointmentTypeIds: z.array(z.string()).default([]),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  locationId: z.string().min(1).optional(),
  preferredTimeOfDay: TimeOfDay.optional(),
  preferredAppointmentTypeIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const CreateAppointmentSchema = z.object({
  customerId: z.string().min(1),
  appointmentTypeId: z.string().min(1),
  locationId: z.string().min(1),
  startTime: z.string().datetime(),
  notes: z.string().optional(),
  wantsEarlierSlot: z.boolean().default(false),
});

export const CancelAppointmentSchema = z.object({
  cancelledBy: z.string().min(1),
});

export const CreateAppointmentTypeSchema = z.object({
  name: z.string().min(1),
  duration: z.number().int().positive(),
  price: z.number().nonnegative(),
  locationId: z.string().min(1),
});

export const CreateWaitlistSchema = z.object({
  customerId: z.string().min(1),
  appointmentTypeId: z.string().min(1),
  locationId: z.string().min(1),
  preferredTimeOfDay: TimeOfDay,
  manualPriorityBoost: z.number().default(0),
  consentGiven: z.boolean(),
  notes: z.string().optional(),
});

export const UpdateWaitlistSchema = z.object({
  preferredTimeOfDay: TimeOfDay.optional(),
  manualPriorityBoost: z.number().optional(),
  status: WaitlistStatus.optional(),
  consentGiven: z.boolean().optional(),
  notes: z.string().optional(),
});

export const EscalateJobSchema = z.object({
  reason: z.string().optional(),
});

export const UpdateSettingsSchema = z.object({
  aiSystemPrompt: z.string().optional(),
  maxRetries: z.number().int().min(1).max(5).optional(),
  callbackDelayMinutes: z.number().int().min(1).optional(),
  voiceSettings: z.object({
    voiceId: z.string().optional(),
    language: z.string().optional(),
    speakingStyle: z.string().optional(),
    tone: z.string().optional(),
  }).optional(),
});

const PersonalityTraitEnum = z.enum([
  'warm', 'professional', 'empathetic', 'energetic', 'calm', 'friendly', 'direct',
]);

export const CreatePersonaSchema = z.object({
  name:            z.string().min(1).max(40),
  role:            z.string().min(1).max(80),
  personality:     z.array(PersonalityTraitEnum).min(1).max(5),
  objective:       z.string().min(1).max(300),
  dos:             z.array(z.string().min(1).max(120)).max(8).default([]),
  donts:           z.array(z.string().min(1).max(120)).max(8).default([]),
  closingStyle:    z.string().min(1).max(200),
  assignedTypeIds: z.array(z.string()).default([]),
});

export const UpdatePersonaSchema = CreatePersonaSchema.partial();

// Cal.com sends this for BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
export const CalcomWebhookSchema = z.object({
  triggerEvent: z.string(),
  payload: z.object({
    uid: z.string(),
    title: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    status: z.string().optional(),
    cancellationReason: z.string().nullable().optional(),
    eventTypeId: z.number().optional(),
    attendees: z.array(z.object({
      name: z.string(),
      email: z.string(),
      timeZone: z.string().optional(),
      phoneNumber: z.string().nullable().optional(),
    })).optional(),
    organizer: z.any().optional(),
  }),
}).passthrough();

export const FonioWebhookSchema = z.object({
  id: z.string(),
  toNumber: z.string().nullable().optional(),
  fromNumber: z.string().nullable().optional(),
  duration: z.number().optional(),
  disconnectReason: z.string().nullable().optional(),
  startTimestamp: z.string().optional(),
  endTimestamp: z.string().optional(),
  summary: z.string().optional(),
  transcript: z.array(z.any()).optional(),
  formattedTranscript: z.string().optional(),
  context: z.any().optional(),
  extractionData: z.object({
    callOutcome: z.enum(['ACCEPTED', 'DECLINED', 'NO_ANSWER', 'VOICEMAIL', 'CALLBACK_REQUESTED', 'FAILED']),
    callbackRequested: z.boolean().nullable().optional(),
    callbackTime: z.string().nullable().optional(),
    voicemailReached: z.boolean().nullable().optional(),
    acceptanceConfirmed: z.boolean().nullable().optional(),
    declineReason: z.string().nullable().optional(),
    technicalFailure: z.boolean().nullable().optional(),
    failureReason: z.string().nullable().optional(),
    customerResponse: z.string().nullable().optional(),
  }),
}).passthrough();
