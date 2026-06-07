import { useState } from 'react';
import { Phone, CheckCircle, XCircle, Clock, VoicemailIcon, PhoneCall, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateTime, formatDuration, formatRelative } from '@/lib/utils';
import { RecoveryStatusBadge } from './RecoveryStatusBadge';
import { TranscriptView } from './TranscriptView';
import type { CallAttempt } from '@/types';

const OutcomeIcon = ({ outcome }: { outcome: CallAttempt['outcome'] }) => {
  switch (outcome) {
    case 'ACCEPTED': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'DECLINED': return <XCircle className="h-4 w-4 text-red-600" />;
    case 'NO_ANSWER': return <PhoneCall className="h-4 w-4 text-amber-600" />;
    case 'VOICEMAIL': return <VoicemailIcon className="h-4 w-4 text-purple-600" />;
    case 'CALLBACK_REQUESTED': return <Clock className="h-4 w-4 text-indigo-600" />;
    case 'FAILED': return <AlertCircle className="h-4 w-4 text-red-600" />;
    default: return <Phone className="h-4 w-4 text-muted-foreground" />;
  }
};

interface Props {
  attempt: CallAttempt;
  /** When true, transcript is expanded on first render (e.g. finished jobs). */
  defaultTranscriptOpen?: boolean;
  /** Hide the collapse toggle — always show transcript when present. */
  alwaysShowTranscript?: boolean;
}

export function CallAttemptItem({
  attempt,
  defaultTranscriptOpen = attempt.status === 'COMPLETED' && !!attempt.transcript,
  alwaysShowTranscript = false,
}: Props) {
  const hasTranscript = !!attempt.transcript?.trim();
  const [transcriptOpen, setTranscriptOpen] = useState(defaultTranscriptOpen || alwaysShowTranscript);
  const showTranscript = hasTranscript && (transcriptOpen || alwaysShowTranscript);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <OutcomeIcon outcome={attempt.outcome} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{attempt.customerName}</p>
            <span className="text-xs text-muted-foreground">Attempt #{attempt.attemptNumber}</span>
            {attempt.outcome && <RecoveryStatusBadge status={attempt.outcome} />}
          </div>

          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{formatDateTime(attempt.initiatedAt)}</span>
            {attempt.duration != null && attempt.duration > 0 && (
              <span>· Duration: {formatDuration(attempt.duration)}</span>
            )}
            {attempt.callbackScheduledAt && (
              <span className="text-indigo-600">· Callback: {formatRelative(attempt.callbackScheduledAt)}</span>
            )}
            {attempt.errorMessage && (
              <span className="text-red-600 truncate max-w-xs">· {attempt.errorMessage}</span>
            )}
          </div>
        </div>

        {hasTranscript && !alwaysShowTranscript && (
          <button
            type="button"
            onClick={() => setTranscriptOpen((o) => !o)}
            className="flex items-center gap-1 shrink-0 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {transcriptOpen ? (
              <>Hide transcript <ChevronUp className="h-3.5 w-3.5" /></>
            ) : (
              <>View transcript <ChevronDown className="h-3.5 w-3.5" /></>
            )}
          </button>
        )}
      </div>

      {showTranscript && (
        <div className="ml-11 mt-1">
          <TranscriptView transcript={attempt.transcript} />
        </div>
      )}

      {attempt.status === 'COMPLETED' && !hasTranscript && (
        <p className="ml-11 text-xs text-muted-foreground italic">No transcript recorded for this call.</p>
      )}
    </div>
  );
}
