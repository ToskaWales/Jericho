import { Appointment, CallOutcome, ContactHistoryEntry, TimeOfDay } from '../types';

interface ContactSummary {
  lastOutcome: CallOutcome | null;
  noAnswerStreak: number;
}

export interface RankedCandidate {
  customerId: string;
  customerName: string;
  customerPhone: string;
  score: number;
  originalAppointmentId: string;
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function slotHourFromTime(timeOfDay: TimeOfDay): number[] {
  switch (timeOfDay) {
    case 'MORNING':   return [8, 9, 10, 11];
    case 'AFTERNOON': return [12, 13, 14, 15, 16];
    case 'EVENING':   return [17, 18, 19];
    default:          return [];
  }
}

// Returns a 0–100 score indicating how likely this customer is to answer the phone.
// "Answered" = they actually spoke to someone (ACCEPTED, DECLINED, CALLBACK_REQUESTED).
// No history → 65 (slightly positive unknown).
export function computeReachabilityScore(
  entries: Pick<ContactHistoryEntry, 'outcome' | 'createdAt'>[],
  preferredTime: TimeOfDay,
  slotHour: number,
  lastAttemptedAt?: Date,
): number {
  if (entries.length === 0) return 65;

  const answered = entries.filter(
    (e) => e.outcome === 'ACCEPTED' || e.outcome === 'DECLINED' || e.outcome === 'CALLBACK_REQUESTED'
  ).length;
  const answerRate = answered / entries.length;

  let noAnswerStreak = 0;
  // entries should be sorted newest-first; count leading consecutive no-picks
  for (const e of entries) {
    if (e.outcome === 'NO_ANSWER' || e.outcome === 'VOICEMAIL') noAnswerStreak++;
    else break;
  }

  const preferredHours = slotHourFromTime(preferredTime);
  const timeMatch = preferredHours.length === 0 || preferredHours.includes(slotHour);

  const recentlyCalledPenalty =
    lastAttemptedAt && Date.now() - lastAttemptedAt.getTime() < 4 * 60 * 60 * 1000 ? 20 : 0;

  const raw =
    60 +
    answerRate * 30 -
    Math.min(noAnswerStreak * 10, 30) +
    (timeMatch ? 10 : 0) -
    recentlyCalledPenalty;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

// Rule-based fallback ranking — kept for when the AI call fails.
export function rankCandidates(
  candidates: Appointment[],
  cancelledSlotTime: Date,
  contactHistory: Record<string, ContactSummary>
): RankedCandidate[] {
  const scored = candidates.map((appt) => {
    let score = 0;

    const saved = daysBetween(cancelledSlotTime, new Date(appt.startTime as string));
    score += Math.min(saved, 60);

    const history = contactHistory[appt.customerId];
    if (history) {
      if (history.lastOutcome === 'DECLINED') score -= 30;
      if (history.noAnswerStreak >= 2)        score -= 15;
      if (history.lastOutcome === 'ACCEPTED') score += 10;
    }

    return {
      customerId: appt.customerId,
      customerName: appt.customerName,
      customerPhone: appt.customerPhone,
      score: Math.round(score),
      originalAppointmentId: appt.id,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}
