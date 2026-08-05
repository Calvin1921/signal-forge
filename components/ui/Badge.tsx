"use client";

import { type HTMLAttributes, forwardRef } from "react";

type BadgeSentiment = "profit" | "loss" | "warning" | "accent" | "neutral";
type BadgeSize = "sm" | "md";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  sentiment?: BadgeSentiment;
  size?: BadgeSize;
};

const sentimentStyles: Record<BadgeSentiment, { bg: string; color: string }> = {
  profit: { bg: "oklch(72% 0.17 155 / 0.15)", color: "var(--semantic-profit)" },
  loss: { bg: "oklch(65% 0.2 25 / 0.15)", color: "var(--semantic-loss)" },
  warning: { bg: "oklch(78% 0.15 80 / 0.15)", color: "var(--semantic-warning)" },
  accent: { bg: "oklch(75% 0.15 200 / 0.15)", color: "var(--accent-primary)" },
  neutral: { bg: "var(--surface-3)", color: "var(--text-secondary)" },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className = "", sentiment = "neutral", size = "md", ...props }, ref) => {
    const styles = sentimentStyles[sentiment];
    return (
      <span
        ref={ref}
        className={[
          "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] font-medium",
          sizeClasses[size],
          className,
        ].join(" ")}
        style={{ background: styles.bg, color: styles.color }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, type BadgeSentiment };
