import { format, parseISO } from "date-fns";

export function formatCurrency(value: number, currency = "INR"): string {
  const safe = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(safe);
  } catch {
    return `₹${Math.round(safe).toLocaleString("en-IN")}`;
  }
}

export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("en-IN");
}

/**
 * Serializable format kinds — pass these (not functions) from Server
 * Components to Client Components like AnimatedNumber / MetricCard.
 */
export type FormatKind =
  | "currency"
  | "number"
  | "decimal1"
  | "percent"
  | "piecesDecimal";

export function formatBy(kind: FormatKind, value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  switch (kind) {
    case "currency":
      return formatCurrency(safe);
    case "decimal1":
      return safe.toFixed(1);
    case "percent":
      return `${Math.round(safe)}%`;
    case "piecesDecimal":
      return `${safe.toFixed(1)} pcs`;
    case "number":
    default:
      return Math.round(safe).toLocaleString("en-IN");
  }
}

/** YYYY-MM-DD in the user's local timezone (default for all date inputs). */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDate(iso: string, pattern = "dd MMM yyyy"): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function monthLabel(iso: string): string {
  try {
    return format(parseISO(`${iso}-01`), "MMM yyyy");
  } catch {
    return iso;
  }
}

/** Current month as YYYY-MM. */
export function currentMonth(): string {
  return format(new Date(), "yyyy-MM");
}
