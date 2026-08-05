"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, BarChart2 } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { TradeChart, RSIChart } from "./TradeChart";
import { StatsBar } from "./StatsBar";
import { TradeTable } from "./TradeTable";
import { useBacktestStore } from "@/lib/stores/backtestStore";
import { usePanelStore } from "@/lib/stores/panelStore";

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

function BacktestSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-4 animate-pulse">
      <div className="h-[300px] bg-surface-2 rounded-[var(--radius-md)]" />
      <div className="h-[120px] bg-surface-2 rounded-[var(--radius-md)]" />
      <div className="h-[72px] bg-surface-2 rounded-[var(--radius-md)]" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-8 bg-surface-2 rounded-[var(--radius-sm)]"
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-surface-2 flex items-center justify-center mb-4">
        <span className="text-title-2 text-muted">~</span>
      </div>
      <h4 className="text-subhead font-medium text-primary mb-1">
        No backtest results yet
      </h4>
      <p className="text-footnote text-secondary leading-relaxed">
        Click the Backtest button in the toolbar to run your strategy against
        the simulated market data.
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-surface-2 flex items-center justify-center mb-4">
        <AlertTriangle size={20} className="text-loss" />
      </div>
      <h4 className="text-subhead font-medium text-primary mb-1">
        Backtest failed
      </h4>
      <p className="text-footnote text-secondary leading-relaxed mb-4">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="text-footnote px-4 min-h-[44px] bg-surface-3 hover:bg-surface-4 rounded-[var(--radius-sm)] text-primary focus-ring transition-fast"
      >
        Retry
      </button>
    </div>
  );
}

export function BacktestPanel() {
  const stats = useBacktestStore((s) => s.stats);
  const isRunning = useBacktestStore((s) => s.isRunning);
  const hasRun = useBacktestStore((s) => s.hasRun);
  const error = useBacktestStore((s) => s.error);
  const candles = useBacktestStore((s) => s.candles);
  const indicatorData = useBacktestStore((s) => s.indicatorData);
  const runBacktest = useBacktestStore((s) => s.runBacktest);

  const { backtestPanelOpen, toggleBacktestPanel, closeBacktestPanel } =
    usePanelStore();

  const renderContent = () => {
    if (isRunning) return <BacktestSkeleton />;
    if (error) return <ErrorState message={error} onRetry={runBacktest} />;
    if (!hasRun || !stats) return <EmptyState />;

    return (
      <div className="p-4 flex flex-col gap-4">
        <TradeChart height={300} candles={candles} />
        {indicatorData.rsi && (
          <RSIChart
            height={120}
            rsiData={indicatorData.rsi}
            candles={candles}
          />
        )}

        <StatsBar stats={stats} />

        {stats.health === "too-good" && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-footnote"
            style={{
              background: "oklch(78% 0.15 80 / 0.1)",
              color: "var(--semantic-warning)",
            }}
          >
            <AlertTriangle size={14} />
            <span>
              Results with Sharpe &gt; 3.0 often indicate overfitting. Consider
              testing on different date ranges.
            </span>
          </div>
        )}

        <div>
          <h4 className="text-headline text-secondary mb-2">Trades</h4>
          <TradeTable />
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Expanded: floating right panel */}
      <AnimatePresence>
        {backtestPanelOpen && (
          <motion.div
            className="fixed right-4 top-20 z-40 flex flex-col rounded-[var(--radius-lg)] glass overflow-hidden"
            style={{
              maxHeight: "calc(100vh - 90px)",
              width: 480,
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 480, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={springTransition}
          >
            {/* Header */}
            <div
              className="panel-header flex items-center justify-between px-4 py-2.5 shrink-0"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-headline text-primary">Backtest Results</h3>
                {isRunning && (
                  <span className="text-caption-1 text-muted animate-pulse">
                    Computing...
                  </span>
                )}
              </div>
              <IconButton size="lg" onClick={closeBacktestPanel}>
                <X size={16} />
              </IconButton>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">{renderContent()}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
