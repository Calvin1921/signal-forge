"use client";

import { Badge } from "@/components/ui/Badge";

interface RMultipleBadgeProps {
  value: number;
}

export function RMultipleBadge({ value }: RMultipleBadgeProps) {
  const isPositive = value >= 0;

  return (
    <Badge sentiment={isPositive ? "profit" : "loss"} size="sm" className="font-mono-data tabular-nums">
      {isPositive ? "+" : ""}
      {value.toFixed(1)}R
    </Badge>
  );
}
