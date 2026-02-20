"use client";

import { formatINR, formatINRCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number;
  compact?: boolean;
  className?: string;
  showSign?: boolean;
}

export function CurrencyDisplay({ amount, compact = false, className, showSign }: CurrencyDisplayProps) {
  const formatted = compact ? formatINRCompact(amount) : formatINR(amount);
  const isNegative = amount < 0;

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        isNegative && "text-destructive",
        showSign && !isNegative && "text-emerald-600 dark:text-emerald-400",
        className
      )}
    >
      {showSign && !isNegative ? "+" : ""}
      {formatted}
    </span>
  );
}
