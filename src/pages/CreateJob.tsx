import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createCronJob, createDelayedJob, createImmediateJob } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RefreshCcw, Clock, Zap, Loader2 } from "lucide-react";

const JOB_TYPES = [
  { value: "cron", label: "Cron (Recurring)", icon: RefreshCcw, desc: "Runs on a schedule using cron expressions", color: "border-violet-500/30 hover:border-violet-500/60" },
  { value: "delayed", label: "Delayed (One-time)", icon: Clock, desc: "Runs once at a specific future time", color: "border-blue-500/30 hover:border-blue-500/60" },
  { value: "immediate", label: "Immediate", icon: Zap, desc: "Runs as soon as possible", color: "border-amber-500/30 hover:border-amber-500/60" },
] as const;

export default function CreateJob() {
  const navigate = useNavigate();
  const [type, setType] = useState<"cron" | "delayed" | "immediate">("cron");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", handlerName: "", cronExpression: "", scheduledAt: "", payload: "{}", maxRetries: "5", timezone: "UTC", idempotencyKey: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.handlerName.trim()) errs.handlerName = "Handler is required";
    if (type === "cron" && !form.cronExpression.trim()) errs.cronExpression = "Cron expression is required";
    if (type === "delayed") {
      if (!form.scheduledAt) errs.scheduledAt = "Time is required";
      else if (new Date(form.scheduledAt) <= new Date()) errs.scheduledAt = "Must be in the future";
    }
    try { JSON.parse(form.payload); } catch { errs.payload = "Invalid JSON"; }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = JSON.parse(form.payload);
      const base = {
        name: form.name.trim(),
        handlerName: form.handlerName.trim(),
        payload,
        maxRetries: parseInt(form.maxRetries),
        ...(form.idempotencyKey.trim() ? { idempotencyKey: form.idempotencyKey.trim() } : {}),
      };
      let result: Record<string, any>;
      if (type === "cron") {
        result = await createCronJob({ ...base, cronExpression: form.cronExpression.trim(), timezone: form.timezone });
      } else if (type === "delayed") {
        result = await createDelayedJob({ ...base, scheduledAt: new Date(form.scheduledAt).toISOString() });
      } else {
        result = await createImmediateJob(base);
      }
      toast.success(`Job "${form.name}" created!`);
      navigate(`/jobs/${(result as Record<string, any>).data.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight gradient-text">Create Job</h1>
        <p className="mt-1 text-muted-foreground">Schedule a new cron, delayed, or immediate job</p>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-3 gap-4">
        {JOB_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={cn(
              "group flex flex-col items-center gap-2 rounded-lg border bg-card p-5 text-center transition-all duration-200",
              t.color,
              type === t.value
                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20"
                : "hover:bg-muted/50"
            )}
          >
            <t.icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", type === t.value ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-sm font-semibold", type === t.value ? "text-foreground" : "text-muted-foreground")}>{t.label}</span>
            <span className="text-[11px] text-muted-foreground/70">{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <FormField label="Job Name *" error={errors.name}>
                <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Hourly Cleanup" />
              </FormField>
              <FormField label="Handler Name *" error={errors.handlerName} hint="Must match a registered handler on the backend">
                <Input value={form.handlerName} onChange={(e) => updateField("handlerName", e.target.value)} placeholder="e.g. db-cleanup" />
              </FormField>

              {type === "cron" && (
                <>
                  <FormField label="Cron Expression *" error={errors.cronExpression} hint="5-field: min hour dom month dow">
                    <Input value={form.cronExpression} onChange={(e) => updateField("cronExpression", e.target.value)} placeholder="*/5 * * * *" className="font-mono" />
                  </FormField>
                  <FormField label="Timezone">
                    <Input value={form.timezone} onChange={(e) => updateField("timezone", e.target.value)} placeholder="UTC" />
                  </FormField>
                </>
              )}

              {type === "delayed" && (
                <div className="col-span-2">
                  <FormField label="Scheduled At *" error={errors.scheduledAt}>
                    <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => updateField("scheduledAt", e.target.value)} />
                  </FormField>
                </div>
              )}

              <FormField label="Max Retries">
                <Input type="number" value={form.maxRetries} onChange={(e) => updateField("maxRetries", e.target.value)} min="0" max="20" />
              </FormField>
              <FormField label="Idempotency Key" hint="Optional — prevents duplicate creation">
                <Input value={form.idempotencyKey} onChange={(e) => updateField("idempotencyKey", e.target.value)} />
              </FormField>

              <div className="col-span-2">
                <FormField label="Payload (JSON)" error={errors.payload}>
                  <Textarea
                    value={form.payload}
                    onChange={(e) => updateField("payload", e.target.value)}
                    className="min-h-[120px] font-mono text-sm"
                    spellCheck={false}
                  />
                </FormField>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/jobs")}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : `Create ${type} job`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function FormField({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-[11px] text-muted-foreground/60">{hint}</p>}
    </div>
  );
}
