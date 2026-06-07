import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, type QuerySnapshot, type DocumentData } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { recoveryJobsApi } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { RecoveryJob, CallAttempt } from '@/types';

// Real-time active jobs via Firestore listener
export function useActiveRecoveryJobsRealtime() {
  const [jobs, setJobs] = useState<RecoveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'recoveryJobs'),
      where('status', 'in', ['PENDING', 'IN_PROGRESS']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map((doc) => {
          const raw = doc.data();
          return convertFirestoreJob(doc.id, raw);
        });
        setJobs(data);
        setLoading(false);
      },
      (err) => {
        console.error('[Firestore] Error watching recovery jobs:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { jobs, loading, error };
}

// Real-time single job detail
export function useRecoveryJobRealtime(jobId: string | undefined) {
  const [job, setJob] = useState<RecoveryJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    const { doc } = require('@/lib/firebase');
    const jobRef = doc(db, 'recoveryJobs', jobId);
    const unsubscribe = onSnapshot(jobRef, (snapshot: import('firebase/firestore').DocumentSnapshot) => {
      if (snapshot.exists()) {
        setJob(convertFirestoreJob(snapshot.id, snapshot.data()!));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [jobId]);

  return { job, loading };
}

// REST-based queries
export function useRecoveryJobs(params?: { status?: string; locationId?: string }) {
  return useQuery({
    queryKey: queryKeys.recoveryJobs.filtered(params ?? {}),
    queryFn: () => recoveryJobsApi.list(params),
  });
}

export function useRecoveryJob(id: string) {
  return useQuery({
    queryKey: queryKeys.recoveryJobs.detail(id),
    queryFn: () => recoveryJobsApi.get(id),
    enabled: !!id,
  });
}

export function useEscalateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      recoveryJobsApi.escalate(id, reason),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.recoveryJobs.all });
      qc.invalidateQueries({ queryKey: queryKeys.recoveryJobs.detail(id) });
    },
  });
}

// Real-time call attempts for a single job
export function useCallAttemptsRealtime(jobId: string | undefined) {
  const [attempts, setAttempts] = useState<CallAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) { setLoading(false); return; }
    const q = query(
      collection(db, 'callAttempts'),
      where('recoveryJobId', '==', jobId),
      orderBy('initiatedAt', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAttempts(snap.docs.map((d) => convertFirestoreCallAttempt(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        console.error('[Firestore] Error watching callAttempts:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [jobId]);

  return { attempts, loading };
}

// Firestore timestamp → ISO string conversion
function convertTimestamp(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date().toISOString();
}

function convertFirestoreCallAttempt(id: string, raw: Record<string, unknown>): CallAttempt {
  return {
    id,
    recoveryJobId: raw.recoveryJobId as string,
    customerId: raw.customerId as string,
    customerName: raw.customerName as string,
    customerPhone: raw.customerPhone as string,
    appointmentId: raw.appointmentId as string,
    fonioCallId: raw.fonioCallId as string | undefined,
    status: raw.status as CallAttempt['status'],
    outcome: raw.outcome as CallAttempt['outcome'],
    attemptNumber: (raw.attemptNumber as number) ?? 1,
    initiatedAt: convertTimestamp(raw.initiatedAt),
    completedAt: raw.completedAt ? convertTimestamp(raw.completedAt) : undefined,
    duration: raw.duration as number | undefined,
    callbackScheduledAt: raw.callbackScheduledAt ? convertTimestamp(raw.callbackScheduledAt) : undefined,
    errorMessage: raw.errorMessage as string | undefined,
    transcript: raw.transcript as string | null | undefined,
    declineReason: raw.declineReason as string | null | undefined,
    customerResponse: raw.customerResponse as string | null | undefined,
  };
}

function convertFirestoreJob(id: string, raw: Record<string, unknown>): RecoveryJob {
  return {
    id,
    appointmentId: raw.appointmentId as string,
    appointmentTypeId: raw.appointmentTypeId as string,
    appointmentTypeName: raw.appointmentTypeName as string,
    locationId: raw.locationId as string,
    locationName: raw.locationName as string,
    slotTime: convertTimestamp(raw.slotTime),
    status: raw.status as RecoveryJob['status'],
    currentCandidateIndex: (raw.currentCandidateIndex as number) ?? 0,
    candidates: ((raw.candidates as unknown[]) ?? []).map((c: unknown) => {
      const candidate = c as Record<string, unknown>;
      return {
        customerId: candidate.customerId as string,
        customerName: candidate.customerName as string,
        customerPhone: candidate.customerPhone as string,
        score: candidate.score as number,
        status: candidate.status as RecoveryJob['candidates'][0]['status'],
        retryCount: (candidate.retryCount as number) ?? 0,
        callAttemptIds: (candidate.callAttemptIds as string[]) ?? [],
        lastAttemptAt: candidate.lastAttemptAt ? convertTimestamp(candidate.lastAttemptAt) : undefined,
        contactedAt: candidate.contactedAt ? convertTimestamp(candidate.contactedAt) : undefined,
        reachabilityScore: candidate.reachabilityScore as number | undefined,
        aiRankingReason: candidate.aiRankingReason as string | undefined,
      };
    }),
    createdAt: convertTimestamp(raw.createdAt),
    updatedAt: convertTimestamp(raw.updatedAt),
    completedAt: raw.completedAt ? convertTimestamp(raw.completedAt) : undefined,
    winnerCustomerId: raw.winnerCustomerId as string | undefined,
    winnerCustomerName: raw.winnerCustomerName as string | undefined,
    totalAttempts: (raw.totalAttempts as number) ?? 0,
    price: (raw.price as number) ?? 0,
    escalationReason: raw.escalationReason as string | undefined,
  };
}
