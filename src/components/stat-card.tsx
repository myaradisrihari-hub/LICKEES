import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionCard } from "@/components/motion";

export type StatTone = "default" | "positive" | "negative" | "warning";

const toneStyles: Record<StatTone, { icon: string; value: string; glow: string }> = {
  default: {
    icon: "bg-sky-500/15 text-sky-600",
    value: "text-foreground",
    glow: "from-sky-200/60",
  },
  positive: {
    icon: "bg-emerald-500/15 text-emerald-600",
    value: "text-emerald-700",
    glow: "from-emerald-200/60",
  },
  negative: {
    icon: "bg-rose-500/15 text-rose-600",
    value: "text-rose-700",
    glow: "from-rose-200/60",
  },
  warning: {
    icon: "bg-amber-500/15 text-amber-600",
    value: "text-amber-700",
    glow: "from-amber-200/60",
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: StatTone;
}) {
  const styles = toneStyles[tone];
  return (
    <MotionCard className="group relative overflow-hidden rounded-3xl glass p-5 shadow-soft">
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br to-transparent opacity-70 blur-2xl",
          styles.glow,
        )}
      />
      <div className="relative flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
            styles.icon,
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-bold tracking-tight tabular-nums",
              styles.value,
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="truncate text-sm text-muted-foreground">{hint}</p>
          )}
        </div>
      </div>
    </MotionCard>
  );
}
