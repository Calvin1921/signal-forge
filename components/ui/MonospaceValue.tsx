"use client";

import { type HTMLAttributes, forwardRef } from "react";

type Sentiment = "profit" | "loss" | "warning" | "neutral";

type MonospaceValueProps = HTMLAttributes<HTMLSpanElement> & {
  sentiment?: Sentiment;
  value: string | number;
  prefix?: string;
  suffix?: string;
};

const sentimentColor: Record<Sentiment, string> = {
  profit: "text-profit",
  loss: "text-loss",
  warning: "text-warning",
  neutral: "text-primary",
};

const MonospaceValue = forwardRef<HTMLSpanElement, MonospaceValueProps>(
  ({ sentiment = "neutral", value, prefix, suffix, className = "", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={[
          "font-mono-data tabular-nums tracking-tight",
          sentimentColor[sentiment],
          className,
        ].join(" ")}
        {...props}
      >
        {prefix}
        {value}
        {suffix}
      </span>
    );
  }
);

MonospaceValue.displayName = "MonospaceValue";

export { MonospaceValue };
