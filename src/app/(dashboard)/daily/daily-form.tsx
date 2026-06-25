"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Wallet, Smartphone, Receipt, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { todayISO, formatCurrency } from "@/lib/format";
import { saveDailyEntry, type ExpenseInput } from "./actions";
import { ExpenseReasonPicker } from "@/components/expense-reason-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExpenseRow extends ExpenseInput {
  key: string;
}

function newRow(): ExpenseRow {
  return { key: crypto.randomUUID(), amount: 0, reason: "" };
}

interface DayData {
  cash: string;
  online: string;
  note: string;
  expenses: { amount: number; reason: string }[];
}

export function DailyForm() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Default to today only on first render; the selected date is preserved
  // afterwards and never auto-reset.
  const [date, setDate] = useState(todayISO());
  const [cash, setCash] = useState("");
  const [online, setOnline] = useState("");
  const [note, setNote] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([newRow()]);
  const [pending, startTransition] = useTransition();

  const { data, isFetching } = useQuery({
    queryKey: ["daily-entry", date],
    queryFn: async (): Promise<DayData> => {
      const [{ data: rev }, { data: exp }] = await Promise.all([
        supabase
          .from("daily_revenue")
          .select("*")
          .eq("entry_date", date)
          .maybeSingle(),
        supabase
          .from("expenses")
          .select("amount, reason")
          .eq("entry_date", date)
          .order("created_at", { ascending: true }),
      ]);
      return {
        cash: rev?.cash_revenue ? String(rev.cash_revenue) : "",
        online: rev?.online_revenue ? String(rev.online_revenue) : "",
        note: rev?.note ?? "",
        expenses: (exp ?? []).map((e) => ({
          amount: Number(e.amount),
          reason: e.reason,
        })),
      };
    },
  });

  // Seed local editable state once per date when its data arrives. A ref guards
  // against background refetches wiping out in-progress edits.
  const seededDate = useRef<string | null>(null);
  useEffect(() => {
    if (!data || seededDate.current === date) return;
    seededDate.current = date;
    setCash(data.cash);
    setOnline(data.online);
    setNote(data.note);
    setExpenses(
      data.expenses.length
        ? data.expenses.map((e) => ({ key: crypto.randomUUID(), ...e }))
        : [newRow()],
    );
  }, [data, date]);

  // Only show the loading skeleton the first time we touch a date we have no
  // cached data for — cached dates switch instantly.
  const showSkeleton = isFetching && data === undefined;

  const totalRevenue = (Number(cash) || 0) + (Number(online) || 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const profit = totalRevenue - totalExpenses;

  function updateExpense(key: string, patch: Partial<ExpenseRow>) {
    setExpenses((rows) =>
      rows.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveDailyEntry({
        date,
        cashRevenue: Number(cash) || 0,
        onlineRevenue: Number(online) || 0,
        note,
        expenses: expenses.map((e) => ({
          amount: Number(e.amount) || 0,
          reason: e.reason,
        })),
      });
      if (res.ok) {
        toast.success("Daily entry saved");
        // Refresh the cache for this date so re-opening shows saved values.
        seededDate.current = null;
        queryClient.invalidateQueries({ queryKey: ["daily-entry", date] });
      } else {
        toast.error(res.error ?? "Could not save entry");
      }
    });
  }

  return (
    <div className="grid gap-6 pb-44 lg:grid-cols-3 lg:pb-0">
      <div className="space-y-6 lg:col-span-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                max={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            {showSkeleton ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cash" className="flex items-center gap-2">
                    <Wallet className="size-4 text-primary" /> Cash revenue
                  </Label>
                  <Input
                    id="cash"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                    className="h-12 rounded-xl text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="online" className="flex items-center gap-2">
                    <Smartphone className="size-4 text-primary" /> Online revenue
                  </Label>
                  <Input
                    id="online"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={online}
                    onChange={(e) => setOnline(e.target.value)}
                    className="h-12 rounded-xl text-lg"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="size-5 text-primary" /> Expenses
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setExpenses((r) => [...r, newRow()])}
            >
              <Plus className="size-4" /> Add
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {expenses.map((row) => (
              <div
                key={row.key}
                className="space-y-3 rounded-xl border p-3"
              >
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={row.amount === 0 ? "" : row.amount}
                      onChange={(e) =>
                        updateExpense(row.key, {
                          amount: Number(e.target.value) || 0,
                        })
                      }
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 rounded-xl text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setExpenses((rows) =>
                        rows.length > 1
                          ? rows.filter((r) => r.key !== row.key)
                          : [newRow()],
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Reason</Label>
                  <ExpenseReasonPicker
                    value={row.reason}
                    onChange={(reason) => updateExpense(row.key, { reason })}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="size-5 text-primary" /> Notes
              <span className="text-sm font-normal text-muted-foreground">
                (optional)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything worth remembering about today…"
              rows={3}
              className="w-full rounded-xl border bg-transparent p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="rounded-2xl border-primary/20 lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total revenue</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total expenses</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(totalExpenses)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-lg">
              <span className="font-semibold">Profit</span>
              <span
                className={
                  profit >= 0
                    ? "font-bold text-emerald-600"
                    : "font-bold text-red-600"
                }
              >
                {formatCurrency(profit)}
              </span>
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={pending || showSkeleton}
              className="hidden h-12 w-full rounded-xl text-base font-semibold lg:inline-flex"
            >
              {pending ? "Saving…" : "Save entry"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Sticky save bar on mobile — sits above the bottom navigation */}
      <div className="fixed inset-x-0 bottom-[4.75rem] z-40 border-t border-white/40 glass-nav p-4 lg:hidden">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Profit</span>
          <span
            className={
              profit >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-600"
            }
          >
            {formatCurrency(profit)}
          </span>
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={pending || showSkeleton}
          className="h-12 w-full rounded-xl text-base font-semibold"
        >
          {pending ? "Saving…" : "Save entry"}
        </Button>
      </div>
    </div>
  );
}
