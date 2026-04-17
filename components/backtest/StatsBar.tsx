"use client";

import { StatCell } from "@/components/ui/StatCell";
import { HealthPill } from "@/components/HealthPill";
import { SHARPE_MIN_TRADES, type BacktestStats } from "@/lib/compute-stats";

interface StatsBarProps {
  stats: BacktestStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const insufficientSample = stats.sharpe === null;
  const sharpeDisplay = insufficientSample ? "—" : stats.sharpe!.toFixed(2);

  return (
    <div className="glass flex flex-wrap items-center gap-6 py-4 px-5 rounded-[var(--radius-md)]">
      <StatCell
        label="Total Return"
        value={`${stats.totalReturn > 0 ? "+" : ""}${stats.totalReturn}%`}
        sentiment={stats.totalReturn >= 0 ? "profit" : "loss"}
        valueClassName="text-title-1"
      />
      <StatCell
        label="Win Rate"
        value={`${stats.winRate}%`}
      />
      <StatCell
        label="Sharpe"
        value={sharpeDisplay}
      />
      <StatCell
        label="Max DD"
        value={`${stats.maxDrawdown}%`}
        sentiment="loss"
      />
      <StatCell
        label="P.Factor"
        value={stats.profitFactor.toFixed(2)}
      />
      <StatCell
        label="Trades"
        value={stats.totalTrades.toString()}
      />
      <div className="ml-auto flex items-center gap-3">
        {insufficientSample && (
          <span
            className="text-caption-1 text-muted italic"
            title={`Sharpe requires at least ${SHARPE_MIN_TRADES} trades to be meaningful`}
          >
            Need <span className="font-mono-data not-italic">{SHARPE_MIN_TRADES}+</span> trades
          </span>
        )}
        <HealthPill health={stats.health} />
      </div>
    </div>
  );
}
