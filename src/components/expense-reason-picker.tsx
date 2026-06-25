"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const EXPENSE_REASONS = [
  "Sugarcane Purchase",
  "glasses",
  "lemon/ginger",
  "bottles",
  "Rent",
  "Electricity",
] as const;

const OTHERS = "Others";
const OTHERS_VALUE = "__others__";

export function ExpenseReasonPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const isPreset = (EXPENSE_REASONS as readonly string[]).includes(value);
  // "Others" mode is active when a non-empty custom value is set, or the user
  // explicitly picked the Others option.
  const [othersOpen, setOthersOpen] = useState(value !== "" && !isPreset);

  const showCustom = othersOpen || (value !== "" && !isPreset);
  const selectValue = showCustom ? OTHERS_VALUE : isPreset ? value : "";

  function handleSelect(next: string) {
    if (next === OTHERS_VALUE) {
      setOthersOpen(true);
      if (isPreset) onChange("");
    } else {
      setOthersOpen(false);
      onChange(next);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Select value={selectValue} onValueChange={handleSelect}>
        <SelectTrigger className="h-12 w-full rounded-xl">
          <SelectValue placeholder="Select reason" />
        </SelectTrigger>
        <SelectContent>
          {EXPENSE_REASONS.map((reason) => (
            <SelectItem key={reason} value={reason}>
              {reason}
            </SelectItem>
          ))}
          <SelectItem value={OTHERS_VALUE}>{OTHERS}</SelectItem>
        </SelectContent>
      </Select>
      {showCustom && (
        <Input
          autoFocus
          placeholder="Enter reason"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 rounded-xl"
        />
      )}
    </div>
  );
}
