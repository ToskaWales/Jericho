import { col, now, toIso } from '../lib/firebase';
import { fonioClient } from '../lib/fonio';
import { buildCustomerContext } from './buildCustomerContext';
import { Appointment } from '../types';

export async function initiateCall(
  jobId: string,
  candidateIndex: number,
  appointment: Appointment
): Promise<string> {
  console.log(`[initiateCall] START — job=${jobId} candidateIndex=${candidateIndex} appointmentId=${appointment.id}`);

  const jobDoc = await col.recoveryJobs.doc(jobId).get();
  const job = jobDoc.data();
  if (!job) throw new Error(`[initiateCall] Recovery job ${jobId} not found`);

  // Guard: don't call if the job already finished (e.g. from a duplicate webhook or race)
  if (job.status !== 'IN_PROGRESS') {
    console.warn(`[initiateCall] Job ${jobId} has status=${job.status} — skipping call (not IN_PROGRESS)`);
    return '';
  }

  const candidate = job.candidates[candidateIndex];
  if (!candidate) throw new Error(`[initiateCall] Candidate ${candidateIndex} not found in job ${jobId}`);

  console.log(`[initiateCall] Candidate — name=${candidate.customerName} phone=${candidate.customerPhone} retryCount=${candidate.retryCount ?? 0}`);

  // const settingsDoc = await col.settings.doc('default').get();
  // const settings = settingsDoc.data() ?? {};
  // const systemPrompt = settings.aiSystemPrompt || DEFAULT_PROMPT;

  const customerCtx = await buildCustomerContext(candidate.customerId);
  console.log(`[initiateCall] Customer context — lastVisit=${customerCtx.lastVisit} appointmentCount=${customerCtx.appointmentCount}`);

  const appointmentTime = appointment.startTime;

  const attemptNumber = (candidate.retryCount ?? 0) + 1;
  const attemptRef = col.callAttempts.doc();
  const callAttemptId = attemptRef.id;

  // Create the attempt doc BEFORE calling Fonio — avoids a race condition where
  // a very short call triggers the webhook before the doc exists.
  await attemptRef.set({
    recoveryJobId: jobId,
    customerId: candidate.customerId,
    customerName: candidate.customerName,
    customerPhone: candidate.customerPhone,
    appointmentId: appointment.id,
    fonioCallId: callAttemptId,
    status: 'INITIATED',
    attemptNumber,
    initiatedAt: now(),
  });
  console.log(`[initiateCall] Attempt doc created — attemptId=${callAttemptId} attemptNumber=${attemptNumber}`);

  const payload = {
    apiKey: process.env.FONIO_API_KEY,
    fromNumber: process.env.FONIO_PHONE_NUMBER,
    toNumber: candidate.customerPhone,
    agentId: process.env.FONIO_AGENT_ID,
    context: {
      customerName: candidate.customerName,
      lastVisit: customerCtx.lastVisit,
      preferredTime: customerCtx.preferredTime,
      appointmentType: appointment.appointmentTypeName,
      appointmentTime,
      notes: appointment.notes
    },
  };
  console.log(`[initiateCall] Sending to Fonio — toNumber=${payload.toNumber} fromNumber=${payload.fromNumber} agentId=${payload.agentId}`);

  let fonioResponse: unknown;
  try {
    const res = await fonioClient.post('/api/public/v1/outbound_call', payload);
    fonioResponse = res.data;
    console.log(`[initiateCall] Fonio response — ${JSON.stringify(fonioResponse)}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[initiateCall] Fonio API error — ${msg}`);
    // Mark attempt as failed so it doesn't block webhook matching
    await attemptRef.update({ status: 'FAILED', failureReason: msg });
    throw err;
  }

  const updatedCandidates = [...job.candidates];
  updatedCandidates[candidateIndex] = {
    ...candidate,
    status: 'CONTACTED',
    retryCount: attemptNumber - 1,
    callAttemptIds: [...(candidate.callAttemptIds ?? []), callAttemptId],
    lastAttemptAt: toIso(now()),
    contactedAt: candidate.contactedAt ?? toIso(now()),
  };

  await col.recoveryJobs.doc(jobId).update({
    candidates: updatedCandidates,
    totalAttempts: (job.totalAttempts ?? 0) + 1,
    updatedAt: now(),
  });

  console.log(`[initiateCall] Job updated — totalAttempts=${(job.totalAttempts ?? 0) + 1}`);
  console.log(`[initiateCall] DONE — job=${jobId} candidate=${candidateIndex} attemptId=${callAttemptId}`);
  return callAttemptId;
}
