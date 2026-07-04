import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

const STATUS_MAP: Record<string, { label: string; variant: BadgeProps["variant"]; dot: string }> = {
  active: { label: "Active", variant: "success", dot: "bg-emerald-400" },
  paused: { label: "Paused", variant: "warning", dot: "bg-amber-400" },
  completed: { label: "Completed", variant: "info", dot: "bg-blue-400" },
  failed_permanent: { label: "Failed", variant: "error", dot: "bg-red-400" },
  running: { label: "Running", variant: "purple", dot: "bg-violet-400" },
  success: { label: "Success", variant: "success", dot: "bg-emerald-400" },
  failed: { label: "Failed", variant: "error", dot: "bg-red-400" },
  timeout: { label: "Timeout", variant: "warning", dot: "bg-amber-400" },
  dlq: { label: "DLQ", variant: "error", dot: "bg-red-400" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] || { label: status, variant: "secondary" as const, dot: "bg-zinc-400" };

  return (
    <Badge variant={config.variant} className="gap-1.5">
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dot} shadow-sm`} style={{ boxShadow: `0 0 6px currentColor` }} />
      {config.label}
    </Badge>
  );
}
