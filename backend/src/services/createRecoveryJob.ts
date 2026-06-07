import { col, now, toIso } from '../lib/firebase';
import { rankCandidatesAI, CandidateInput } from './rankCandidatesAI';
import { initiateCall } from './initiateCall';
import { Appointment, Customer, ContactHistoryEntry } from '../types';

export async function createRecoveryJob(appointmentId: string): Promise<void> {
  console.log(`[createRecoveryJob] START — appointmentId=${appointmentId}`);

  const apptDoc = await col.appointments.doc(appointmentId).get();
  if (!apptDoc.exists) throw new Error(`[createRecoveryJob] Appointment ${appointmentId} not found`);

  const appt = { id: apptDoc.id, ...apptDoc.data() } as Appointment;
  const cancelledSlotTime = new Date(toIso(appt.startTime));
  console.log(`[createRecoveryJob] Cancelled slot — type=${appt.appointmentTypeName} location=${appt.locationName} time=${cancelledSlotTime.toISOString()}`);

  const snap = await col.appointments
    .where('status', '==', 'BOOKED')
    .where('appointmentTypeId', '==', appt.appointmentTypeId)
    .where('locationId', '==', appt.locationId)
    .where('wantsEarlierSlot', '==', true)
    .get();

  console.log(`[createRecoveryJob] BOOKED+wantsEarlierSlot query returned ${snap.size} appointments`);

  const eligible = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Appointment)
    .filter((a) => a.id !== appointmentId && new Date(toIso(a.startTime)) > cancelledSlotTime);

  console.log(`[createRecoveryJob] Eligible after time filter — ${eligible.length} candidates`);
  eligible.forEach((a) => console.log(`  - ${a.customerName} (${a.id}) scheduled ${toIso(a.startTime).slice(0, 10)}`));

  // ── Fetch full contact history per candidate ────────────────────────────────
  const historyByCustomer: Record<string, Pick<ContactHistoryEntry, 'outcome' | 'createdAt'>[]> = {};
  if (eligible.length > 0) {
    const customerIds = [...new Set(eligible.map((a) => a.customerId))];
    const chunks: string[][] = [];
    for (let i = 0; i < customerIds.length; i += 30) chunks.push(customerIds.slice(i, i + 30));

    console.log(`[createRecoveryJob] Fetching contact history for ${customerIds.length} customers in ${chunks.length} chunk(s)`);

    for (const chunk of chunks) {
      const histSnap = await col.contactHistory.where('customerId', 'in', chunk).get();
      for (const doc of histSnap.docs) {
        const d = doc.data();
        const cid = d.customerId as string;
        if (!historyByCustomer[cid]) historyByCustomer[cid] = [];
        historyByCustomer[cid].push({
          outcome: d.outcome,
          createdAt: d.createdAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
        });
      }
    }

    // Sort each customer's history newest-first (required by reachability score)
    for (const cid of Object.keys(historyByCustomer)) {
      historyByCustomer[cid].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    console.log(`[createRecoveryJob] Contact history loaded — ${Object.keys(historyByCustomer).length} customers have history`);
  }

  // ── Fetch customer profiles in batch ───────────────────────────────────────
  const customerMap: Record<string, Customer> = {};
  if (eligible.length > 0) {
    const customerIds = [...new Set(eligible.map((a) => a.customerId))];
    const chunks: string[][] = [];
    for (let i = 0; i < customerIds.length; i += 30) chunks.push(customerIds.slice(i, i + 30));

    for (const chunk of chunks) {
      const custSnap = await col.customers.where('__name__', 'in', chunk).get();
      for (const doc of custSnap.docs) {
        customerMap[doc.id] = { id: doc.id, ...doc.data() } as Customer;
      }
    }
    console.log(`[createRecoveryJob] Customer profiles loaded — ${Object.keys(customerMap).length} found`);
  }

  // ── Build candidate inputs and AI-rank ─────────────────────────────────────
  const slotTime = cancelledSlotTime;
  const candidateInputs: CandidateInput[] = eligible.map((a) => ({
    appointment: a,
    customer: customerMap[a.customerId],
    historyEntries: historyByCustomer[a.customerId] ?? [],
    daysSaved: (new Date(toIso(a.startTime)).getTime() - slotTime.getTime()) / (1000 * 60 * 60 * 24),
  }));

  const ranked = await rankCandidatesAI(
    candidateInputs,
    slotTime,
    appt.appointmentTypeName,
    appt.locationName,
    appt.price,
  );

  console.log(`[createRecoveryJob] Ranked candidates (top ${ranked.length}):`);
  ranked.forEach((c, i) =>
    console.log(`  [${i}] ${c.customerName} score=${c.score} reachability=${c.reachabilityScore} reason="${c.aiRankingReason}"`)
  );

  const candidates = ranked.map((c) => ({
    customerId: c.customerId,
    customerName: c.customerName,
    customerPhone: c.customerPhone,
    score: c.score,
    reachabilityScore: c.reachabilityScore,
    aiRankingReason: c.aiRankingReason,
    originalAppointmentId: c.originalAppointmentId,
    status: 'PENDING',
    retryCount: 0,
    callAttemptIds: [],
  }));

  const jobRef = col.recoveryJobs.doc();
  await jobRef.set({
    appointmentId,
    appointmentTypeId: appt.appointmentTypeId,
    appointmentTypeName: appt.appointmentTypeName,
    locationId: appt.locationId,
    locationName: appt.locationName,
    slotTime: appt.startTime,
    status: candidates.length > 0 ? 'IN_PROGRESS' : 'FAILED',
    currentCandidateIndex: 0,
    candidates,
    totalAttempts: 0,
    price: appt.price,
    createdAt: now(),
    updatedAt: now(),
  });

  await col.appointments.doc(appointmentId).update({ recoveryJobId: jobRef.id });
  console.log(`[createRecoveryJob] Job created — jobId=${jobRef.id} status=${candidates.length > 0 ? 'IN_PROGRESS' : 'FAILED'} candidates=${candidates.length}`);

  if (candidates.length === 0) {
    console.warn(`[createRecoveryJob] No eligible candidates — job marked FAILED immediately`);
    return;
  }

  console.log(`[createRecoveryJob] Firing first call for candidate 0 — ${candidates[0].customerName}`);
  initiateCall(jobRef.id, 0, appt)
    .catch((err) => console.error(`[createRecoveryJob] Failed to initiate first call for job ${jobRef.id}:`, err));
}
