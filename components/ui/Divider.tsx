"use client";

interface DividerProps {
  direction?: "vertical" | "horizontal";
  className?: string;
}

export function Divider({ direction = "vertical", className = "" }: DividerProps) {
  return (
    <div
      className={className}
      style={{
        width: direction === "vertical" ? 1 : "100%",
        height: direction === "vertical" ? 24 : 1,
        background: "oklch(60% 0.005 260 / 0.15)",
        margin: direction === "vertical" ? "0 4px" : "4px 0",
        flexShrink: 0,
      }}
    />
  );
}
