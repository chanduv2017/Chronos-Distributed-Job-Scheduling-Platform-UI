import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/useApi";
import { listDLQ, retryDLQ, deleteDLQ } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  RotateCcw, Trash2, Loader2, CheckCircle2, AlertTriangle, Eye,
} from "lucide-react";

export default function DeadLetterQueue() {
  const [selectedEntry, setSelectedEntry] = useState<Record<string, any> | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDLQ = useCallback(() => listDLQ(), []);
  const { data, loading, error, refetch } = useApi(fetchDLQ, { refreshInterval: 15000 });

  const entries = ((data as Record<string, any>)?.data as Array<Record<string, any>>) || [];
  const total = ((data as Record<string, any>)?.meta as Record<string, any>)?.total || 0;

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      await retryDLQ(id);
      toast.success("Job requeued for retry");
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiscard = async (id: string) => {
    setActionLoading(id);
    try {
      await deleteDLQ(id);
      toast.info("DLQ entry discarded");
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Discard failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Dead Letter Queue</h1>
        <p className="mt-1 text-muted-foreground">
          Jobs that permanently failed after exhausting all retries — <span className="font-semibold text-foreground">{total}</span> entries
        </p>
      </div>

      {/* Table */}
      {loading && !data ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card className="flex h-60 flex-col items-center justify-center">
          <AlertTriangle className="mb-2 h-8 w-8 text-amber-500/60" />
          <p className="text-muted-foreground">Failed to load DLQ</p>
          <p className="mt-1 text-xs text-destructive">{error}</p>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="flex h-60 flex-col items-center justify-center gap-3">
          <CheckCircle2 className="h-10 w-10 text-emerald-500/40" />
          <p className="font-medium text-muted-foreground">No failed jobs</p>
          <p className="text-sm text-muted-foreground/60">All jobs are executing successfully. The dead letter queue is empty.</p>
        </Card>
      ) : (
        <Card className="border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Job Name</TableHead>
                <TableHead>Handler</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Failed At</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.job_name || "—"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{entry.handler_name}</TableCell>
                  <TableCell>
                    <Badge variant={entry.job_type === "cron" ? "purple" : entry.job_type === "delayed" ? "info" : "warning"} className="text-[10px]">
                      {(entry.job_type || "?").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{entry.retry_count}/{entry.max_retries}</TableCell>
                  <TableCell className="text-sm">{fmtDate(entry.failed_at)}</TableCell>
                  <TableCell>
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="group flex items-center gap-1 text-xs text-destructive transition-opacity hover:opacity-70"
                    >
                      <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="max-w-[180px] truncate">
                        {entry.error_message ? entry.error_message.substring(0, 50) + (entry.error_message.length > 50 ? "…" : "") : "—"}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell>
                    {entry.requeued_at ? (
                      <Badge variant="success" className="text-[10px]">Requeued</Badge>
                    ) : (
                      <Badge variant="error" className="text-[10px]">Dead</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!entry.requeued_at && (
                        <Button variant="success" size="sm" onClick={() => handleRetry(entry.id)} disabled={actionLoading === entry.id}>
                          {actionLoading === entry.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                          Retry
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDiscard(entry.id)} disabled={actionLoading === entry.id} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Error Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>Full error information for this failed job execution.</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="space-y-2">
                {[
                  { label: "Job", value: selectedEntry.job_name || selectedEntry.job_id },
                  { label: "Handler", value: selectedEntry.handler_name, mono: true },
                  { label: "Attempts", value: `${selectedEntry.retry_count} / ${selectedEntry.max_retries}` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={row.mono ? "font-mono text-xs" : "font-medium"}>{row.value}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Error Message</p>
                <pre className="max-h-[200px] overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs text-destructive">
                  {selectedEntry.error_message}
                </pre>
              </div>
              {selectedEntry.error_stack && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stack Trace</p>
                  <pre className="max-h-[250px] overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-[11px] text-muted-foreground">
                    {selectedEntry.error_stack}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}
