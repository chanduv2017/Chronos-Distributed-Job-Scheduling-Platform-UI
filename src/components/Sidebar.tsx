import { NavLink } from "react-router-dom";
import { LayoutDashboard, Zap, PlusCircle, Skull, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/jobs", label: "Jobs", icon: Zap },
  { path: "/jobs/new", label: "Create Job", icon: PlusCircle },
  { path: "/dlq", label: "Dead Letter Queue", icon: Skull },
];

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight">JobScheduler</h1>
          <p className="text-[11px] text-muted-foreground">Distributed Engine</p>
        </div>
      </div>

      <Separator className="opacity-50" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Navigation
        </p>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <item.icon
              className={cn(
                "h-4 w-4 transition-transform duration-200 group-hover:scale-110"
              )}
            />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Separator className="opacity-50" />

      {/* Footer */}
      <div className="flex items-center gap-2 px-6 py-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs text-muted-foreground">System Online</span>
      </div>
    </aside>
  );
}
