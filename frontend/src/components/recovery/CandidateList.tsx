import { Phone, Clock, RotateCcw, Trophy, Signal } from 'lucide-react';
import { RecoveryStatusBadge } from './RecoveryStatusBadge';
import { formatRelative, formatPhone, getInitials } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import type { RecoveryCandidate } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  candidates: RecoveryCandidate[];
  currentIndex: number;
}

function ReachabilityPill({ score }: { score: number }) {
  const colour =
    score >= 70 ? 'bg-green-100 text-green-700 border-green-200' :
    score >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  'bg-red-100 text-red-700 border-red-200';
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-xs font-medium', colour)}>
          <Signal className="h-3 w-3" />
          {score}
        </div>
      </TooltipTrigger>
      <TooltipContent>Reachability score — how likely this patient is to answer the phone (0–100)</TooltipContent>
    </Tooltip>
  );
}

export function CandidateList({ candidates, currentIndex }: Props) {
  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Phone className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No candidates found for this slot</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {candidates.map((candidate, index) => {
          const isCurrent = index === currentIndex && candidate.status === 'CONTACTED';
          return (
            <div
              key={candidate.customerId}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                isCurrent ? 'border-blue-200 bg-blue-50' : 'bg-card',
                candidate.status === 'ACCEPTED' ? 'border-green-200 bg-green-50' : ''
              )}
            >
              {/* Rank badge — shows AI reason on hover */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    'flex h-7 w-7 shrink-0 cursor-default items-center justify-center rounded-full text-xs font-bold',
                    index === 0 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                  )}>
                    {index === 0 ? <Trophy className="h-3.5 w-3.5" /> : index + 1}
                  </div>
                </TooltipTrigger>
                {candidate.aiRankingReason && (
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-medium mb-0.5 text-muted-foreground">AI ranking reason</p>
                    <p className="text-xs">{candidate.aiRankingReason}</p>
                  </TooltipContent>
                )}
              </Tooltip>

              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(candidate.customerName)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{candidate.customerName}</p>
                <p className="text-xs text-muted-foreground">{formatPhone(candidate.customerPhone)}</p>
              </div>

              {/* Reachability score */}
              {candidate.reachabilityScore != null && (
                <ReachabilityPill score={candidate.reachabilityScore} />
              )}

              {/* Priority score */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-foreground">{candidate.score}</span>
                    <span className="text-xs text-muted-foreground">score</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>AI priority score — overall rank for this recovery job</TooltipContent>
              </Tooltip>

              {/* Retry count */}
              {candidate.retryCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <RotateCcw className="h-3 w-3" />
                  <span>{candidate.retryCount}</span>
                </div>
              )}

              {/* Status + last attempt */}
              <div className="flex flex-col items-end gap-1">
                <RecoveryStatusBadge status={candidate.status} />
                {candidate.lastAttemptAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelative(candidate.lastAttemptAt)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
