import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { listJobs, pauseJob, resumeJob, triggerJob, deleteJob } from "@/api/client";
import StatusBadge from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle, MoreHorizontal, Pause, Play, Zap, Trash2, Eye, Loader2, ClipboardList,
} from "lucide-react";

const TYPE_BADGE: Record<string, { variant: "purple" | "info" | "warning"; label: string }> = {
  cron: { variant: "purple", label: "CRON" },
  delayed: { variant: "info", label: "DELAYED" },
  immediate: { variant: "warning", label: "IMMEDIATE" },
};

export default function Jobs() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filters: Record<string, string> = {};
  if (statusFilter !== "all") filters.status = statusFilter;
  if (typeFilter !== "all") filters.type = typeFilter;

  const fetchJobs = useCallback(() => listJobs(filters), [statusFilter, typeFilter]);
  const { data, loading, error, refetch } = useApi(fetchJobs, {
    deps: [statusFilter, typeFilter],
    refreshInterval: 10000,
  });

  const handleAction = async (action: (id: string) => Promise<unknown>, id: string, label: string) => {
    setActionLoading(id);
    try {
      await action(id);
      toast.success(`Job ${label} successfully`);
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await handleAction(deleteJob, deleteTarget, "deleted");
    setDeleteTarget(null);
  };

  const jobs = ((data as Record<string, unknown>)?.data as Array<Record<string, any>>) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Jobs</h1>
          <p className="mt-1 text-muted-foreground">Manage all scheduled, delayed, and immediate jobs</p>
        </div>
        <Button asChild>
          <Link to="/jobs/new"><PlusCircle className="h-4 w-4" /> Create Job</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed_permanent">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="cron">Cron</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
            <SelectItem value="immediate">Immediate</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">{jobs.length} jobs</span>
      </div>

      {/* Table */}
      {loading && !data ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="flex h-60 flex-col items-center justify-center">
          <p className="text-muted-foreground">Failed to load jobs</p>
          <p className="mt-1 text-xs text-destructive">{error}</p>
        </Card>
      ) : jobs.length === 0 ? (
        <Card className="flex h-60 flex-col items-center justify-center gap-3">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-muted-foreground">No jobs found</p>
          <Button asChild size="sm"><Link to="/jobs/new"><PlusCircle className="h-4 w-4" /> Create your first job</Link></Button>
        </Card>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Handler</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const typeBadge = TYPE_BADGE[job.type] || { variant: "secondary" as const, label: job.type };
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Link to={`/jobs/${job.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                        {job.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeBadge.variant} className="text-[10px]">{typeBadge.label}</Badge>
                    </TableCell>
                    <TableCell><StatusBadge status={job.status} /></TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{job.handler_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {job.type === "cron" ? job.cron_expression : job.type === "delayed" ? fmtDate(job.scheduled_at) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{job.next_run_at ? fmtDate(job.next_run_at) : "—"}</TableCell>
                    <TableCell className="text-sm">{job.retry_count}/{job.max_retries}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actionLoading === job.id}>
                            {actionLoading === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/jobs/${job.id}`}><Eye className="h-4 w-4" /> View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {job.status === "active" && (
                            <DropdownMenuItem onClick={() => handleAction(pauseJob, job.id, "paused")}>
                              <Pause className="h-4 w-4" /> Pause
                            </DropdownMenuItem>
                          )}
                          {job.status === "paused" && (
                            <DropdownMenuItem onClick={() => handleAction(resumeJob, job.id, "resumed")}>
                              <Play className="h-4 w-4" /> Resume
                            </DropdownMenuItem>
                          )}
                          {(job.status === "active" || job.status === "paused") && (
                            <DropdownMenuItem onClick={() => handleAction(triggerJob, job.id, "triggered")}>
                              <Zap className="h-4 w-4" /> Trigger Now
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(job.id)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this job? This action cannot be undone. All execution history will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}
