/**
 * Compute backtest statistics from a list of trades and equity curve.
 */

import type { HealthRating } from "@/lib/seed-data";

export interface BacktestTrade {
  id: string;
  entryTime: number; // unix timestamp
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  side: "Long" | "Short";
  pnl: number;
  pnlPercent: number;
  rMultiple: number;
  holdBars: number;
  asset: string;
  strategy: string;
}

export interface BacktestStats {
  totalReturn: number;
  totalReturnDollar: number;
  winRate: number;
  /** Annualized Sharpe ratio. `null` when the sample is too small to be meaningful. */
  sharpe: number | null;
  /** Annualized Sortino ratio. `null` when the sample is too small to be meaningful. */
  sortino: number | null;
  maxDrawdown: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number;
  totalTrades: number;
  health: HealthRating;
}

/**
 * Minimum number of trades required for a Sharpe/Sortino value to be reported.
 * Below this threshold we surface "Insufficient trades" instead — real quant
 * tools do this rather than showing a garbage single-digit-sample ratio.
 */
export const SHARPE_MIN_TRADES = 10;

const SECONDS_PER_YEAR = 365.25 * 86400;

/**
 * Compute comprehensive stats from a trade list.
 *
 * @param trades - Completed trades from backtest engine
 * @param initialCapital - Starting capital (default 10000)
 */
export function computeStats(
  trades: BacktestTrade[],
  initialCapital: number = 10000
): BacktestStats {
  if (trades.length === 0) {
    return {
      totalReturn: 0,
      totalReturnDollar: 0,
      winRate: 0,
      sharpe: null,
      sortino: null,
      maxDrawdown: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      expectancy: 0,
      totalTrades: 0,
      health: "no-edge",
    };
  }

  const winners = trades.filter((t) => t.pnl > 0);
  const losers = trades.filter((t) => t.pnl <= 0);

  const winRate = (winners.length / trades.length) * 100;

  const grossProfit = winners.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losers.reduce((sum, t) => sum + t.pnl, 0));

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

  const avgWin = winners.length > 0 ? grossProfit / winners.length : 0;
  const avgLoss = losers.length > 0 ? grossLoss / losers.length : 0;

  const expectancy =
    trades.length > 0
      ? trades.reduce((sum, t) => sum + t.rMultiple, 0) / trades.length
      : 0;

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const totalReturn = (totalPnl / initialCapital) * 100;

  // Build equity curve for drawdown and return-series computation
  const equity: number[] = [initialCapital];
  for (const trade of trades) {
    equity.push(equity[equity.length - 1] + trade.pnl);
  }

  // Max drawdown
  let peak = equity[0];
  let maxDd = 0;
  for (const val of equity) {
    if (val > peak) peak = val;
    const dd = ((val - peak) / peak) * 100;
    if (dd < maxDd) maxDd = dd;
  }

  // ── Sharpe / Sortino (trade-level returns, annualized by trade frequency) ──
  //
  // Rationale: we use per-trade returns (pnl / equity-at-entry) rather than
  // bucketing into calendar days. This is robust across timeframes (1m → 1D),
  // doesn't collapse when many trades exit on the same day, and doesn't explode
  // when trades are spaced days apart. Annualization scales by sqrt of
  // trades-per-year, measured from the trade-span of the backtest.
  //
  // We require SHARPE_MIN_TRADES samples before reporting a number — a
  // 3-trade "Sharpe" is meaningless and misleading.

  let sharpe: number | null = null;
  let sortino: number | null = null;

  if (trades.length >= SHARPE_MIN_TRADES) {
    const tradeReturns = computeTradeReturns(trades, initialCapital);
    const meanReturn =
      tradeReturns.reduce((s, r) => s + r, 0) / tradeReturns.length;

    const variance =
      tradeReturns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) /
      (tradeReturns.length - 1);
    const stdDev = Math.sqrt(variance);

    // Trades per year, derived from the span of this backtest.
    const firstExit = trades[0].exitTime;
    const lastExit = trades[trades.length - 1].exitTime;
    const spanSeconds = Math.max(1, lastExit - firstExit);
    const tradesPerYear = (trades.length * SECONDS_PER_YEAR) / spanSeconds;
    const annualization = Math.sqrt(tradesPerYear);

    // Floor stdDev so that a degenerate run (e.g. every trade stopped-out at
    // the same % loss) doesn't produce a ±7000 Sharpe.
    const STD_FLOOR = 1e-4; // 0.01% of equity
    if (stdDev > STD_FLOOR) {
      sharpe = (meanReturn / stdDev) * annualization;
    } else {
      // Flat return series — Sharpe is undefined. Report 0 rather than ∞.
      sharpe = 0;
    }

    const downsideReturns = tradeReturns.filter((r) => r < 0);
    if (downsideReturns.length > 0) {
      const downsideVariance =
        downsideReturns.reduce((s, r) => s + r ** 2, 0) /
        downsideReturns.length;
      const downsideDev = Math.sqrt(downsideVariance);
      sortino =
        downsideDev > STD_FLOOR
          ? (meanReturn / downsideDev) * annualization
          : 0;
    } else {
      sortino = meanReturn > 0 ? Number.POSITIVE_INFINITY : 0;
    }

    // Clamp to a sane reporting band. Anything outside ±10 is noise from
    // a small sample that slipped past SHARPE_MIN_TRADES; clamp rather than
    // show a bogus extreme value.
    if (sharpe !== null && Number.isFinite(sharpe)) {
      sharpe = clamp(sharpe, -10, 10);
    }
    if (sortino !== null && Number.isFinite(sortino)) {
      sortino = clamp(sortino, -10, 10);
    }
  }

  // Health classification — degrade gracefully when Sharpe is null.
  const health = classifyHealth(sharpe, winRate, profitFactor);

  return {
    totalReturn: Number(totalReturn.toFixed(2)),
    totalReturnDollar: Number(totalPnl.toFixed(2)),
    winRate: Number(winRate.toFixed(1)),
    sharpe: sharpe === null ? null : Number(sharpe.toFixed(2)),
    sortino: sortino === null ? null : Number(sortino.toFixed(2)),
    maxDrawdown: Number(maxDd.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    totalTrades: trades.length,
    health,
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/**
 * Compute per-trade returns as pnl / equity-at-entry. Walks the equity curve
 * so that later trades are normalized by the compounded equity, not just
 * initial capital.
 */
function computeTradeReturns(
  trades: BacktestTrade[],
  initialCapital: number
): number[] {
  const returns: number[] = [];
  let equity = initialCapital;
  for (const t of trades) {
    const ret = equity > 0 ? t.pnl / equity : 0;
    returns.push(ret);
    equity += t.pnl;
  }
  return returns;
}

export function classifyHealth(
  sharpe: number | null,
  winRate: number,
  profitFactor: number
): HealthRating {
  // Insufficient sample — default to no-edge; UI shows "Insufficient trades"
  // in place of a numeric Sharpe.
  if (sharpe === null) return "no-edge";
  if (sharpe > 3.0) return "too-good";
  if (sharpe >= 2.0 && winRate >= 55 && profitFactor >= 2.0) return "strong-edge";
  if (sharpe >= 1.2 && winRate >= 50 && profitFactor >= 1.5) return "solid-edge";
  if (sharpe >= 0.5) return "marginal";
  return "no-edge";
}
