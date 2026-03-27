"use client";

import { useEffect, useState } from "react";

export function XpCounter({
  value,
  prefix = "",
  suffix = ""
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const started = performance.now();
    const duration = 700;

    const tick = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - started) / duration);
      setDisplayValue(Math.round(value * progress));

      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
