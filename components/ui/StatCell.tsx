"use client";

import { MonospaceValue } from "./MonospaceValue";

type Sentiment = "profit" | "loss" | "warning" | "neutral";

interface StatCellProps {
  label: string;
  value: string;
  sentiment?: Sentiment;
  valueClassName?: string;
}

export function StatCell({ label, value, sentiment = "neutral", valueClassName = "text-title-2" }: StatCellProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-footnote text-secondary">{label}</span>
      <MonospaceValue value={value} sentiment={sentiment} className={valueClassName} />
    </div>
  );
}
