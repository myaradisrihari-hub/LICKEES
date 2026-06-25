"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { formatBy, type FormatKind } from "@/lib/format";

export function AnimatedNumber({
  value,
  format = "number",
  duration = 1.1,
}: {
  value: number;
  format?: FormatKind;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <>{formatBy(format, display)}</>;
}
