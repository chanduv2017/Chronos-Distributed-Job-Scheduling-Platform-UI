import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "indigo" | "emerald" | "amber" | "rose" | "blue" | "violet";
}

const colorMap = {
  indigo: {
    gradient: "from-indigo-500/20 to-indigo-600/5",
    border: "border-indigo-500/20",
    icon: "text-indigo-400 bg-indigo-500/10",
    bar: "from-indigo-500 to-violet-500",
  },
  emerald: {
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/20",
    icon: "text-emerald-400 bg-emerald-500/10",
    bar: "from-emerald-500 to-emerald-400",
  },
  amber: {
    gradient: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/20",
    icon: "text-amber-400 bg-amber-500/10",
    bar: "from-amber-500 to-amber-400",
  },
  rose: {
    gradient: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/20",
    icon: "text-rose-400 bg-rose-500/10",
    bar: "from-rose-500 to-rose-400",
  },
  blue: {
    gradient: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
    icon: "text-blue-400 bg-blue-500/10",
    bar: "from-blue-500 to-blue-400",
  },
  violet: {
    gradient: "from-violet-500/20 to-violet-600/5",
    border: "border-violet-500/20",
    icon: "text-violet-400 bg-violet-500/10",
    bar: "from-violet-500 to-violet-400",
  },
};

export default function StatCard({ label, value, icon: Icon, trend, color = "indigo" }: StatCardProps) {
  const c = colorMap[color];

  return (
    <Card className={cn("group relative overflow-hidden border transition-all duration-300 hover:shadow-lg hover:shadow-black/20", c.border)}>
      {/* Top accent bar */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", c.bar)} />

      {/* Subtle background gradient */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", c.gradient)} />

      <CardContent className="relative flex items-start gap-4 p-5">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", c.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-extrabold tracking-tight">{value ?? "—"}</p>
          {trend && <p className="mt-0.5 text-xs text-muted-foreground">{trend}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
