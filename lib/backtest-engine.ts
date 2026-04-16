/**
 * SignalForge Backtest Engine v2
 *
 * Takes a serialized strategy graph (nodes + edges) and OHLCV data,
 * resolves the graph topologically, and runs candle-by-candle simulation.
 *
 * v2 changes:
 * - Indicator registry keyed by node ID (multiple instances of same indicator type)
 * - 2-input condition resolution (indicator vs indicator)
 * - Dynamic warmup based on largest indicator period
 * - Dynamic candle count
 * - Trailing stop support
 * - ATR-based stops
 * - In-range condition
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
  computeATR,
  computeStochastic,
  computeADX,
  computeROC,
  computeVWAP,
  computeDonchian,
  computeBBBandwidth,
  computePivotPoints,
  computeSwingHL,
  detectCandlePattern,
  type MACDResult,
  type BollingerResult,
} from "./indicators";

// ── Graph Resolution ──

interface NodeData {
  label: string;
  category: string;
  icon: string;
  nodeType?: string;
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
  indicatorRegistry: Record<string, (number | null)[]>;
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
 * 5. Applies stop-loss / take-profit / trailing stop risk management
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

  const sorted = topoSort(nodes, edges);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // ── Phase 1: Identify graph components ──

  let dataNode: Node | null = null;
  const indicatorNodes: Node[] = [];
  const conditionNodes: Node[] = [];
  let entryNode: Node | null = null;
  let stopLossNode: Node | null = null;
  let takeProfitNode: Node | null = null;
  let trailingStopNode: Node | null = null;

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
        if (data.nodeType === "trailing-stop" || data.label.toLowerCase().includes("trailing")) {
          trailingStopNode = node;
        } else if (data.label.toLowerCase().includes("stop")) {
          stopLossNode = node;
        } else if (data.label.toLowerCase().includes("profit")) {
          takeProfitNode = node;
        }
        break;
    }
  }

  // ── Dynamic warmup & candle count ──

  const maxPeriod = Math.max(
    50,
    ...indicatorNodes.map((n) => {
      const p = (n.data as unknown as NodeData).params;
      return Math.max(
        (p.period as number) ?? 0,
        (p.slow as number) ?? 0,
        (p.kPeriod as number) ?? 0,
      );
    }),
  );
  const warmup = maxPeriod + 10;
  const requiredCount = Math.max(500, warmup + 400);

  // Generate deterministic OHLCV data
  const candles = generateOHLCV({
    asset,
    count: requiredCount,
    timeframe,
    seedExtra: strategyName,
  });

  const closes = candles.map((c) => c.close);

  // ── Phase 2: Compute indicators (node-ID-keyed registry) ──

  const indicatorData: BacktestResult["indicatorData"] = {};
  const indicatorRegistry = new Map<string, (number | null)[]>();

  // Cache for ATR computation (used by ATR-based stops)
  let cachedATR: (number | null)[] | null = null;

  function getATR(period: number = 14): (number | null)[] {
    if (!cachedATR) {
      cachedATR = computeATR(candles, period);
    }
    return cachedATR;
  }

  for (const indNode of indicatorNodes) {
    const data = indNode.data as unknown as NodeData;
    const label = data.label.toUpperCase();
    const params = data.params;
    const nodeType = data.nodeType ?? "";

    if (nodeType === "rsi" || label.includes("RSI")) {
      const period = (params.period as number) ?? 14;
      const rsi = computeRSI(closes, period);
      indicatorData.rsi = rsi;
      indicatorRegistry.set(indNode.id, rsi);
    } else if (nodeType === "macd" || label.includes("MACD")) {
      const fast = (params.fast as number) ?? 12;
      const slow = (params.slow as number) ?? 26;
      const sig = (params.signal as number) ?? 9;
      const macd = computeMACD(closes, fast, slow, sig);
      indicatorData.macd = macd;
      // Default channel = histogram (backward compat)
      indicatorRegistry.set(indNode.id, macd.histogram);
      indicatorRegistry.set(`${indNode.id}:macd`, macd.macd);
      indicatorRegistry.set(`${indNode.id}:signal`, macd.signal);
      indicatorRegistry.set(`${indNode.id}:histogram`, macd.histogram);
    } else if (nodeType === "bollinger" || label.includes("BOLLINGER") || label.includes("BOLL")) {
      const period = (params.period as number) ?? 20;
      const mult = (params.multiplier as number) ?? 2;
      const bb = computeBollingerBands(closes, period, mult);
      indicatorData.bollinger = bb;
      // Default channel = middle
      indicatorRegistry.set(indNode.id, bb.middle);
      indicatorRegistry.set(`${indNode.id}:upper`, bb.upper);
      indicatorRegistry.set(`${indNode.id}:middle`, bb.middle);
      indicatorRegistry.set(`${indNode.id}:lower`, bb.lower);
    } else if (nodeType === "ema" || label.includes("EMA")) {
      const period = (params.period as number) ?? 20;
      const ema = computeEMA(closes, period);
      indicatorData.ema = ema;
      indicatorRegistry.set(indNode.id, ema);
    } else if (nodeType === "sma" || label.includes("SMA")) {
      const period = (params.period as number) ?? 20;
      const sma = computeSMA(closes, period);
      indicatorData.sma = sma;
      indicatorRegistry.set(indNode.id, sma);
    } else if (nodeType === "atr" || label.includes("ATR")) {
      const period = (params.period as number) ?? 14;
      const atr = computeATR(candles, period);
      cachedATR = atr;
      indicatorRegistry.set(indNode.id, atr);
    } else if (nodeType === "stochastic" || label.includes("STOCH")) {
      const kPeriod = (params.kPeriod as number) ?? 14;
      const dPeriod = (params.dPeriod as number) ?? 3;
      const smooth = (params.smooth as number) ?? 3;
      const stoch = computeStochastic(candles, kPeriod, dPeriod, smooth);
      // Default channel = k
      indicatorRegistry.set(indNode.id, stoch.k);
      indicatorRegistry.set(`${indNode.id}:k`, stoch.k);
      indicatorRegistry.set(`${indNode.id}:d`, stoch.d);
    } else if (nodeType === "adx" || label.includes("ADX")) {
      const period = (params.period as number) ?? 14;
      const adx = computeADX(candles, period);
      indicatorRegistry.set(indNode.id, adx);
    } else if (nodeType === "roc" || label.includes("ROC")) {
      const period = (params.period as number) ?? 12;
      const roc = computeROC(closes, period);
      indicatorRegistry.set(indNode.id, roc);
    } else if (nodeType === "vwap" || label.includes("VWAP")) {
      const vwap = computeVWAP(candles);
      indicatorRegistry.set(indNode.id, vwap);
    } else if (nodeType === "donchian" || label.includes("DONCHIAN")) {
      const period = (params.period as number) ?? 20;
      const donch = computeDonchian(candles, period);
      // Default channel = upper
      indicatorRegistry.set(indNode.id, donch.upper);
      indicatorRegistry.set(`${indNode.id}:upper`, donch.upper);
      indicatorRegistry.set(`${indNode.id}:middle`, donch.middle);
      indicatorRegistry.set(`${indNode.id}:lower`, donch.lower);
    } else if (nodeType === "bb-bandwidth" || label.includes("BANDWIDTH")) {
      const period = (params.period as number) ?? 20;
      const stdDev = (params.stdDev as number) ?? 2;
      const bw = computeBBBandwidth(closes, period, stdDev);
      indicatorRegistry.set(indNode.id, bw);
    } else if (nodeType === "pivot-points" || label.includes("PIVOT")) {
      const pivotType = (params.type as string) ?? "Standard";
      const pivots = computePivotPoints(candles, pivotType);
      // Default channel = pp
      indicatorRegistry.set(indNode.id, pivots.pp);
      indicatorRegistry.set(`${indNode.id}:pp`, pivots.pp);
      indicatorRegistry.set(`${indNode.id}:s1`, pivots.s1);
      indicatorRegistry.set(`${indNode.id}:r1`, pivots.r1);
      indicatorRegistry.set(`${indNode.id}:s2`, pivots.s2);
      indicatorRegistry.set(`${indNode.id}:r2`, pivots.r2);
    } else if (nodeType === "swing-hl" || label.includes("SWING")) {
      const lookback = (params.lookback as number) ?? 5;
      const swings = computeSwingHL(candles, lookback);
      // Default channel = high
      indicatorRegistry.set(indNode.id, swings.swingHigh);
      indicatorRegistry.set(`${indNode.id}:high`, swings.swingHigh);
      indicatorRegistry.set(`${indNode.id}:low`, swings.swingLow);
    } else if (nodeType === "candle-pattern" || label.includes("CANDLE") || label.includes("PATTERN")) {
      const pattern = (params.pattern as string) ?? "bullish_engulfing";
      const signals = detectCandlePattern(candles, pattern);
      indicatorRegistry.set(indNode.id, signals);
    }
  }

  // ── Phase 3: Resolve conditions ──

  type ConditionFn = (candleIdx: number) => boolean;
  const builtConditions = new Map<string, ConditionFn>();

  /**
   * Resolve the input series for an edge. If source is a data node, return closes.
   * If source is an indicator, return its registry entry (possibly via sourceHandle channel).
   */
  function resolveInput(edge: Edge): (number | null)[] | undefined {
    const sourceNode = nodeMap.get(edge.source);
    if (sourceNode && (sourceNode.data as unknown as NodeData).category === "data") {
      return closes.map((v) => v); // return closes as number[]
    }
    if (edge.sourceHandle) {
      const channel = (edge.sourceHandle as string).replace("output-", "");
      return indicatorRegistry.get(`${edge.source}:${channel}`) ?? indicatorRegistry.get(edge.source);
    }
    return indicatorRegistry.get(edge.source);
  }

  function buildCondition(condNode: Node): ConditionFn {
    const data = condNode.data as unknown as NodeData;
    const params = data.params;
    const label = data.label.toLowerCase();
    const nodeType = data.nodeType ?? "";

    // Get all edges that feed into this condition node
    const incomingEdges = edges.filter((e) => e.target === condNode.id);

    // Separate input-0 and input-1 edges
    let input0Edge: Edge | undefined;
    let input1Edge: Edge | undefined;

    for (const e of incomingEdges) {
      if (e.targetHandle === "input-0") {
        input0Edge = e;
      } else if (e.targetHandle === "input-1") {
        input1Edge = e;
      } else {
        // Bare edge (no handle) — backward compat, treat as input-0
        if (!input0Edge) input0Edge = e;
      }
    }

    const inputA = input0Edge ? resolveInput(input0Edge) : undefined;
    const inputB = input1Edge ? resolveInput(input1Edge) : undefined;

    // If no inputs found, fall back to upstream indicator lookup (backward compat)
    if (!inputA) {
      const upstream = getUpstream(condNode.id, edges);
      const indicatorId = upstream.find((id) => indicatorRegistry.has(id));

      if (!indicatorId) {
        // No indicator connected — use label parsing as fallback
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

      const values = indicatorRegistry.get(indicatorId)!;

      // Check for cross conditions (single input, crossing zero or threshold)
      if (label.includes("cross") || nodeType === "crosses-above" || nodeType === "crosses-below") {
        const crossAbove = label.includes("above") || nodeType === "crosses-above";
        const threshold = (params.value as number) ?? 0;
        return (i) => {
          if (i < 1) return false;
          const curr = values[i];
          const prev = values[i - 1];
          if (curr === null || prev === null) return false;
          return crossAbove
            ? prev <= threshold && curr > threshold
            : prev >= threshold && curr < threshold;
        };
      }

      // In-range condition (single input)
      if (nodeType === "in-range") {
        const low = (params.low as number) ?? 0;
        const high = (params.high as number) ?? 100;
        return (i) => {
          const val = values[i];
          if (val === null) return false;
          return val >= low && val <= high;
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

    // ── Two-input condition (indicator vs indicator) ──
    if (inputA && inputB) {
      const op = (params.operator as string) ?? ">";

      // Crossover with 2 inputs
      if (op === "crosses above" || nodeType === "crosses-above" || label.includes("cross")) {
        const crossAbove = op === "crosses above" || nodeType === "crosses-above" || label.includes("above");
        return (i) => {
          if (i < 1) return false;
          const currA = inputA[i];
          const prevA = inputA[i - 1];
          const currB = inputB[i];
          const prevB = inputB[i - 1];
          if (currA === null || prevA === null || currB === null || prevB === null) return false;
          return crossAbove
            ? prevA <= prevB && currA > currB
            : prevA >= prevB && currA < currB;
        };
      }

      // Sustained comparison with 2 inputs
      return (i) => {
        const valA = inputA[i];
        const valB = inputB[i];
        if (valA === null || valB === null) return false;
        switch (op) {
          case "<":
            return valA < valB;
          case ">":
            return valA > valB;
          case "<=":
            return valA <= valB;
          case ">=":
            return valA >= valB;
          case "==":
            return Math.abs(valA - valB) < 0.01;
          default:
            return valA > valB;
        }
      };
    }

    // ── Single input with handle (input-0 only, no input-1) ──
    if (inputA) {
      // Crossover single input
      if (label.includes("cross") || nodeType === "crosses-above" || nodeType === "crosses-below") {
        const crossAbove = label.includes("above") || nodeType === "crosses-above";
        const threshold = (params.value as number) ?? 0;
        return (i) => {
          if (i < 1) return false;
          const curr = inputA[i];
          const prev = inputA[i - 1];
          if (curr === null || prev === null) return false;
          return crossAbove
            ? prev <= threshold && curr > threshold
            : prev >= threshold && curr < threshold;
        };
      }

      // In-range condition
      if (nodeType === "in-range") {
        const low = (params.low as number) ?? 0;
        const high = (params.high as number) ?? 100;
        return (i) => {
          const val = inputA[i];
          if (val === null) return false;
          return val >= low && val <= high;
        };
      }

      // Threshold comparison
      const threshold = (params.value as number) ?? 30;
      const op = (params.operator as string) ?? "<";

      return (i) => {
        const val = inputA[i];
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

    return () => false;
  }

  function buildLogicGateCondition(condNode: Node): ConditionFn {
    const data = condNode.data as unknown as NodeData;
    const nodeType = data.nodeType ?? data.label.toLowerCase();
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
  const conditionSorted = topoSort(
    conditionNodes,
    edges.filter(
      (e) =>
        conditionNodes.some((n) => n.id === e.source) &&
        conditionNodes.some((n) => n.id === e.target),
    ),
  );
  // Include any condition nodes not in the topo sort (disconnected from other conditions)
  for (const cn of conditionNodes) {
    if (!conditionSorted.find((n) => n.id === cn.id)) {
      conditionSorted.push(cn);
    }
  }

  // Build conditions in topological order
  for (const condNode of conditionSorted) {
    const data = condNode.data as unknown as NodeData;
    const nodeType = data.nodeType ?? "";
    const isLogicGate = nodeType === "and-gate" || nodeType === "or-gate";

    if (isLogicGate) {
      builtConditions.set(condNode.id, buildLogicGateCondition(condNode));
    } else {
      builtConditions.set(condNode.id, buildCondition(condNode));
    }
  }

  // The final conditions that gate trade entry are the ones that feed into the entry node
  const conditions: ConditionFn[] = [];

  if (entryNode) {
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
    entryNode &&
    (entryNode.data as unknown as NodeData).params.side === "Short"
      ? "Short"
      : "Long";

  const maxHoldBars: number =
    entryNode
      ? ((entryNode.data as unknown as NodeData).params.maxHoldBars as number) ?? 30
      : 30;

  // Stop loss
  const slParams = stopLossNode
    ? (stopLossNode.data as unknown as NodeData).params
    : null;
  const slType = slParams?.type as string | undefined;
  const stopLossPct = slParams
    ? Math.abs(slParams.percent as number) / 100
    : 0.02;
  const slATRMultiplier = (slParams?.atrMultiplier as number) ?? 2;

  // Take profit
  const tpParams = takeProfitNode
    ? (takeProfitNode.data as unknown as NodeData).params
    : null;
  const tpType = tpParams?.type as string | undefined;
  const takeProfitPct = tpParams
    ? Math.abs(tpParams.percent as number) / 100
    : 0.06;
  const tpATRMultiplier = (tpParams?.atrMultiplier as number) ?? 3;

  // Trailing stop params
  const trailingParams = trailingStopNode
    ? (trailingStopNode.data as unknown as NodeData).params
    : null;
  const trailActivationPct = trailingParams
    ? ((trailingParams.activation as number) ?? 1) / 100
    : 0;
  const trailPct = trailingParams
    ? ((trailingParams.trail as number) ?? 1) / 100
    : 0;

  // ── Phase 5: Simulate candle-by-candle ──

  const trades: BacktestTrade[] = [];
  let inPosition = false;
  let entryPrice = 0;
  let entryIdx = 0;
  let tradeId = 0;
  const cooldownBars = 3;
  let lastExitIdx = -cooldownBars;

  // Trailing stop state
  let highestSinceEntry = 0;
  let lowestSinceEntry = Infinity;
  let trailingActivated = false;

  for (let i = warmup; i < candles.length; i++) {
    const candle = candles[i];

    if (inPosition) {
      // Track highest/lowest since entry for trailing stop
      if (candle.high > highestSinceEntry) highestSinceEntry = candle.high;
      if (candle.low < lowestSinceEntry) lowestSinceEntry = candle.low;

      // Compute stop/take-profit levels
      let slPrice: number;
      let tpPrice: number;

      if (slType === "ATR-based") {
        const atr = getATR();
        const atrAtEntry = atr[entryIdx] ?? 0;
        slPrice =
          entrySide === "Long"
            ? entryPrice - slATRMultiplier * atrAtEntry
            : entryPrice + slATRMultiplier * atrAtEntry;
      } else {
        slPrice =
          entrySide === "Long"
            ? entryPrice * (1 - stopLossPct)
            : entryPrice * (1 + stopLossPct);
      }

      if (tpType === "ATR-based") {
        const atr = getATR();
        const atrAtEntry = atr[entryIdx] ?? 0;
        tpPrice =
          entrySide === "Long"
            ? entryPrice + tpATRMultiplier * atrAtEntry
            : entryPrice - tpATRMultiplier * atrAtEntry;
      } else {
        tpPrice =
          entrySide === "Long"
            ? entryPrice * (1 + takeProfitPct)
            : entryPrice * (1 - takeProfitPct);
      }

      let exitPrice: number | null = null;
      let exitReason = "";

      if (entrySide === "Long") {
        // Check fixed SL (hard floor)
        if (candle.low <= slPrice) {
          exitPrice = slPrice;
          exitReason = "SL";
        }

        // Check trailing stop (can only tighten, never widen past SL)
        if (!exitPrice && trailingStopNode && trailPct > 0) {
          if (!trailingActivated && candle.high > entryPrice * (1 + trailActivationPct)) {
            trailingActivated = true;
          }
          if (trailingActivated) {
            const trailLevel = highestSinceEntry * (1 - trailPct);
            // Trailing can only tighten above the fixed SL
            const effectiveTrail = Math.max(trailLevel, slPrice);
            if (candle.low <= effectiveTrail) {
              exitPrice = effectiveTrail;
              exitReason = "Trail";
            }
          }
        }

        // Check TP
        if (!exitPrice && candle.high >= tpPrice) {
          exitPrice = tpPrice;
          exitReason = "TP";
        }
      } else {
        // Short side
        if (candle.high >= slPrice) {
          exitPrice = slPrice;
          exitReason = "SL";
        }

        if (!exitPrice && trailingStopNode && trailPct > 0) {
          if (!trailingActivated && candle.low < entryPrice * (1 - trailActivationPct)) {
            trailingActivated = true;
          }
          if (trailingActivated) {
            const trailLevel = lowestSinceEntry * (1 + trailPct);
            const effectiveTrail = Math.min(trailLevel, slPrice);
            if (candle.high >= effectiveTrail) {
              exitPrice = effectiveTrail;
              exitReason = "Trail";
            }
          }
        }

        if (!exitPrice && candle.low <= tpPrice) {
          exitPrice = tpPrice;
          exitReason = "TP";
        }
      }

      // Max hold timeout
      if (!exitPrice && i - entryIdx >= maxHoldBars) {
        exitPrice = candle.close;
        exitReason = "timeout";
      }

      if (exitPrice !== null) {
        const pnlRaw =
          entrySide === "Long"
            ? exitPrice - entryPrice
            : entryPrice - exitPrice;

        const positionSize = initialCapital * 0.05;
        const units = positionSize / entryPrice;
        const pnl = pnlRaw * units;
        const pnlPercent = (pnlRaw / entryPrice) * 100;

        const riskPerUnit = entryPrice * stopLossPct;
        const rMultiple = riskPerUnit > 0 ? pnlRaw / riskPerUnit : 0;

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
          highestSinceEntry = candle.high;
          lowestSinceEntry = candle.low;
          trailingActivated = false;
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
    const rMultiple = riskPerUnit > 0 ? pnlRaw / riskPerUnit : 0;

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

  // Build the public indicatorRegistry record from the internal Map
  const registryRecord: Record<string, (number | null)[]> = {};
  for (const [key, value] of indicatorRegistry) {
    registryRecord[key] = value;
  }

  return { trades, stats, candles, indicatorData, indicatorRegistry: registryRecord };
}
