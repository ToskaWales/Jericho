import Anthropic from '@anthropic-ai/sdk';
import { Appointment, Customer, ContactHistoryEntry, TimeOfDay } from '../types';
import { computeReachabilityScore, rankCandidates } from './rankCandidates';

export interface CandidateInput {
  appointment: Appointment;
  customer?: Customer;
  historyEntries: Pick<ContactHistoryEntry, 'outcome' | 'createdAt'>[];
  daysSaved: number;
}

export interface RankedResult {
  customerId: string;
  customerName: string;
  customerPhone: string;
  score: number;
  reachabilityScore: number;
  aiRankingReason: string;
  originalAppointmentId: string;
}

function countOutcomes(entries: Pick<ContactHistoryEntry, 'outcome'>[]) {
  let accepted = 0, declined = 0, noAnswer = 0, voicemail = 0, callback = 0;
  for (const e of entries) {
    if (e.outcome === 'ACCEPTED')           accepted++;
    else if (e.outcome === 'DECLINED')      declined++;
    else if (e.outcome === 'NO_ANSWER')     noAnswer++;
    else if (e.outcome === 'VOICEMAIL')     voicemail++;
    else if (e.outcome === 'CALLBACK_REQUESTED') callback++;
  }
  return { accepted, declined, noAnswer, voicemail, callback };
}

function slotHour(slotTime: Date): number {
  return slotTime.getHours();
}

function preferredTimeMatches(preferred: TimeOfDay, hour: number): boolean {
  if (preferred === 'ANY') return true;
  if (preferred === 'MORNING')   return hour >= 8  && hour < 12;
  if (preferred === 'AFTERNOON') return hour >= 12 && hour < 17;
  if (preferred === 'EVENING')   return hour >= 17 && hour < 20;
  return false;
}

function buildPrompt(candidates: CandidateInput[], slotTime: Date, slotTypeName: string, locationName: string, slotPrice: number): string {
  const hour = slotHour(slotTime);
  const slotDateStr = slotTime.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const profiles = candidates.map((c, i) => {
    const reachability = computeReachabilityScore(c.historyEntries, c.customer?.preferredTimeOfDay ?? 'ANY', hour);
    const counts = countOutcomes(c.historyEntries);
    const lastEntry = c.historyEntries[0];
    const timeMatch = preferredTimeMatches(c.customer?.preferredTimeOfDay ?? 'ANY', hour);
    return {
      index: i + 1,
      customerId: c.appointment.customerId,
      name: c.appointment.customerName,
      daysSaved: Math.round(c.daysSaved),
      reachabilityScore: reachability,
      preferredTimeOfDay: c.customer?.preferredTimeOfDay ?? 'ANY',
      slotTimeMatchesPreference: timeMatch,
      totalCalls: c.historyEntries.length,
      callHistory: counts,
      lastOutcome: lastEntry?.outcome ?? null,
      appointmentCount: c.customer?.appointmentCount ?? 0,
      lastVisitDate: c.customer?.lastVisitDate ?? null,
    };
  });

  return `You are ranking dental clinic patients to call for a newly available appointment slot. Your goal is to identify the patients most likely to both ANSWER the phone and ACCEPT the offer.

AVAILABLE SLOT:
- Service: ${slotTypeName}
- Location: ${locationName}
- Date/Time: ${slotDateStr}
- Value: $${slotPrice}

CANDIDATES (${candidates.length} total):
${JSON.stringify(profiles, null, 2)}

RANKING CRITERIA (in order of importance):
1. Reachability (will they pick up?) — use reachabilityScore, lastOutcome, callHistory
2. Motivation to accept (will they want this?) — daysSaved, slotTimeMatchesPreference, lastOutcome=ACCEPTED history
3. Loyalty / relationship — appointmentCount, lastVisitDate recency
4. Avoid anyone who recently declined unless they have a strong reason to accept now

Return ONLY a JSON array of up to 10 objects, ranked best-first. No explanation outside the JSON.
[{"customerId": "...", "rank": 1, "reason": "one concise sentence explaining why this person was ranked here"}, ...]`;
}

export async function rankCandidatesAI(
  candidates: CandidateInput[],
  slotTime: Date,
  slotTypeName: string,
  locationName: string,
  slotPrice: number,
): Promise<RankedResult[]> {
  const hour = slotHour(slotTime);

  // Pre-compute reachability for all candidates (used in fallback too)
  const reachabilityMap: Record<string, number> = {};
  for (const c of candidates) {
    reachabilityMap[c.appointment.customerId] = computeReachabilityScore(
      c.historyEntries,
      c.customer?.preferredTimeOfDay ?? 'ANY',
      hour,
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[rankCandidatesAI] ANTHROPIC_API_KEY not set — using rule-based fallback');
    return ruleFallback(candidates, slotTime, reachabilityMap);
  }

  try {
    const client = new Anthropic({ apiKey });
    const prompt = buildPrompt(candidates, slotTime, slotTypeName, locationName, slotPrice);

    console.log(`[rankCandidatesAI] Calling Claude Haiku to rank ${candidates.length} candidates`);
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    console.log(`[rankCandidatesAI] Claude response: ${raw.slice(0, 300)}`);

    // Extract JSON even if Claude wraps it in a code block
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('No JSON array in Claude response');

    const ranked: { customerId: string; rank: number; reason: string }[] = JSON.parse(jsonMatch[0]);

    // Build a lookup map from Claude's ordered list
    const candidateMap = new Map(candidates.map((c) => [c.appointment.customerId, c]));
    const results: RankedResult[] = [];

    for (const r of ranked.slice(0, 10)) {
      const c = candidateMap.get(r.customerId);
      if (!c) continue;
      results.push({
        customerId: c.appointment.customerId,
        customerName: c.appointment.customerName,
        customerPhone: c.appointment.customerPhone,
        score: 100 - (r.rank - 1) * 10, // rank 1 → 100, rank 10 → 10
        reachabilityScore: reachabilityMap[c.appointment.customerId],
        aiRankingReason: r.reason,
        originalAppointmentId: c.appointment.id,
      });
    }

    console.log(`[rankCandidatesAI] AI ranked ${results.length} candidates successfully`);
    return results;

  } catch (err) {
    console.error('[rankCandidatesAI] Claude call failed — using rule-based fallback:', err);
    return ruleFallback(candidates, slotTime, reachabilityMap);
  }
}

function ruleFallback(
  candidates: CandidateInput[],
  slotTime: Date,
  reachabilityMap: Record<string, number>,
): RankedResult[] {
  // Build contact summary for the existing rankCandidates() function
  const contactHistory: Record<string, { lastOutcome: any; noAnswerStreak: number }> = {};
  for (const c of candidates) {
    const sorted = [...c.historyEntries].sort((a, b) => {
      const aMs = new Date(a.createdAt).getTime();
      const bMs = new Date(b.createdAt).getTime();
      return bMs - aMs;
    });
    let noAnswerStreak = 0;
    for (const e of sorted) {
      if (e.outcome === 'NO_ANSWER' || e.outcome === 'VOICEMAIL') noAnswerStreak++;
      else break;
    }
    contactHistory[c.appointment.customerId] = {
      lastOutcome: sorted[0]?.outcome ?? null,
      noAnswerStreak,
    };
  }

  const ranked = rankCandidates(
    candidates.map((c) => c.appointment),
    slotTime,
    contactHistory,
  );

  return ranked.slice(0, 10).map((r) => ({
    ...r,
    reachabilityScore: reachabilityMap[r.customerId] ?? 65,
    aiRankingReason: 'Rule-based fallback (AI unavailable)',
  }));
}
