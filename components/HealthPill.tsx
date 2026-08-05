"use client";

import type { HealthRating } from "@/lib/seed-data";
import { Badge, type BadgeSentiment } from "@/components/ui/Badge";
import { AlertTriangle } from "lucide-react";

const config: Record<HealthRating, { label: string; sentiment: BadgeSentiment; showWarning?: boolean }> = {
  "strong-edge": { label: "Strong Edge", sentiment: "profit" },
  "solid-edge": { label: "Solid Edge", sentiment: "accent" },
  marginal: { label: "Marginal", sentiment: "warning" },
  "no-edge": { label: "No Edge", sentiment: "loss" },
  "too-good": { label: "Too Good to Be True", sentiment: "warning", showWarning: true },
};

interface HealthPillProps {
  health: HealthRating;
  size?: "sm" | "md";
}

export function HealthPill({ health, size = "md" }: HealthPillProps) {
  const c = config[health];

  return (
    <Badge sentiment={c.sentiment} size={size}>
      {c.showWarning && <AlertTriangle size={size === "sm" ? 12 : 14} />}
      {c.label}
    </Badge>
  );
}
