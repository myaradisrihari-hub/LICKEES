import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/animated-number";
import { StaggerItem } from "@/components/motion";
import { type FormatKind } from "@/lib/format";

export type MetricColor =
  | "emerald"
  | "lime"
  | "pink"
  | "violet"
  | "sky"
  | "amber"
  | "rose"
  | "cyan";

const colorMap: Record<
  MetricColor,
  { glow: string; icon: string; value: string; bar: string }
> = {
  emerald: {
    glow: "from-emerald-200/70",
    icon: "bg-emerald-500/15 text-emerald-600",
    value: "text-emerald-700",
    bar: "from-emerald-400 to-teal-400",
  },
  lime: {
    glow: "from-lime-200/70",
    icon: "bg-lime-500/15 text-lime-600",
    value: "text-lime-700",
    bar: "from-lime-400 to-green-400",
  },
  pink: {
    glow: "from-pink-200/70",
    icon: "bg-pink-500/15 text-pink-600",
    value: "text-pink-700",
    bar: "from-pink-400 to-rose-400",
  },
  violet: {
    glow: "from-violet-200/70",
    icon: "bg-violet-500/15 text-violet-600",
    value: "text-violet-700",
    bar: "from-violet-400 to-purple-400",
  },
  sky: {
    glow: "from-sky-200/70",
    icon: "bg-sky-500/15 text-sky-600",
    value: "text-sky-700",
    bar: "from-sky-400 to-cyan-400",
  },
  amber: {
    glow: "from-amber-200/70",
    icon: "bg-amber-500/15 text-amber-600",
    value: "text-amber-700",
    bar: "from-amber-400 to-yellow-400",
  },
  rose: {
    glow: "from-rose-200/70",
    icon: "bg-rose-500/15 text-rose-600",
    value: "text-rose-700",
    bar: "from-rose-400 to-red-400",
  },
  cyan: {
    glow: "from-cyan-200/70",
    icon: "bg-cyan-500/15 text-cyan-600",
    value: "text-cyan-700",
    bar: "from-cyan-400 to-sky-400",
  },
};

export function MetricCard({
  label,
  value,
  format,
  icon: Icon,
  color = "emerald",
  hint,
  text,
}: {
  label: string;
  value?: number;
  format?: FormatKind;
  icon: LucideIcon;
  color?: MetricColor;
  hint?: string;
  /** Use when the metric is a label/string rather than an animated number. */
  text?: string;
}) {
  const c = colorMap[color];
  return (
    <StaggerItem className="group relative overflow-hidden rounded-3xl glass p-5 shadow-soft">
      {/* colored glow */}
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-70",
          c.glow,
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-medium text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-1.5 text-3xl font-bold tracking-tight tabular-nums sm:text-[2rem]",
              c.value,
            )}
          >
            {text !== undefined ? (
              <span className="break-words">{text}</span>
            ) : (
              <AnimatedNumber value={value ?? 0} format={format} />
            )}
          </p>
          {hint && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm",
            c.icon,
          )}
        >
          <Icon className="size-7" />
        </div>
      </div>
      <div
        className={cn(
          "mt-4 h-1 w-full rounded-full bg-gradient-to-r opacity-80",
          c.bar,
        )}
      />
    </StaggerItem>
  );
}
