"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

export function MonthPicker({ month }: { month: string }) {
  const router = useRouter();
  return (
    <Input
      type="month"
      value={month}
      onChange={(e) => {
        const v = e.target.value;
        if (v) router.push(`/reports?month=${v}`);
      }}
      className="h-11 w-44 rounded-xl"
    />
  );
}
