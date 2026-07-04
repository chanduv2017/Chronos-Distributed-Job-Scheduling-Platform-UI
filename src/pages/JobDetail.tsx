import { useCallback, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { getJob, getJobHistory, pauseJob, resumeJob, triggerJob, deleteJob } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Pause, Play, Zap, Trash2, Loader2, Calendar, Settings, Database, FileJson,
} from "lucide-react";

const TYPE_BADGE: Record<string, { variant: "purple" | "info" | "warning"; label: string }> = {
  cron: { variant: "purple", label: "CRON" },
  delayed: { variant: "info", label: "DELAYED" },
  immediate: { variant: "warning", label: "IMMEDIATE" },
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  const fetchJob = useCallback(() => getJob(id!), [id]);
  const fetchHistory = useCallback(() => getJobHistory(id!), [id]);
  const { data: jobData, loading, error, refetch } = useApi(fetchJob, { deps: [id] });
  const { data: histData } = useApi(fetchHistory, { deps: [id], refreshInterval: 10000 });

  const job = (jobData as Record<string, any>)?.data as Record<string, any> | undefined;
  const history = ((histData as Record<string, any>)?.data as Array<Record<string, any>>) || [];

  const handleAction = async (action: (id: string) => Promise<unknown>, label: string) => {
    try {
      await action(id!);
      toast.success(`Job ${label}`);
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteJob(id!);
      toast.success("Job deleted");
      navigate("/jobs");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading && !job) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h3 className="text-lg font-semibold text-muted-foreground">Job Not Found</h3>
        <p className="text-sm text-muted-foreground/70">{error || "This job does not exist."}</p>
        <Button variant="outline" asChild><Link to="/jobs"><ArrowLeft className="h-4 w-4" /> Back to Jobs</Link></Button>
      </div>
    );
  }

  const typeBadge = TYPE_BADGE[job.type] || { variant: "secondary" as const, label: job.type };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link to="/jobs" className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Jobs
        </Link>
        <div className="flex items-center gap-2">
          {job.status === "active" && (
            <Button variant="warning" size="sm" onClick={() => handleAction(pauseJob, "paused")}><Pause className="h-4 w-4" /> Pause</Button>
          )}
          {job.status === "paused" && (
            <Button variant="success" size="sm" onClick={() => handleAction(resumeJob, "resumed")}><Play className="h-4 w-4" /> Resume</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleAction(triggerJob, "triggered")}><Zap className="h-4 w-4" /> Trigger</Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}><Trash2 className="h-4 w-4" /> Delete</Button>
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{job.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          <StatusBadge status={job.status} />
          <Badge variant={typeBadge.variant} className="text-[10px]">{typeBadge.label}</Badge>
          <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">{job.id}</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
          <TabsTrigger value="payload">Payload</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {[
                  { label: "Type", value: job.type },
                  ...(job.cron_expression ? [{ label: "Cron", value: job.cron_expression, mono: true }] : []),
                  ...(job.scheduled_at ? [{ label: "Scheduled", value: new Date(job.scheduled_at).toLocaleString() }] : []),
                  { label: "Next Run", value: job.next_run_at ? new Date(job.next_run_at).toLocaleString() : "—" },
                  { label: "Last Run", value: job.last_run_at ? new Date(job.last_run_at).toLocaleString() : "Never" },
                  ...(job.timezone ? [{ label: "Timezone", value: job.timezone }] : []),
                ].map((row) => (
                  <DetailRow key={row.label} {...row} />
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Settings className="h-3.5 w-3.5" /> Execution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <DetailRow label="Handler" value={job.handler_name} mono />
                <DetailRow label="Retries" value={`${job.retry_count} / ${job.max_retries}`} />
                {job.locked_by && <DetailRow label="Locked By" value={job.locked_by} mono />}
                {job.last_error && (
                  <div className="border-b border-border/40 py-3 last:border-0">
                    <p className="text-xs text-muted-foreground">Last Error</p>
                    <p className="mt-1 text-xs text-destructive">{job.last_error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Database className="h-3.5 w-3.5" /> Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <DetailRow label="Created" value={new Date(job.created_at).toLocaleString()} />
                <DetailRow label="Updated" value={new Date(job.updated_at).toLocaleString()} />
                <DetailRow label="Idempotency Key" value={job.idempotency_key} mono />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          {history.length === 0 ? (
            <Card className="flex h-40 items-center justify-center">
              <p className="text-muted-foreground">No executions yet</p>
            </Card>
          ) : (
            <Card className="border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Status</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((exec) => (
                    <TableRow key={exec.id}>
                      <TableCell><StatusBadge status={exec.status} /></TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{exec.worker_id}</TableCell>
                      <TableCell>{exec.attempt}</TableCell>
                      <TableCell className="text-sm">{new Date(exec.started_at).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{exec.duration_ms != null ? `${exec.duration_ms}ms` : "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-destructive" title={exec.error_message || ""}>
                        {exec.error_message || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Payload Tab */}
        <TabsContent value="payload" className="mt-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <FileJson className="h-3.5 w-3.5" /> Job Payload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-auto rounded-lg bg-muted/50 p-4 font-mono text-sm text-primary">
                {JSON.stringify(job.payload, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Delete <strong>{job.name}</strong>? This removes the job and all its execution history permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "max-w-[60%] truncate text-right font-mono text-xs text-muted-foreground" : ""}`}>
        {value}
      </span>
    </div>
  );
}
