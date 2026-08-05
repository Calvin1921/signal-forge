"use client";

import { type HTMLAttributes, forwardRef } from "react";

type SurfaceCardProps = HTMLAttributes<HTMLDivElement> & {
  level?: 1 | 2 | 3 | 4;
  hoverable?: boolean;
};

const glassLevels: Record<number, string> = {
  1: "oklch(17% 0.008 260 / 0.55)",
  2: "oklch(22% 0.010 260 / 0.55)",
  3: "oklch(27% 0.010 260 / 0.60)",
  4: "oklch(32% 0.010 260 / 0.65)",
};

const SurfaceCard = forwardRef<HTMLDivElement, SurfaceCardProps>(
  ({ children, className = "", level = 2, hoverable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          "glass rounded-[var(--radius-lg)] p-4 transition-fast",
          hoverable ? "hover:brightness-110" : "",
          className,
        ].join(" ")}
        style={{ background: glassLevels[level] }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SurfaceCard.displayName = "SurfaceCard";

export { SurfaceCard };
