import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { ActiveRecoveryFeed } from '@/components/dashboard/ActiveRecoveryFeed';
import { EscalationAlert } from '@/components/dashboard/EscalationAlert';
import { useAnalyticsOverview } from '@/hooks/useAnalytics';
import { useRecoveryJobs } from '@/hooks/useRecoveryJobs';
import { formatRelative, formatDateTime, getJobStatusColor } from '@/lib/utils';

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: allJobsData, isLoading: jobsLoading } = useRecoveryJobs();

  const allJobs = allJobsData?.data ?? [];
  const recentCompleted = allJobs
    .filter((j) => j.status === 'SUCCESS' || j.status === 'FAILED' || j.status === 'ESCALATED')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <MetricsBar data={overview} loading={overviewLoading} />
      <EscalationAlert jobs={allJobs} />
      <ActiveRecoveryFeed />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recently Completed</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/recovery-jobs">
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {jobsLoading ? (
            <div className="divide-y">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : recentCompleted.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No completed recovery jobs yet
            </div>
          ) : (
            <div className="divide-y">
              {recentCompleted.map((job) => (
                <Link
                  key={job.id}
                  to={`/recovery-jobs/${job.id}#transcripts`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {job.status === 'SUCCESS' ? (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm font-medium">
                        {job.appointmentTypeName} — {job.locationName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-5 mt-0.5">
                      {formatRelative(job.createdAt)} · {job.candidates.length} candidates ranked
                      {job.totalAttempts > 0 && (
                        <span className="inline-flex items-center gap-1 ml-1 text-primary/80">
                          · <MessageSquare className="h-3 w-3" /> View transcript
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant={getJobStatusColor(job.status) as any}>
                    {job.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
