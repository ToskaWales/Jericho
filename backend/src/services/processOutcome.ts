import { col, now, toIso, db } from '../lib/firebase';
import { resolveTranscript } from '../lib/formatTranscript';
import { initiateCall } from './initiateCall';
import { createCalcomBooking } from './createCalcomBooking';
import { cancelCalcomBooking } from './cancelCalcomBooking';
import { CallOutcome, Appointment } from '../types';

function ts() { return new Date().toISOString().slice(11, 23); }
function banner(label: string) { console.log(`\n${ts()} ==== ${label} ${'='.repeat(Math.max(0, 50 - label.length))}`); }

export interface FonioWebhookPayload {
  id: string;
  toNumber?: string | null;
  endTimestamp?: string;
  duration?: number;
  disconnectReason?: string | null;
  summary?: string;
  formattedTranscript?: string;
  transcript?: unknown[];
  extractionData: {
    callOutcome: CallOutcome;
    callbackRequested?: boolean | null;
    callbackTime?: string | null;
    voicemailReached?: boolean | null;
    acceptanceConfirmed?: boolean | null;
    declineReason?: string | null;
    technicalFailure?: boolean | null;
    failureReason?: string | null;
    customerResponse?: string | null;
  };
}

export async function processOutcome(webhook: FonioWebhookPayload): Promise<void> {
  const { id: fonioCallId, toNumber, endTimestamp, extractionData } = webhook;
  const outcome = extractionData.callOutcome;

  banner(`OUTCOME: ${outcome}`);
  console.log(`${ts()} [processOutcome] fonioCallId=${fonioCallId} toNumber=${toNumber ?? 'null'} duration=${webhook.duration ?? '?'}s disconnectReason=${webhook.disconnectReason ?? 'none'}`);
  console.log(`${ts()} [processOutcome] extractionData=${JSON.stringify(extractionData)}`);

  // ── Match the call attempt ──────────────────────────────────────────────────
  let attemptDoc: FirebaseFirestore.DocumentSnapshot | null = null;

  if (toNumber) {
    console.log(`${ts()} [processOutcome] Matching call attempt by toNumber=${toNumber} status=INITIATED`);
    const snap = await col.callAttempts
      .where('customerPhone', '==', toNumber)
      .where('status', '==', 'INITIATED')
      .get();

    console.log(`${ts()} [processOutcome] Phone match query — ${snap.size} result(s)`);

    if (!snap.empty) {
      const sorted = snap.docs.sort((a, b) => {
        const aMs = a.data().initiatedAt?.toDate?.()?.getTime() ?? 0;
        const bMs = b.data().initiatedAt?.toDate?.()?.getTime() ?? 0;
        return bMs - aMs;
      });
      attemptDoc = sorted[0];
      console.log(`${ts()} [processOutcome] Matched attempt — attemptId=${attemptDoc.id}`);
    }
  } else {
    console.warn(`${ts()} [processOutcome] toNumber is null — falling back to most recent INITIATED attempt`);
  }

  if (!attemptDoc) {
    console.log(`${ts()} [processOutcome] No phone match — querying all INITIATED attempts as fallback`);
    const snap = await col.callAttempts.where('status', '==', 'INITIATED').get();
    console.log(`${ts()} [processOutcome] Fallback query — ${snap.size} INITIATED attempt(s)`);

    if (!snap.empty) {
      const sorted = snap.docs.sort((a, b) => {
        const aMs = a.data().initiatedAt?.toDate?.()?.getTime() ?? 0;
        const bMs = b.data().initiatedAt?.toDate?.()?.getTime() ?? 0;
        return bMs - aMs;
      });
      attemptDoc = sorted[0];
      const d = attemptDoc.data()!;
      console.log(`${ts()} [processOutcome] Fallback matched — attemptId=${attemptDoc.id} customer="${d.customerName}" phone=${d.customerPhone}`);
    }
  }

  if (!attemptDoc) {
    console.error(`${ts()} [processOutcome] NO MATCH — no INITIATED callAttempt found for fonioCallId=${fonioCallId}. Webhook dropped.`);
    return;
  }

  const attempt = attemptDoc.data()!;
  console.log(`${ts()} [processOutcome] Attempt matched — attemptId=${attemptDoc.id} recoveryJobId=${attempt.recoveryJobId} customer="${attempt.customerName}" appointmentId=${attempt.appointmentId}`);

  const transcript = resolveTranscript(webhook);
  if (!transcript) {
    console.warn(`${ts()} [processOutcome] No transcript in webhook — formattedTranscript and transcript[] both empty`);
  }

  // ── Update call attempt ─────────────────────────────────────────────────────
  await attemptDoc.ref.update({
    status: 'COMPLETED',
    outcome,
    fonioCallId,
    completedAt: endTimestamp ?? toIso(now()),
    declineReason: extractionData.declineReason ?? null,
    customerResponse: extractionData.customerResponse ?? null,
    callbackTime: extractionData.callbackTime ?? null,
    transcript,
    duration: webhook.duration ?? null,
  });
  console.log(`${ts()} [processOutcome] Attempt doc marked COMPLETED (duration=${webhook.duration ?? '?'}s transcript=${transcript ? 'yes' : 'none'})`);

  // ── Persona stats attribution ───────────────────────────────────────────────
  const personaId = attempt.personaId as string | null;
  if (personaId) {
    const personaRef = col.personas.doc(personaId);
    db.runTransaction(async (tx) => {
      const personaDoc = await tx.get(personaRef);
      if (!personaDoc.exists) return;
      const current = personaDoc.data()!;
      const totalCalls = ((current.stats?.totalCalls as number) ?? 0) + 1;
      const acceptedCalls = ((current.stats?.acceptedCalls as number) ?? 0) +
        (outcome === 'ACCEPTED' ? 1 : 0);
      tx.update(personaRef, {
        'stats.totalCalls': totalCalls,
        'stats.acceptedCalls': acceptedCalls,
        'stats.acceptanceRate': totalCalls > 0
          ? Math.round((acceptedCalls / totalCalls) * 1000) / 10
          : 0,
        updatedAt: now(),
      });
    }).catch((err) => console.error(`${ts()} [processOutcome] Persona stats update failed:`, err));
  }

  // ── Load recovery job ───────────────────────────────────────────────────────
  const jobDoc = await col.recoveryJobs.doc(attempt.recoveryJobId).get();
  if (!jobDoc.exists) {
    console.error(`${ts()} [processOutcome] Recovery job ${attempt.recoveryJobId} not found — cannot advance`);
    return;
  }

  const job = jobDoc.data()!;
  const idx = job.currentCandidateIndex as number;
  const candidates = [...(job.candidates as Record<string, unknown>[])];
  const candidate = candidates[idx];

  console.log(`${ts()} [processOutcome] Job=${attempt.recoveryJobId} status=${job.status} candidate ${idx + 1}/${candidates.length} — name="${candidate.customerName}" retryCount=${candidate.retryCount ?? 0}`);

  // ── Settings ────────────────────────────────────────────────────────────────
  const settingsDoc = await col.settings.doc('default').get();
  const maxRetries: number = (settingsDoc.data()?.maxRetries as number) ?? 2;
  console.log(`${ts()} [processOutcome] maxRetries=${maxRetries}`);

  // ── Contact history ─────────────────────────────────────────────────────────
  await col.contactHistory.add({
    customerId: candidate.customerId,
    outcome,
    recoveryJobId: attempt.recoveryJobId,
    callAttemptId: attemptDoc.id,
    declineReason: extractionData.declineReason ?? null,
    customerResponse: extractionData.customerResponse ?? null,
    createdAt: now(),
  });
  console.log(`${ts()} [processOutcome] Contact history written — customerId=${candidate.customerId} outcome=${outcome}`);

  // ── Load appointment ────────────────────────────────────────────────────────
  const apptDoc = await col.appointments.doc(attempt.appointmentId).get();
  const appt = { id: apptDoc.id, ...apptDoc.data() } as Appointment;
  console.log(`${ts()} [processOutcome] Appointment — id=${appt.id} type="${appt.appointmentTypeName}" slot=${toIso(appt.startTime).slice(0, 16)}`);

  // ── Route by outcome ────────────────────────────────────────────────────────
  switch (outcome) {

    case 'ACCEPTED': {
      banner('JOB SUCCESS — SLOT RECOVERED');
      console.log(`${ts()} [processOutcome] Winner: "${candidate.customerName}" (${candidate.customerPhone})`);
      console.log(`${ts()} [processOutcome] Slot: ${appt.appointmentTypeName} @ ${toIso(appt.startTime).slice(0, 16)}`);

      candidates[idx] = { ...candidate, status: 'ACCEPTED' };
      await jobDoc.ref.update({
        candidates,
        status: 'SUCCESS',
        winnerCustomerId: candidate.customerId,
        winnerCustomerName: candidate.customerName,
        completedAt: now(),
        updatedAt: now(),
      });
      await col.appointments.doc(attempt.appointmentId).update({
        status: 'RECOVERED',
        recoveredAt: now(),
        customerId: candidate.customerId,
        customerName: candidate.customerName,
        customerPhone: candidate.customerPhone,
        updatedAt: now(),
      });
      console.log(`${ts()} [processOutcome] Appointment marked RECOVERED — creating Cal.com booking`);

      try {
        const winnerUid = await createCalcomBooking({
          customerName: candidate.customerName as string,
          customerPhone: candidate.customerPhone as string,
          startTime: toIso(appt.startTime),
        });
        console.log(`${ts()} [processOutcome] Cal.com booking created — uid=${winnerUid}`);
        await col.appointments.doc(attempt.appointmentId).update({ calcomBookingUid: winnerUid });
      } catch (err) {
        console.error(`${ts()} [processOutcome] Cal.com booking failed (non-fatal):`, err);
      }

      const originalId = candidate.originalAppointmentId as string | undefined;
      if (originalId) {
        console.log(`${ts()} [processOutcome] "${candidate.customerName}" moved to earlier slot — freeing up originalAppointmentId=${originalId}`);

        const originalDoc = await col.appointments.doc(originalId).get();
        const originalCalcomUid = originalDoc.data()?.calcomBookingUid as string | undefined;

        // Mark the winner's old appointment cancelled so the slot is freed in Jericho.
        // We do NOT trigger a new recovery job here — doing so causes an infinite call chain
        // (each recovery winner frees a slot that spawns another job calling the same people).
        // The freed slot will appear as CANCELLED in the appointments table; the clinic can
        // manually trigger recovery for it if desired.
        await col.appointments.doc(originalId).update({
          status: 'CANCELLED',
          cancelledAt: now(),
          cancelledBy: 'system-slot-upgrade',
          updatedAt: now(),
        });
        console.log(`${ts()} [processOutcome] Original appointment ${originalId} cancelled (cancelledBy=system-slot-upgrade) — no cascade recovery`);

        if (originalCalcomUid) {
          cancelCalcomBooking(originalCalcomUid, 'Patient upgraded to earlier slot').catch((err) =>
            console.error(`${ts()} [processOutcome] Cal.com cancel failed for ${originalCalcomUid}:`, err)
          );
        }
      }
      console.log(`${ts()} [processOutcome] DONE — job ${jobDoc.id} SUCCESS\n`);
      break;
    }

    case 'DECLINED': {
      banner('DECLINED — MOVING TO NEXT CANDIDATE');
      console.log(`${ts()} [processOutcome] "${candidate.customerName}" declined — reason: "${extractionData.declineReason ?? 'none'}"`);
      candidates[idx] = { ...candidate, status: 'DECLINED' };
      await moveToNext(jobDoc.id, idx, candidates, job, appt);
      break;
    }

    case 'NO_ANSWER':
    case 'VOICEMAIL': {
      const retryCount = ((candidate.retryCount as number) ?? 0) + 1;
      candidates[idx] = { ...candidate, status: outcome, retryCount };

      if (retryCount < maxRetries) {
        banner(`${outcome} — REDIALING (attempt ${retryCount + 1} of ${maxRetries})`);
        console.log(`${ts()} [processOutcome] "${candidate.customerName}" did not answer — scheduling redial`);
        await jobDoc.ref.update({ candidates, updatedAt: now() });
        await initiateCall(jobDoc.id, idx, appt);
      } else {
        banner(`${outcome} — CANDIDATE EXHAUSTED (${retryCount}/${maxRetries} attempts used)`);
        console.log(`${ts()} [processOutcome] "${candidate.customerName}" unreachable after ${retryCount} attempts — moving to next candidate`);
        candidates[idx] = { ...candidates[idx], status: 'EXHAUSTED' };
        await moveToNext(jobDoc.id, idx, candidates, job, appt);
      }
      break;
    }

    case 'CALLBACK_REQUESTED': {
      banner('CALLBACK REQUESTED — JOB PAUSED');
      console.log(`${ts()} [processOutcome] "${candidate.customerName}" asked to be called back — callbackTime="${extractionData.callbackTime ?? 'unspecified'}"`);
      candidates[idx] = {
        ...candidate,
        status: 'CALLBACK_REQUESTED',
        callbackTime: extractionData.callbackTime ?? null,
      };
      await jobDoc.ref.update({
        candidates,
        status: 'CALLBACK_REQUESTED',
        updatedAt: now(),
      });
      console.log(`${ts()} [processOutcome] Job paused — awaiting manual callback or scheduled retry\n`);
      break;
    }

    case 'FAILED': {
      banner('CALL FAILED — ESCALATING JOB');
      console.error(`${ts()} [processOutcome] Technical failure — reason="${extractionData.failureReason ?? 'unknown'}"`);
      await jobDoc.ref.update({
        status: 'ESCALATED',
        escalationReason: extractionData.failureReason ?? 'Fonio call failure',
        updatedAt: now(),
      });
      console.log(`${ts()} [processOutcome] Job ${jobDoc.id} escalated for manual review\n`);
      break;
    }
  }
}

async function moveToNext(
  jobId: string,
  currentIdx: number,
  candidates: Record<string, unknown>[],
  job: Record<string, unknown>,
  appt: Appointment
): Promise<void> {
  const nextIdx = currentIdx + 1;

  if (nextIdx < candidates.length) {
    const next = candidates[nextIdx] as Record<string, unknown>;
    banner(`NEXT CANDIDATE (${nextIdx + 1}/${candidates.length})`);
    console.log(`${ts()} [moveToNext] job=${jobId} advancing ${currentIdx + 1} -> ${nextIdx + 1} — calling "${next.customerName}"`);
    await col.recoveryJobs.doc(jobId).update({
      candidates,
      currentCandidateIndex: nextIdx,
      updatedAt: now(),
    });
    await initiateCall(jobId, nextIdx, appt);
  } else {
    banner('JOB FAILED — ALL CANDIDATES EXHAUSTED');
    console.warn(`${ts()} [moveToNext] job=${jobId} — tried all ${candidates.length} candidate(s), none accepted. Marking FAILED.`);
    await col.recoveryJobs.doc(jobId).update({
      candidates,
      status: 'FAILED',
      completedAt: now(),
      updatedAt: now(),
    });
    console.log(`${ts()} [moveToNext] Job ${jobId} marked FAILED\n`);
  }
}
