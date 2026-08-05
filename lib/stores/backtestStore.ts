import { create } from "zustand";
import type { HealthRating } from "@/lib/seed-data";
import type { BacktestTrade, BacktestStats } from "@/lib/compute-stats";
import type { BacktestResult } from "@/lib/backtest-engine";
import { runBacktestEngine } from "@/lib/backtest-engine";
import type { AssetId } from "@/lib/generate-ohlcv";
import type { OHLCVCandle } from "@/lib/generate-ohlcv";
import { useCanvasStore } from "./canvasStore";

export type TradeFilter = "all" | "winners" | "losers";

interface BacktestState {
  // Results
  stats: BacktestStats | null;
  trades: BacktestTrade[];
  candles: OHLCVCandle[];
  indicatorData: BacktestResult["indicatorData"];
  hasRun: boolean;

  // UI state
  isRunning: boolean;
  error: string | null;

  // Sorting
  sortColumn: string;
  sortDirection: "asc" | "desc";

  // Filtering
  filter: TradeFilter;

  // Actions
  runBacktest: () => Promise<void>;
  setSortColumn: (col: string) => void;
  setFilter: (filter: TradeFilter) => void;
  reset: () => void;
}

function applySort(
  trades: BacktestTrade[],
  column: string,
  direction: "asc" | "desc"
): BacktestTrade[] {
  const sorted = [...trades];
  const dir = direction === "asc" ? 1 : -1;

  sorted.sort((a, b) => {
    switch (column) {
      case "time":
        return (a.exitTime - b.exitTime) * dir;
      case "pnl":
        return (a.pnl - b.pnl) * dir;
      case "rMultiple":
        return (a.rMultiple - b.rMultiple) * dir;
      case "duration":
        return (a.holdBars - b.holdBars) * dir;
      default:
        return 0;
    }
  });

  return sorted;
}

export const useBacktestStore = create<BacktestState>((set, get) => ({
  stats: null,
  trades: [],
  candles: [],
  indicatorData: {},
  hasRun: false,
  isRunning: false,
  error: null,
  sortColumn: "time",
  sortDirection: "desc",
  filter: "all",

  runBacktest: async () => {
    set({ isRunning: true, error: null });

    // Small delay so the UI shows the loading state before the synchronous computation blocks
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const { nodes, edges, strategyMeta } = useCanvasStore.getState();

      if (nodes.length === 0) {
        set({
          isRunning: false,
          error: "No nodes in strategy graph. Add at least a data source and indicator.",
          hasRun: true,
        });
        return;
      }

      const assetMap: Record<string, AssetId> = {
        "BTC/USDT": "BTC/USDT",
        "ETH/USDT": "ETH/USDT",
        SPY: "SPY",
        AAPL: "AAPL",
        "EUR/USD": "EUR/USD",
      };

      const asset: AssetId = assetMap[strategyMeta.asset] ?? "BTC/USDT";

      const result = runBacktestEngine({
        nodes,
        edges,
        strategyName: strategyMeta.name,
        asset,
        timeframe: strategyMeta.timeframe,
      });

      const { sortColumn, sortDirection } = get();

      set({
        stats: result.stats,
        trades: applySort(result.trades, sortColumn, sortDirection),
        candles: result.candles,
        indicatorData: result.indicatorData,
        isRunning: false,
        hasRun: true,
        error: null,
      });
    } catch (err) {
      set({
        isRunning: false,
        error: err instanceof Error ? err.message : "Backtest failed unexpectedly.",
        hasRun: true,
      });
    }
  },

  setSortColumn: (col) => {
    const { sortColumn, sortDirection, trades } = get();
    const newDirection =
      sortColumn === col ? (sortDirection === "asc" ? "desc" : "asc") : "desc";
    set({
      sortColumn: col,
      sortDirection: newDirection,
      trades: applySort(trades, col, newDirection),
    });
  },

  setFilter: (filter) => set({ filter }),

  reset: () =>
    set({
      stats: null,
      trades: [],
      candles: [],
      indicatorData: {},
      hasRun: false,
      isRunning: false,
      error: null,
    }),
}));

/**
 * Selector: get filtered trades based on current filter.
 */
export function useFilteredTrades() {
  const trades = useBacktestStore((s) => s.trades);
  const filter = useBacktestStore((s) => s.filter);

  switch (filter) {
    case "winners":
      return trades.filter((t) => t.pnl > 0);
    case "losers":
      return trades.filter((t) => t.pnl <= 0);
    default:
      return trades;
  }
}

/**
 * Selector: count of trades hidden by current filter.
 */
export function useHiddenTradeCount() {
  const total = useBacktestStore((s) => s.trades.length);
  const filter = useBacktestStore((s) => s.filter);
  const trades = useBacktestStore((s) => s.trades);

  if (filter === "all") return 0;
  const visible =
    filter === "winners"
      ? trades.filter((t) => t.pnl > 0).length
      : trades.filter((t) => t.pnl <= 0).length;
  return total - visible;
}
