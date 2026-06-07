import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RecoveryStatusBadge } from '@/components/recovery/RecoveryStatusBadge';
import { CandidateList } from '@/components/recovery/CandidateList';
import { CallAttemptItem } from '@/components/recovery/CallAttemptItem';
import { RecoveryTimeline } from '@/components/recovery/RecoveryTimeline';
import { useRecoveryJobRealtime, useCallAttemptsRealtime, useEscalateJob } from '@/hooks/useRecoveryJobs';
import { formatDateTime, formatRelative, formatCurrency } from '@/lib/utils';
import type { RecoveryJobStatus } from '@/types';

const FINISHED_STATUSES: RecoveryJobStatus[] = ['SUCCESS', 'FAILED', 'ESCALATED'];

export default function RecoveryDetails() {
  const { id } = useParams<{ id: string }>();
  const { job, loading } = useRecoveryJobRealtime(id);
  const { attempts: callAttempts } = useCallAttemptsRealtime(id);
  const escalate = useEscalateJob();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
        <p className="text-muted-foreground">Recovery job not found.</p>
        <Button variant="outline" asChild>
          <Link to="/recovery-jobs"><ArrowLeft className="h-4 w-4 mr-1.5" /> Back</Link>
        </Button>
      </div>
    );
  }

  const isActive = job.status === 'PENDING' || job.status === 'IN_PROGRESS';
  const isFinished = FINISHED_STATUSES.includes(job.status);
  const completedAttempts = callAttempts.filter((a) => a.status === 'COMPLETED');
  const hasTranscripts = completedAttempts.some((a) => !!a.transcript?.trim());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/recovery-jobs"><ArrowLeft className="h-4 w-4 mr-1" /> All Jobs</Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <h2 className="text-sm text-muted-foreground">
          {job.appointmentTypeName} · {job.locationName}
        </h2>
      </div>

      {job.status === 'ESCALATED' && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This job has been escalated. Manual intervention is required to fill this slot.
            {job.escalationReason && <span className="block mt-1 text-xs">{job.escalationReason}</span>}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Job Details</CardTitle>
                <RecoveryStatusBadge status={job.status} />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Slot Time</p>
                <p className="font-medium">{formatDateTime(job.slotTime)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Slot Value</p>
                <p className="font-medium">{formatCurrency(job.price)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Candidates</p>
                <p className="font-medium">{job.candidates.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Call Attempts</p>
                <p className="font-medium">{job.totalAttempts}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Started</p>
                <p className="font-medium">{formatRelative(job.createdAt)}</p>
              </div>
              {job.completedAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Completed</p>
                  <p className="font-medium">{formatRelative(job.completedAt)}</p>
                </div>
              )}
              {job.winnerCustomerName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Winner</p>
                  <p className="font-medium text-green-600">{job.winnerCustomerName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {isFinished && completedAttempts.length > 0 && (
            <Card id="transcripts">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  Call Transcripts
                </CardTitle>
                {!hasTranscripts && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Call attempts were recorded, but no transcripts are available.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                {completedAttempts.map((attempt) => (
                  <CallAttemptItem
                    key={attempt.id}
                    attempt={attempt}
                    alwaysShowTranscript
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Ranked Candidates</CardTitle>
                {isActive && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => escalate.mutate({ id: id! })}
                    loading={escalate.isPending}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                    Escalate manually
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CandidateList candidates={job.candidates} currentIndex={job.currentCandidateIndex} />
            </CardContent>
          </Card>

          {!isFinished && callAttempts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Call Attempts</CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {callAttempts.map((attempt) => (
                  <CallAttemptItem key={attempt.id} attempt={attempt} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <RecoveryTimeline job={job} />
        </div>
      </div>
    </div>
  );
}
