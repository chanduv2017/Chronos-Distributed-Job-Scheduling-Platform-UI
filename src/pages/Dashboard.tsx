import { useCallback } from "react";
import { useApi } from "@/hooks/useApi";
import { getHealthStatus } from "@/api/client";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardList, Zap, PauseCircle, XCircle, Skull, TrendingUp,
  Server, Clock, Radio, Puzzle, AlertTriangle, Loader2,
} from "lucide-react";

export default function Dashboard() {
  const fetchStatus = useCallback(() => getHealthStatus(), []);
  const { data, loading, error } = useApi(fetchStatus, { refreshInterval: 5000 });

  if (loading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-amber-500 opacity-60" />
        <h3 className="text-lg font-semibold text-muted-foreground">Connection Error</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground/70">
          Unable to reach the scheduler backend. Make sure it&apos;s running on port 3000.
        </p>
        <p className="mt-2 text-xs text-destructive">{error}</p>
      </div>
    );
  }

  const status = data as Record<string, any>;
  const jobs = (status.jobs || {}) as Record<string, number>;
  const recent = (status.recentExecutions || {}) as Record<string, number>;
  const totalJobs = Object.values(jobs).reduce((a, b) => a + b, 0);
  const totalRecent = Object.values(recent).reduce((a, b) => a + b, 0);
  const successRate = totalRecent > 0 ? Math.round(((recent.success || 0) / totalRecent) * 100) : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Real-time overview of your distributed job scheduler</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Jobs" value={totalJobs} icon={ClipboardList} color="indigo" />
        <StatCard label="Active" value={jobs.active || 0} icon={Zap} color="emerald" trend="Running on schedule" />
        <StatCard label="Paused" value={jobs.paused || 0} icon={PauseCircle} color="amber" />
        <StatCard label="Failed" value={jobs.failed_permanent || 0} icon={XCircle} color="rose" trend="Permanently failed" />
        <StatCard label="DLQ" value={status.dlq?.postgres || 0} icon={Skull} color="rose" trend={`${status.dlq?.redis || 0} in Redis`} />
        <StatCard
          label="Success Rate"
          value={`${successRate}%`}
          icon={TrendingUp}
          color={successRate >= 90 ? "emerald" : successRate >= 70 ? "amber" : "rose"}
          trend="Last 1 hour"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Executions (Last Hour) */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Clock className="h-4 w-4" />
              Executions (Last Hour)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(["success", "failed", "running", "dlq"] as const).map((s) => (
              <div key={s} className="flex items-center justify-between">
                <StatusBadge status={s} />
                <span className="text-lg font-bold">{recent[s] || 0}</span>
              </div>
            ))}
            {totalRecent > 0 && (
              <>
                <Separator />
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  {(recent.success || 0) > 0 && (
                    <div
                      className="bg-emerald-500 transition-all duration-700"
                      style={{ width: `${((recent.success || 0) / totalRecent) * 100}%` }}
                    />
                  )}
                  {(recent.failed || 0) > 0 && (
                    <div
                      className="bg-red-500 transition-all duration-700"
                      style={{ width: `${((recent.failed || 0) / totalRecent) * 100}%` }}
                    />
                  )}
                  {(recent.running || 0) > 0 && (
                    <div
                      className="bg-violet-500 transition-all duration-700"
                      style={{ width: `${((recent.running || 0) / totalRecent) * 100}%` }}
                    />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Server className="h-4 w-4" />
              System Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {[
              { label: "Worker ID", value: status.workerId, mono: true },
              { label: "Uptime", value: formatUptime(status.uptime) },
              { label: "Stream Pending", value: status.stream?.pending ?? 0 },
              { label: "Handlers", value: status.handlers?.length ?? 0 },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between border-b border-border/40 py-3 last:border-0">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-medium ${row.mono ? "max-w-[180px] truncate font-mono text-xs text-muted-foreground" : ""}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Registered Handlers */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Puzzle className="h-4 w-4" />
            Registered Handlers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {((status.handlers as Array<{ name: string; description?: string }>) || []).map((h) => (
              <div
                key={h.name}
                className="group rounded-lg border border-border/40 bg-muted/30 px-4 py-3 transition-all duration-200 hover:border-primary/30 hover:bg-primary/5"
              >
                <p className="font-mono text-sm font-semibold text-primary">{h.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{h.description || "No description"}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
