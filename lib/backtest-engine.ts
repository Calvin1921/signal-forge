/**
 * SignalForge Backtest Engine
 *
 * Takes a serialized strategy graph (nodes + edges) and OHLCV data,
 * resolves the graph topologically, and runs candle-by-candle simulation.
 */

import type { Node, Edge } from "@xyflow/react";
import type { OHLCVCandle, AssetId } from "./generate-ohlcv";
import { generateOHLCV } from "./generate-ohlcv";
import type { BacktestTrade } from "./compute-stats";
import { computeStats, type BacktestStats } from "./compute-stats";
import {
  computeSMA,
  computeEMA,
  computeRSI,
  computeMACD,
  computeBollingerBands,
  type MACDResult,
  type BollingerResult,
} from "./indicators";

// ── Graph Resolution ──

interface NodeData {
  label: string;
  category: string;
  icon: string;
  params: Record<string, unknown>;
}

/**
 * Topologically sort nodes by dependency order via edges.
 * Returns nodes ordered: data sources first, then indicators, conditions, actions, risk.
 */
function topoSort(nodes: Node[], edges: Edge[]): Node[] {
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const n of nodes) {
    adjList.set(n.id, []);
    inDegree.set(n.id, 0);
  }

  for (const e of edges) {
    adjList.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjList.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sorted.map((id) => nodeMap.get(id)!).filter(Boolean);
}

/**
 * Find upstream nodes connected to a given node via edges.
 */
function getUpstream(nodeId: string, edges: Edge[]): string[] {
  return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

// ── Backtest Runner ──

export interface BacktestResult {
  trades: BacktestTrade[];
  stats: BacktestStats;
  candles: OHLCVCandle[];
  indicatorData: {
    rsi?: (number | null)[];
    macd?: MACDResult;
    bollinger?: BollingerResult;
    ema?: (number | null)[];
    sma?: (number | null)[];
  };
}

export interface BacktestInput {
  nodes: Node[];
  edges: Edge[];
  strategyName: string;
  asset: AssetId;
  timeframe: string;
  initialCapital?: number;
}

/**
 * Run a backtest on the given strategy graph.
 *
 * The engine:
 * 1. Generates OHLCV data for the asset (deterministic based on strategy name)
 * 2. Resolves the graph topologically
 * 3. Computes indicators candle-by-candle
 * 4. Checks conditions and fires entries
 * 5. Applies stop-loss / take-profit risk management
 * 6. Returns trades, stats, and raw data for charting
 */
export function runBacktestEngine(input: BacktestInput): BacktestResult {
  const {
    nodes,
    edges,
    strategyName,
    asset,
    timeframe,
    initialCapital = 10000,
  } = input;

  // Generate deterministic OHLCV data
  const candles = generateOHLCV({
    asset,
    count: 500,
    timeframe,
    seedExtra: strategyName,
  });

  const closes = candles.map((c) => c.close);
  const sorted = topoSort(nodes, edges);

  // ── Phase 1: Identify graph components ──

  let dataNode: Node | null = null;
  const indicatorNodes: Node[] = [];
  const conditionNodes: Node[] = [];
  let entryNode: Node | null = null;
  let stopLossNode: Node | null = null;
  let takeProfitNode: Node | null = null;

  for (const node of sorted) {
    const data = node.data as unknown as NodeData;
    switch (data.category) {
      case "data":
        dataNode = node;
        break;
      case "indicator":
        indicatorNodes.push(node);
        break;
      case "condition":
        conditionNodes.push(node);
        break;
      case "action":
        if (
          data.label.toLowerCase().includes("entry") ||
          data.label.toLowerCase().includes("buy")
        ) {
          entryNode = node;
        }
        break;
      case "risk":
        if (data.label.toLowerCase().includes("stop")) {
          stopLossNode = node;
        } else if (data.label.toLowerCase().includes("profit")) {
          takeProfitNode = node;
        }
        break;
    }
  }

  // ── Phase 2: Compute indicators ──

  const indicatorData: BacktestResult["indicatorData"] = {};
  const indicatorValues = new Map<string, (number | null)[]>();

  for (const indNode of indicatorNodes) {
    const data = indNode.data as unknown as NodeData;
    const label = data.label.toUpperCase();
    const params = data.params;

    if (label.includes("RSI")) {
      const period = (params.period as number) ?? 14;
      const rsi = computeRSI(closes, period);
      indicatorData.rsi = rsi;
      indicatorValues.set(indNode.id, rsi);
    } else if (label.includes("MACD")) {
      const fast = (params.fast as number) ?? 12;
      const slow = (params.slow as number) ?? 26;
      const sig = (params.signal as number) ?? 9;
      const macd = computeMACD(closes, fast, slow, sig);
      indicatorData.macd = macd;
      // For condition checking, use the histogram
      indicatorValues.set(indNode.id, macd.histogram);
    } else if (label.includes("BOLLINGER") || label.includes("BOLL")) {
      const period = (params.period as number) ?? 20;
      const mult = (params.multiplier as number) ?? 2;
      const bb = computeBollingerBands(closes, period, mult);
      indicatorData.bollinger = bb;
      // For conditions, use distance from lower band as signal
      const distFromLower: (number | null)[] = closes.map((c, i) =>
        bb.lower[i] !== null ? c - bb.lower[i]! : null
      );
      indicatorValues.set(indNode.id, distFromLower);
    } else if (label.includes("EMA")) {
      const period = (params.period as number) ?? 20;
      const ema = computeEMA(closes, period);
      indicatorData.ema = ema;
      indicatorValues.set(indNode.id, ema);
    } else if (label.includes("SMA")) {
      const period = (params.period as number) ?? 20;
      const sma = computeSMA(closes, period);
      indicatorData.sma = sma;
      indicatorValues.set(indNode.id, sma);
    }
  }

  // ── Phase 3: Resolve conditions ──

  // Build a condition evaluator for each candle
  type ConditionFn = (candleIdx: number) => boolean;

  // Map from node ID to its built condition function
  const builtConditions = new Map<string, ConditionFn>();

  function buildSimpleCondition(condNode: Node): ConditionFn {
    const data = condNode.data as unknown as NodeData;
    const params = data.params;
    const label = data.label.toLowerCase();
    const upstream = getUpstream(condNode.id, edges);

    // Find which indicator this condition references
    const indicatorId = upstream.find((id) => indicatorValues.has(id));

    if (!indicatorId) {
      // No indicator connected -- use label parsing as fallback
      if (label.includes("rsi")) {
        const threshold = (params.value as number) ?? 30;
        const op = (params.operator as string) ?? "<";
        const rsi = indicatorData.rsi;
        if (!rsi) return () => false;
        return (i) => {
          const val = rsi[i];
          if (val === null) return false;
          return op === "<" ? val < threshold : val > threshold;
        };
      }
      return () => false;
    }

    const values = indicatorValues.get(indicatorId)!;

    // Check for cross conditions
    if (label.includes("cross")) {
      const crossAbove = label.includes("above");
      return (i) => {
        if (i < 1) return false;
        const curr = values[i];
        const prev = values[i - 1];
        if (curr === null || prev === null) return false;
        return crossAbove ? prev <= 0 && curr > 0 : prev >= 0 && curr < 0;
      };
    }

    // Threshold conditions
    const threshold = (params.value as number) ?? 30;
    const op = (params.operator as string) ?? "<";

    return (i) => {
      const val = values[i];
      if (val === null) return false;
      switch (op) {
        case "<":
          return val < threshold;
        case ">":
          return val > threshold;
        case "<=":
          return val <= threshold;
        case ">=":
          return val >= threshold;
        case "==":
          return Math.abs(val - threshold) < 0.01;
        default:
          return val < threshold;
      }
    };
  }

  function buildLogicGateCondition(condNode: Node): ConditionFn {
    const data = condNode.data as unknown as NodeData;
    const nodeType = (data as { nodeType?: string }).nodeType ?? data.label.toLowerCase();
    const isAnd = nodeType === "and-gate" || data.label.toUpperCase().includes("AND");

    // Find all upstream condition nodes that feed into this gate
    const upstreamIds = getUpstream(condNode.id, edges);
    const upstreamFns: ConditionFn[] = [];
    for (const uid of upstreamIds) {
      const fn = builtConditions.get(uid);
      if (fn) upstreamFns.push(fn);
    }

    if (upstreamFns.length === 0) return () => false;

    if (isAnd) {
      return (i) => upstreamFns.every((fn) => fn(i));
    } else {
      return (i) => upstreamFns.some((fn) => fn(i));
    }
  }

  // Topo-sort condition nodes so simple conditions are built before logic gates
  const conditionSorted = topoSort(conditionNodes, edges.filter(
    (e) => conditionNodes.some((n) => n.id === e.source) && conditionNodes.some((n) => n.id === e.target)
  ));
  // Include any condition nodes not in the topo sort (disconnected from other conditions)
  for (const cn of conditionNodes) {
    if (!conditionSorted.find((n) => n.id === cn.id)) {
      conditionSorted.push(cn);
    }
  }

  // Build conditions in topological order
  for (const condNode of conditionSorted) {
    const data = condNode.data as unknown as NodeData;
    const nodeType = (data as { nodeType?: string }).nodeType ?? "";
    const isLogicGate = nodeType === "and-gate" || nodeType === "or-gate";

    if (isLogicGate) {
      builtConditions.set(condNode.id, buildLogicGateCondition(condNode));
    } else {
      builtConditions.set(condNode.id, buildSimpleCondition(condNode));
    }
  }

  // The final conditions that gate trade entry are the ones that feed into the entry node
  // (or if no entry node, all terminal condition nodes)
  const conditions: ConditionFn[] = [];

  if (entryNode) {
    // Find condition nodes directly upstream of the entry node
    const entryUpstream = getUpstream(entryNode.id, edges);
    for (const uid of entryUpstream) {
      const fn = builtConditions.get(uid);
      if (fn) conditions.push(fn);
    }
  }

  // Fallback: if no conditions feed into entry, use all built conditions
  if (conditions.length === 0) {
    for (const fn of builtConditions.values()) {
      conditions.push(fn);
    }
  }

  // If no conditions found, create a simple RSI < 30 fallback based on indicator data
  if (conditions.length === 0 && indicatorData.rsi) {
    conditions.push((i) => {
      const val = indicatorData.rsi![i];
      return val !== null && val < 30;
    });
  }

  // ── Phase 4: Determine trade parameters ──

  const entrySide: "Long" | "Short" =
    entryNode && (entryNode.data as unknown as NodeData).params.side === "Short"
      ? "Short"
      : "Long";

  const stopLossPct = stopLossNode
    ? Math.abs((stopLossNode.data as unknown as NodeData).params.percent as number) / 100
    : 0.02; // default 2%

  const takeProfitPct = takeProfitNode
    ? Math.abs((takeProfitNode.data as unknown as NodeData).params.percent as number) / 100
    : 0.06; // default 6%

  // ── Phase 5: Simulate candle-by-candle ──

  const trades: BacktestTrade[] = [];
  let inPosition = false;
  let entryPrice = 0;
  let entryIdx = 0;
  let tradeId = 0;
  const cooldownBars = 3; // Minimum bars between trades
  let lastExitIdx = -cooldownBars;

  // Skip the warmup period (first 50 candles for indicators to stabilize)
  const warmup = 50;

  for (let i = warmup; i < candles.length; i++) {
    const candle = candles[i];

    if (inPosition) {
      // Check stop-loss and take-profit
      let exitPrice: number | null = null;
      let exitReason = "";

      if (entrySide === "Long") {
        const slPrice = entryPrice * (1 - stopLossPct);
        const tpPrice = entryPrice * (1 + takeProfitPct);

        if (candle.low <= slPrice) {
          exitPrice = slPrice;
          exitReason = "SL";
        } else if (candle.high >= tpPrice) {
          exitPrice = tpPrice;
          exitReason = "TP";
        }
      } else {
        const slPrice = entryPrice * (1 + stopLossPct);
        const tpPrice = entryPrice * (1 - takeProfitPct);

        if (candle.high >= slPrice) {
          exitPrice = slPrice;
          exitReason = "SL";
        } else if (candle.low <= tpPrice) {
          exitPrice = tpPrice;
          exitReason = "TP";
        }
      }

      // Also exit after 30 bars max hold
      if (!exitPrice && i - entryIdx >= 30) {
        exitPrice = candle.close;
        exitReason = "timeout";
      }

      if (exitPrice !== null) {
        const pnlRaw =
          entrySide === "Long"
            ? exitPrice - entryPrice
            : entryPrice - exitPrice;

        const positionSize = initialCapital * 0.05; // 5% per trade
        const units = positionSize / entryPrice;
        const pnl = pnlRaw * units;
        const pnlPercent = (pnlRaw / entryPrice) * 100;

        const riskPerUnit = entryPrice * stopLossPct;
        const rMultiple = pnlRaw / riskPerUnit;

        trades.push({
          id: `bt-${tradeId++}`,
          entryTime: candles[entryIdx].time,
          entryPrice,
          exitTime: candle.time,
          exitPrice,
          side: entrySide,
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number(pnlPercent.toFixed(2)),
          rMultiple: Number(rMultiple.toFixed(1)),
          holdBars: i - entryIdx,
          asset,
          strategy: strategyName,
        });

        inPosition = false;
        lastExitIdx = i;
      }
    } else {
      // Check entry conditions (all must be true)
      if (i - lastExitIdx >= cooldownBars && conditions.length > 0) {
        const allMet = conditions.every((cond) => cond(i));
        if (allMet) {
          inPosition = true;
          entryPrice = candle.close;
          entryIdx = i;
        }
      }
    }
  }

  // Close any open position at last candle
  if (inPosition) {
    const lastCandle = candles[candles.length - 1];
    const pnlRaw =
      entrySide === "Long"
        ? lastCandle.close - entryPrice
        : entryPrice - lastCandle.close;

    const positionSize = initialCapital * 0.05;
    const units = positionSize / entryPrice;
    const pnl = pnlRaw * units;
    const pnlPercent = (pnlRaw / entryPrice) * 100;
    const riskPerUnit = entryPrice * stopLossPct;
    const rMultiple = pnlRaw / riskPerUnit;

    trades.push({
      id: `bt-${tradeId++}`,
      entryTime: candles[entryIdx].time,
      entryPrice,
      exitTime: lastCandle.time,
      exitPrice: lastCandle.close,
      side: entrySide,
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      rMultiple: Number(rMultiple.toFixed(1)),
      holdBars: candles.length - 1 - entryIdx,
      asset,
      strategy: strategyName,
    });
  }

  const stats = computeStats(trades, initialCapital);

  return { trades, stats, candles, indicatorData };
}
