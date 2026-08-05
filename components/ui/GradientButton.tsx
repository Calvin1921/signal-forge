"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type GradientButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-subhead min-h-[44px]",
  md: "px-5 py-2.5 text-subhead min-h-[44px]",
  lg: "px-6 py-3 text-callout min-h-[44px]",
};

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ children, className = "", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={[
          "relative inline-flex items-center justify-center gap-2",
          "font-medium text-primary",
          "rounded-[var(--radius-sm)]",
          "cursor-pointer focus-ring",
          "hover:brightness-110 hover:translate-y-[-1px]",
          "active:scale-[0.97] active:brightness-95",
          "disabled:opacity-40 disabled:pointer-events-none",
          sizeClasses[size],
          className,
        ].join(" ")}
        style={{
          background: disabled
            ? "var(--surface-3)"
            : "var(--gradient-cta)",
          border: disabled ? "none" : "1px solid oklch(80% 0.12 200 / 0.3)",
          transitionProperty: "transform, filter, box-shadow",
          transitionDuration: "var(--duration-normal)",
          transitionTimingFunction: "var(--ease-spring)",
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GradientButton.displayName = "GradientButton";

export { GradientButton };
