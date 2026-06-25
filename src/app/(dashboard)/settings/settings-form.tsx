"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Store, Refrigerator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateSettings } from "./actions";

export function SettingsForm({
  shopName: initialShop,
  fridgeCapacity: initialCap,
}: {
  shopName: string;
  fridgeCapacity: number;
}) {
  const [shopName, setShopName] = useState(initialShop);
  const [capacity, setCapacity] = useState(String(initialCap));
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const res = await updateSettings({
        shopName,
        fridgeCapacity: Number(capacity),
      });
      if (res.ok) toast.success("Settings saved");
      else toast.error(res.error ?? "Could not save");
    });
  }

  return (
    <Card className="max-w-xl rounded-2xl">
      <CardHeader>
        <CardTitle>Shop settings</CardTitle>
        <CardDescription>
          These power your dashboard heading and the smart order planner.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shop" className="flex items-center gap-2">
            <Store className="size-4 text-primary" /> Shop name
          </Label>
          <Input
            id="shop"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="My Shop"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cap" className="flex items-center gap-2">
            <Refrigerator className="size-4 text-primary" /> Total fridge capacity
            (boxes)
          </Label>
          <Input
            id="cap"
            type="number"
            min="1"
            inputMode="numeric"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="100"
            className="h-12 rounded-xl"
          />
          <p className="text-xs text-muted-foreground">
            The order planner never suggests more than this many boxes total.
          </p>
        </div>
        <Button
          onClick={submit}
          disabled={pending}
          className="h-12 w-full rounded-xl text-base font-semibold sm:w-auto"
        >
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
