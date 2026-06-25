"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ItemOption {
  id: string;
  name: string;
  piecesPerBox: number;
  sellingPrice?: number;
}

export function ItemSelect({
  items,
  value,
  onChange,
  placeholder = "Select item",
}: {
  items: ItemOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-12 w-full rounded-xl">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.name}{" "}
            <span className="text-muted-foreground">
              ({item.piecesPerBox}/box)
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
