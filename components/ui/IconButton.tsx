"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type IconButtonSize = "sm" | "md" | "lg";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: IconButtonSize;
  active?: boolean;
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-11 h-11",
};

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, className = "", size = "md", active = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={[
          "flex items-center justify-center",
          "rounded-[var(--radius-sm)]",
          "hover:bg-surface-3 focus-ring transition-fast",
          active ? "text-accent" : "text-secondary hover:text-primary",
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export { IconButton };
