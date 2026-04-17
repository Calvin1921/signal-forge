import { describe, it, expect } from "vitest";
import { runBacktestEngine, type BacktestInput } from "../backtest-engine";
import { presetNodeGraphs } from "../seed-data";
import { generateOHLCV } from "../generate-ohlcv";
import { computeStats, classifyHealth, type BacktestTrade } from "../compute-stats";
import type { Node, Edge } from "@xyflow/react";
import {
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
} from "../indicators";

// ── Helper: build a standard RSI mean-reversion strategy graph ──

function makeRSIMeanRevGraph(overrides?: {
  rsiPeriod?: number;
  rsiThreshold?: number;
  stopLoss?: number;
  takeProfit?: number;
  side?: "Long" | "Short";
}): { nodes: Node[]; edges: Edge[] } {
  const rsiPeriod = overrides?.rsiPeriod ?? 14;
  const threshold = overrides?.rsiThreshold ?? 30;
  const sl = overrides?.stopLoss ?? -2;
  const tp = overrides?.takeProfit ?? 6;
  const side = overrides?.side ?? "Long";

  const nodes: Node[] = [
    {
      id: "price-1",
      type: "strategyNode",
      position: { x: 0, y: 0 },
      data: {
        label: "Price Data",
        category: "data",
        icon: "BarChart3",
        params: { asset: "BTC/USDT", timeframe: "4h" },
      },
    },
    {
      id: "rsi-1",
      type: "strategyNode",
      position: { x: 200, y: 0 },
      data: {
        label: "RSI",
        category: "indicator",
        icon: "TrendingUp",
        params: { period: rsiPeriod, source: "close" },
      },
    },
    {
      id: "cond-1",
      type: "strategyNode",
      position: { x: 400, y: 0 },
      data: {
        label: `RSI < ${threshold}`,
        category: "condition",
        icon: "ChevronDown",
        params: { operator: "<", value: threshold },
      },
    },
    {
      id: "entry-1",
      type: "strategyNode",
      position: { x: 600, y: 0 },
      data: {
        label: "Market Entry",
        category: "action",
        icon: "LogIn",
        params: { side, type: "Market" },
      },
    },
    {
      id: "sl-1",
      type: "strategyNode",
      position: { x: 600, y: 100 },
      data: {
        label: "Stop Loss",
        category: "risk",
        icon: "ShieldOff",
        params: { percent: sl },
      },
    },
    {
      id: "tp-1",
      type: "strategyNode",
      position: { x: 800, y: 0 },
      data: {
        label: "Take Profit",
        category: "risk",
        icon: "ShieldCheck",
        params: { percent: tp },
      },
    },
  ];

  const edges: Edge[] = [
    { id: "e1", source: "price-1", target: "rsi-1" },
    { id: "e2", source: "rsi-1", target: "cond-1" },
    { id: "e3", source: "cond-1", target: "entry-1" },
    { id: "e4", source: "entry-1", target: "sl-1" },
    { id: "e5", source: "entry-1", target: "tp-1" },
  ];

  return { nodes, edges };
}

// ── Tests ──

describe("generateOHLCV", () => {
  it("generates the requested number of candles", () => {
    const candles = generateOHLCV({ asset: "BTC/USDT", count: 100 });
    expect(candles).toHaveLength(100);
  });

  it("is deterministic — same inputs produce same outputs", () => {
    const a = generateOHLCV({ asset: "BTC/USDT", count: 50, seedExtra: "test" });
    const b = generateOHLCV({ asset: "BTC/USDT", count: 50, seedExtra: "test" });
    expect(a).toEqual(b);
  });

  it("produces different data for different seed extras", () => {
    const a = generateOHLCV({ asset: "BTC/USDT", count: 50, seedExtra: "alpha" });
    const b = generateOHLCV({ asset: "BTC/USDT", count: 50, seedExtra: "beta" });
    expect(a[10].close).not.toEqual(b[10].close);
  });

  it("produces different data for different assets", () => {
    const btc = generateOHLCV({ asset: "BTC/USDT", count: 50 });
    const spy = generateOHLCV({ asset: "SPY", count: 50 });
    expect(btc[0].open).not.toEqual(spy[0].open);
  });

  it("candles have valid OHLCV structure", () => {
    const candles = generateOHLCV({ asset: "ETH/USDT", count: 20 });
    for (const c of candles) {
      expect(c.high).toBeGreaterThanOrEqual(Math.max(c.open, c.close));
      expect(c.low).toBeLessThanOrEqual(Math.min(c.open, c.close));
      expect(c.volume).toBeGreaterThan(0);
      expect(c.time).toBeGreaterThan(0);
    }
  });
});

describe("computeStats", () => {
  it("returns zero stats for empty trade list", () => {
    const stats = computeStats([]);
    expect(stats.totalTrades).toBe(0);
    expect(stats.winRate).toBe(0);
    expect(stats.health).toBe("no-edge");
  });

  it("correctly computes win rate", () => {
    const trades: BacktestTrade[] = [
      makeTrade({ pnl: 100, pnlPercent: 1, rMultiple: 1 }),
      makeTrade({ pnl: -50, pnlPercent: -0.5, rMultiple: -0.5 }),
      makeTrade({ pnl: 200, pnlPercent: 2, rMultiple: 2 }),
      makeTrade({ pnl: 150, pnlPercent: 1.5, rMultiple: 1.5 }),
    ];
    const stats = computeStats(trades);
    expect(stats.winRate).toBe(75);
    expect(stats.totalTrades).toBe(4);
  });

  it("computes profit factor correctly", () => {
    const trades: BacktestTrade[] = [
      makeTrade({ pnl: 300, pnlPercent: 3, rMultiple: 3 }),
      makeTrade({ pnl: -100, pnlPercent: -1, rMultiple: -1 }),
    ];
    const stats = computeStats(trades);
    expect(stats.profitFactor).toBe(3);
  });
});

describe("classifyHealth", () => {
  it("classifies too-good correctly", () => {
    expect(classifyHealth(3.5, 60, 2.5)).toBe("too-good");
  });

  it("classifies strong-edge", () => {
    expect(classifyHealth(2.5, 60, 2.5)).toBe("strong-edge");
  });

  it("classifies solid-edge", () => {
    expect(classifyHealth(1.5, 55, 1.8)).toBe("solid-edge");
  });

  it("classifies marginal", () => {
    expect(classifyHealth(0.8, 45, 1.2)).toBe("marginal");
  });

  it("classifies no-edge", () => {
    expect(classifyHealth(0.3, 40, 0.8)).toBe("no-edge");
  });
});

describe("runBacktestEngine", () => {
  it("produces trades from a valid RSI mean reversion graph", () => {
    const { nodes, edges } = makeRSIMeanRevGraph();
    const result = runBacktestEngine({
      nodes,
      edges,
      strategyName: "RSI Mean Reversion",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.candles).toHaveLength(500);
    expect(result.stats.totalTrades).toBe(result.trades.length);
    expect(result.indicatorData.rsi).toBeDefined();
  });

  it("is deterministic — same inputs produce same trades", () => {
    const { nodes, edges } = makeRSIMeanRevGraph();
    const input: BacktestInput = {
      nodes,
      edges,
      strategyName: "RSI Mean Reversion",
      asset: "BTC/USDT",
      timeframe: "4h",
    };
    const a = runBacktestEngine(input);
    const b = runBacktestEngine(input);
    expect(a.trades).toEqual(b.trades);
    expect(a.stats).toEqual(b.stats);
  });

  it("produces different results with different RSI thresholds", () => {
    const graph30 = makeRSIMeanRevGraph({ rsiThreshold: 30 });
    const graph20 = makeRSIMeanRevGraph({ rsiThreshold: 20 });

    const result30 = runBacktestEngine({
      nodes: graph30.nodes,
      edges: graph30.edges,
      strategyName: "RSI 30",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    const result20 = runBacktestEngine({
      nodes: graph20.nodes,
      edges: graph20.edges,
      strategyName: "RSI 20",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    // Different thresholds should produce different trade counts
    expect(result30.trades.length).not.toEqual(result20.trades.length);
  });

  it("produces different results for different assets", () => {
    const { nodes, edges } = makeRSIMeanRevGraph();

    const btc = runBacktestEngine({
      nodes,
      edges,
      strategyName: "Test",
      asset: "BTC/USDT",
      timeframe: "1D",
    });

    const spy = runBacktestEngine({
      nodes,
      edges,
      strategyName: "Test",
      asset: "SPY",
      timeframe: "1D",
    });

    expect(btc.stats.totalReturn).not.toEqual(spy.stats.totalReturn);
  });

  it("produces different results with different stop-loss/take-profit", () => {
    const graphTight = makeRSIMeanRevGraph({ stopLoss: -1, takeProfit: 3 });
    const graphWide = makeRSIMeanRevGraph({ stopLoss: -5, takeProfit: 15 });

    const tight = runBacktestEngine({
      nodes: graphTight.nodes,
      edges: graphTight.edges,
      strategyName: "Tight",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    const wide = runBacktestEngine({
      nodes: graphWide.nodes,
      edges: graphWide.edges,
      strategyName: "Wide",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    // Different risk parameters should produce different outcomes
    expect(tight.stats.totalReturn).not.toEqual(wide.stats.totalReturn);
  });

  it("each trade has valid structure", () => {
    const { nodes, edges } = makeRSIMeanRevGraph();
    const result = runBacktestEngine({
      nodes,
      edges,
      strategyName: "Validation Test",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    for (const trade of result.trades) {
      expect(trade.id).toBeTruthy();
      expect(trade.entryTime).toBeGreaterThan(0);
      expect(trade.exitTime).toBeGreaterThanOrEqual(trade.entryTime);
      expect(trade.entryPrice).toBeGreaterThan(0);
      expect(trade.exitPrice).toBeGreaterThan(0);
      expect(["Long", "Short"]).toContain(trade.side);
      expect(typeof trade.pnl).toBe("number");
      expect(typeof trade.rMultiple).toBe("number");
      expect(trade.holdBars).toBeGreaterThanOrEqual(0);
    }
  });

  it("computes MACD indicator when graph contains MACD node", () => {
    const nodes: Node[] = [
      {
        id: "price-1",
        type: "strategyNode",
        position: { x: 0, y: 0 },
        data: { label: "Price Data", category: "data", icon: "BarChart3", params: {} },
      },
      {
        id: "macd-1",
        type: "strategyNode",
        position: { x: 200, y: 0 },
        data: {
          label: "MACD",
          category: "indicator",
          icon: "Activity",
          params: { fast: 12, slow: 26, signal: 9 },
        },
      },
      {
        id: "cond-1",
        type: "strategyNode",
        position: { x: 400, y: 0 },
        data: {
          label: "Crosses Above",
          category: "condition",
          icon: "ArrowUpRight",
          params: {},
        },
      },
      {
        id: "entry-1",
        type: "strategyNode",
        position: { x: 600, y: 0 },
        data: { label: "Market Entry", category: "action", icon: "LogIn", params: { side: "Long" } },
      },
    ];

    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "macd-1" },
      { id: "e2", source: "macd-1", target: "cond-1" },
      { id: "e3", source: "cond-1", target: "entry-1" },
    ];

    const result = runBacktestEngine({
      nodes,
      edges,
      strategyName: "MACD Cross",
      asset: "SPY",
      timeframe: "1D",
    });

    expect(result.indicatorData.macd).toBeDefined();
    expect(result.indicatorData.macd!.macd.length).toBe(500);
  });

  it("AND gate combines two conditions — fewer trades than either alone", () => {
    // Strategy with AND gate: RSI < 30 AND MACD crosses above
    const nodes: Node[] = [
      {
        id: "price-1",
        type: "strategyNode",
        position: { x: 0, y: 0 },
        data: { label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "BTC/USDT", timeframe: "4h" } },
      },
      {
        id: "rsi-1",
        type: "strategyNode",
        position: { x: 200, y: 0 },
        data: { label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: { period: 14, source: "close" } },
      },
      {
        id: "macd-1",
        type: "strategyNode",
        position: { x: 200, y: 100 },
        data: { label: "MACD", category: "indicator", icon: "Activity", nodeType: "macd", params: { fast: 12, slow: 26, signal: 9 } },
      },
      {
        id: "cond-rsi",
        type: "strategyNode",
        position: { x: 400, y: 0 },
        data: { label: "RSI < 30", category: "condition", icon: "ChevronDown", nodeType: "less-than", params: { operator: "<", value: 30 } },
      },
      {
        id: "cond-macd",
        type: "strategyNode",
        position: { x: 400, y: 100 },
        data: { label: "Crosses Above", category: "condition", icon: "ArrowUpRight", nodeType: "crosses-above", params: { operator: "crosses above", value: 0 } },
      },
      {
        id: "and-1",
        type: "strategyNode",
        position: { x: 600, y: 50 },
        data: { label: "AND", category: "condition", icon: "GitMerge", nodeType: "and-gate", params: { logic: "AND" } },
      },
      {
        id: "entry-1",
        type: "strategyNode",
        position: { x: 800, y: 50 },
        data: { label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" } },
      },
      {
        id: "sl-1",
        type: "strategyNode",
        position: { x: 800, y: 150 },
        data: { label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2 } },
      },
    ];

    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "rsi-1" },
      { id: "e2", source: "price-1", target: "macd-1" },
      { id: "e3", source: "rsi-1", target: "cond-rsi" },
      { id: "e4", source: "macd-1", target: "cond-macd" },
      { id: "e5", source: "cond-rsi", target: "and-1", targetHandle: "input-0" },
      { id: "e6", source: "cond-macd", target: "and-1", targetHandle: "input-1" },
      { id: "e7", source: "and-1", target: "entry-1" },
      { id: "e8", source: "entry-1", target: "sl-1" },
    ];

    const andResult = runBacktestEngine({
      nodes,
      edges,
      strategyName: "AND Gate Test",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    // Also run with just RSI condition (no AND gate)
    const { nodes: rsiNodes, edges: rsiEdges } = makeRSIMeanRevGraph({ rsiThreshold: 30 });
    const rsiOnlyResult = runBacktestEngine({
      nodes: rsiNodes,
      edges: rsiEdges,
      strategyName: "AND Gate Test",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    // AND gate should produce fewer (or equal) trades than RSI alone
    // since it requires BOTH conditions to be true
    expect(andResult.trades.length).toBeLessThanOrEqual(rsiOnlyResult.trades.length);
    expect(andResult.indicatorData.rsi).toBeDefined();
    expect(andResult.indicatorData.macd).toBeDefined();
  });

  it("OR gate produces more trades than individual conditions", () => {
    const nodes: Node[] = [
      {
        id: "price-1",
        type: "strategyNode",
        position: { x: 0, y: 0 },
        data: { label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "BTC/USDT", timeframe: "4h" } },
      },
      {
        id: "rsi-1",
        type: "strategyNode",
        position: { x: 200, y: 0 },
        data: { label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: { period: 14, source: "close" } },
      },
      {
        id: "macd-1",
        type: "strategyNode",
        position: { x: 200, y: 100 },
        data: { label: "MACD", category: "indicator", icon: "Activity", nodeType: "macd", params: { fast: 12, slow: 26, signal: 9 } },
      },
      {
        id: "cond-rsi",
        type: "strategyNode",
        position: { x: 400, y: 0 },
        data: { label: "RSI < 30", category: "condition", icon: "ChevronDown", nodeType: "less-than", params: { operator: "<", value: 30 } },
      },
      {
        id: "cond-macd",
        type: "strategyNode",
        position: { x: 400, y: 100 },
        data: { label: "Crosses Above", category: "condition", icon: "ArrowUpRight", nodeType: "crosses-above", params: { operator: "crosses above", value: 0 } },
      },
      {
        id: "or-1",
        type: "strategyNode",
        position: { x: 600, y: 50 },
        data: { label: "OR", category: "condition", icon: "GitBranch", nodeType: "or-gate", params: { logic: "OR" } },
      },
      {
        id: "entry-1",
        type: "strategyNode",
        position: { x: 800, y: 50 },
        data: { label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" } },
      },
      {
        id: "sl-1",
        type: "strategyNode",
        position: { x: 800, y: 150 },
        data: { label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2 } },
      },
    ];

    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "rsi-1" },
      { id: "e2", source: "price-1", target: "macd-1" },
      { id: "e3", source: "rsi-1", target: "cond-rsi" },
      { id: "e4", source: "macd-1", target: "cond-macd" },
      { id: "e5", source: "cond-rsi", target: "or-1", targetHandle: "input-0" },
      { id: "e6", source: "cond-macd", target: "or-1", targetHandle: "input-1" },
      { id: "e7", source: "or-1", target: "entry-1" },
      { id: "e8", source: "entry-1", target: "sl-1" },
    ];

    const orResult = runBacktestEngine({
      nodes,
      edges,
      strategyName: "OR Gate Test",
      asset: "BTC/USDT",
      timeframe: "4h",
    });

    // OR gate should produce trades (at least one condition fires)
    expect(orResult.trades.length).toBeGreaterThan(0);
    expect(orResult.indicatorData.rsi).toBeDefined();
    expect(orResult.indicatorData.macd).toBeDefined();
  });
});

describe("engine v2 — indicator registry", () => {
  it("multiple EMAs compute independently and both appear in indicatorRegistry", () => {
    const nodes: Node[] = [
      { id: "price-1", type: "strategyNode", position: { x: 0, y: 0 }, data: { label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "BTC/USDT", timeframe: "4h" } } },
      { id: "ema8-1", type: "strategyNode", position: { x: 200, y: 0 }, data: { label: "EMA(8)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 8, source: "close" } } },
      { id: "ema21-1", type: "strategyNode", position: { x: 200, y: 100 }, data: { label: "EMA(21)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 21, source: "close" } } },
      { id: "cond-1", type: "strategyNode", position: { x: 400, y: 50 }, data: { label: "Crosses Above", category: "condition", icon: "ArrowUpRight", nodeType: "crosses-above", params: { operator: "crosses above", value: 0 } } },
      { id: "entry-1", type: "strategyNode", position: { x: 600, y: 50 }, data: { label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" } } },
      { id: "sl-1", type: "strategyNode", position: { x: 600, y: 150 }, data: { label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2, type: "Fixed" } } },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "ema8-1" },
      { id: "e2", source: "price-1", target: "ema21-1" },
      { id: "e3", source: "ema8-1", target: "cond-1", targetHandle: "input-0" },
      { id: "e4", source: "ema21-1", target: "cond-1", targetHandle: "input-1" },
      { id: "e5", source: "cond-1", target: "entry-1" },
      { id: "e6", source: "entry-1", target: "sl-1" },
    ];
    const result = runBacktestEngine({ nodes, edges, strategyName: "Multi EMA Test", asset: "BTC/USDT", timeframe: "4h" });
    expect(result.indicatorRegistry["ema8-1"]).toBeDefined();
    expect(result.indicatorRegistry["ema21-1"]).toBeDefined();
    expect(result.indicatorRegistry["ema8-1"]).not.toEqual(result.indicatorRegistry["ema21-1"]);
    expect(result.trades.length).toBeGreaterThan(0);
  });

  it("indicator-vs-indicator sustained (>) condition filters correctly", () => {
    const nodes: Node[] = [
      { id: "price-1", type: "strategyNode", position: { x: 0, y: 0 }, data: { label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: {} } },
      { id: "ema8-1", type: "strategyNode", position: { x: 200, y: 0 }, data: { label: "EMA(8)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 8 } } },
      { id: "ema21-1", type: "strategyNode", position: { x: 200, y: 100 }, data: { label: "EMA(21)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 21 } } },
      { id: "cond-1", type: "strategyNode", position: { x: 400, y: 50 }, data: { label: "EMA8 > EMA21", category: "condition", icon: "ChevronUp", nodeType: "greater-than", params: { operator: ">", value: 0 } } },
      { id: "entry-1", type: "strategyNode", position: { x: 600, y: 50 }, data: { label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" } } },
      { id: "sl-1", type: "strategyNode", position: { x: 600, y: 150 }, data: { label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2, type: "Fixed" } } },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "ema8-1" },
      { id: "e2", source: "price-1", target: "ema21-1" },
      { id: "e3", source: "ema8-1", target: "cond-1", targetHandle: "input-0" },
      { id: "e4", source: "ema21-1", target: "cond-1", targetHandle: "input-1" },
      { id: "e5", source: "cond-1", target: "entry-1" },
      { id: "e6", source: "entry-1", target: "sl-1" },
    ];
    const result = runBacktestEngine({ nodes, edges, strategyName: "Sustained Test", asset: "BTC/USDT", timeframe: "4h" });
    expect(result.trades.length).toBeGreaterThan(0);
  });

  it("dynamic warmup adjusts for large indicator periods", () => {
    const nodes: Node[] = [
      { id: "price-1", type: "strategyNode", position: { x: 0, y: 0 }, data: { label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: {} } },
      { id: "ema200-1", type: "strategyNode", position: { x: 200, y: 0 }, data: { label: "EMA(200)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 200 } } },
      { id: "cond-1", type: "strategyNode", position: { x: 400, y: 0 }, data: { label: "> 0", category: "condition", icon: "ChevronUp", nodeType: "greater-than", params: { operator: ">", value: 0 } } },
      { id: "entry-1", type: "strategyNode", position: { x: 600, y: 0 }, data: { label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long" } } },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "ema200-1" },
      { id: "e2", source: "ema200-1", target: "cond-1" },
      { id: "e3", source: "cond-1", target: "entry-1" },
    ];
    const result = runBacktestEngine({ nodes, edges, strategyName: "EMA200 Test", asset: "BTC/USDT", timeframe: "4h" });
    expect(result.candles.length).toBeGreaterThanOrEqual(610);
    for (const trade of result.trades) {
      const entryCandle = result.candles.findIndex((c) => c.time === trade.entryTime);
      expect(entryCandle).toBeGreaterThanOrEqual(210);
    }
  });

  it("in-range condition filters values within low-high bounds", () => {
    const nodes: Node[] = [
      { id: "price-1", type: "strategyNode", position: { x: 0, y: 0 }, data: { label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: {} } },
      { id: "rsi-1", type: "strategyNode", position: { x: 200, y: 0 }, data: { label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: { period: 14 } } },
      { id: "cond-1", type: "strategyNode", position: { x: 400, y: 0 }, data: { label: "RSI 20-40", category: "condition", icon: "ArrowLeftRight", nodeType: "in-range", params: { low: 20, high: 40 } } },
      { id: "entry-1", type: "strategyNode", position: { x: 600, y: 0 }, data: { label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" } } },
      { id: "sl-1", type: "strategyNode", position: { x: 600, y: 100 }, data: { label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2, type: "Fixed" } } },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "rsi-1" },
      { id: "e2", source: "rsi-1", target: "cond-1" },
      { id: "e3", source: "cond-1", target: "entry-1" },
      { id: "e4", source: "entry-1", target: "sl-1" },
    ];
    const result = runBacktestEngine({ nodes, edges, strategyName: "In Range Test", asset: "BTC/USDT", timeframe: "4h" });
    expect(result.trades.length).toBeGreaterThan(0);
  });

  it("backward compat — existing RSI preset produces trades like before", () => {
    const { nodes: rsiNodes, edges: rsiEdges } = makeRSIMeanRevGraph();
    const before = runBacktestEngine({ nodes: rsiNodes, edges: rsiEdges, strategyName: "RSI Mean Reversion", asset: "BTC/USDT", timeframe: "4h" });
    expect(before.trades.length).toBeGreaterThan(0);
    expect(before.indicatorData.rsi).toBeDefined();
    expect(Object.keys(before.indicatorRegistry).length).toBeGreaterThan(0);
  });
});

const testCandles = generateOHLCV({ asset: "BTC/USDT", count: 200, seedExtra: "indicator-test" });
const testCloses = testCandles.map((c) => c.close);

describe("new indicators", () => {
  it("ATR produces values in valid range after warmup", () => {
    const atr = computeATR(testCandles, 14);
    expect(atr).toHaveLength(200);
    for (let i = 0; i < 13; i++) expect(atr[i]).toBeNull();
    const validValues = atr.filter((v): v is number => v !== null);
    expect(validValues.length).toBeGreaterThan(0);
    for (const v of validValues) expect(v).toBeGreaterThan(0);
  });

  it("Stochastic %K and %D are in 0-100 range", () => {
    const stoch = computeStochastic(testCandles, 14, 3, 3);
    expect(stoch.k).toHaveLength(200);
    expect(stoch.d).toHaveLength(200);
    const validK = stoch.k.filter((v): v is number => v !== null);
    for (const v of validK) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
  });

  it("ADX values are in 0-100 range", () => {
    const adx = computeADX(testCandles, 14);
    expect(adx).toHaveLength(200);
    const validValues = adx.filter((v): v is number => v !== null);
    expect(validValues.length).toBeGreaterThan(0);
    for (const v of validValues) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(100); }
  });

  it("ROC computes correct percentage change", () => {
    const roc = computeROC(testCloses, 12);
    expect(roc).toHaveLength(200);
    for (let i = 0; i < 12; i++) expect(roc[i]).toBeNull();
    const idx = 20;
    const expected = ((testCloses[idx] - testCloses[idx - 12]) / testCloses[idx - 12]) * 100;
    expect(roc[idx]).toBeCloseTo(expected, 4);
  });

  it("Donchian Channel: upper >= middle >= lower", () => {
    const donch = computeDonchian(testCandles, 20);
    expect(donch.upper).toHaveLength(200);
    for (let i = 20; i < 200; i++) {
      if (donch.upper[i] !== null && donch.lower[i] !== null) {
        expect(donch.upper[i]!).toBeGreaterThanOrEqual(donch.lower[i]!);
      }
    }
  });

  it("BB Bandwidth produces positive values after warmup", () => {
    const bw = computeBBBandwidth(testCloses, 20, 2);
    expect(bw).toHaveLength(200);
    const validValues = bw.filter((v): v is number => v !== null);
    expect(validValues.length).toBeGreaterThan(0);
    for (const v of validValues) expect(v).toBeGreaterThan(0);
  });

  it("Candle pattern detection returns valid signals", () => {
    const signals = detectCandlePattern(testCandles, "bullish_engulfing");
    expect(signals).toHaveLength(200);
    for (const v of signals) { if (v !== null) expect([1, 0, -1]).toContain(v); }
  });

  it("Swing High/Low detects local extremes", () => {
    const swings = computeSwingHL(testCandles, 5);
    expect(swings.swingHigh).toHaveLength(200);
    const validHighs = swings.swingHigh.slice(20).filter((v): v is number => v !== null);
    expect(validHighs.length).toBeGreaterThan(0);
  });

  it("VWAP produces values equal to candle count", () => {
    const vwap = computeVWAP(testCandles);
    expect(vwap).toHaveLength(200);
    const validValues = vwap.filter((v): v is number => v !== null);
    expect(validValues.length).toBeGreaterThan(0);
  });

  it("Pivot Points produces valid S/R levels", () => {
    const pivots = computePivotPoints(testCandles, "Standard");
    expect(pivots.pp).toHaveLength(200);
    for (let i = 1; i < 200; i++) {
      if (pivots.pp[i] !== null && pivots.r1[i] !== null && pivots.s1[i] !== null) {
        expect(pivots.r1[i]!).toBeGreaterThanOrEqual(pivots.pp[i]!);
        expect(pivots.s1[i]!).toBeLessThanOrEqual(pivots.pp[i]!);
      }
    }
  });
});

describe("engine v2 — trailing stop", () => {
  it("trailing stop activates and exits at trail level", () => {
    const nodes: Node[] = [
      { id: "price-1", type: "strategyNode", position: { x: 0, y: 0 }, data: { label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: {} } },
      { id: "rsi-1", type: "strategyNode", position: { x: 200, y: 0 }, data: { label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: { period: 14 } } },
      { id: "cond-1", type: "strategyNode", position: { x: 400, y: 0 }, data: { label: "RSI < 30", category: "condition", icon: "ChevronDown", nodeType: "less-than", params: { operator: "<", value: 30 } } },
      { id: "entry-1", type: "strategyNode", position: { x: 600, y: 0 }, data: { label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" } } },
      { id: "trail-1", type: "strategyNode", position: { x: 600, y: 100 }, data: { label: "Trailing Stop", category: "risk", icon: "Shield", nodeType: "trailing-stop", params: { percent: -1.5, activation: 1 } } },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "rsi-1" },
      { id: "e2", source: "rsi-1", target: "cond-1" },
      { id: "e3", source: "cond-1", target: "entry-1" },
      { id: "e4", source: "entry-1", target: "trail-1" },
    ];
    const result = runBacktestEngine({ nodes, edges, strategyName: "Trail Test", asset: "BTC/USDT", timeframe: "4h" });
    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.trades.some((t) => t.holdBars < 30)).toBe(true);
  });

  it("ATR-based stop uses ATR for stop distance", () => {
    const nodes: Node[] = [
      { id: "price-1", type: "strategyNode", position: { x: 0, y: 0 }, data: { label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: {} } },
      { id: "rsi-1", type: "strategyNode", position: { x: 200, y: 0 }, data: { label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: { period: 14 } } },
      { id: "cond-1", type: "strategyNode", position: { x: 400, y: 0 }, data: { label: "RSI < 30", category: "condition", icon: "ChevronDown", nodeType: "less-than", params: { operator: "<", value: 30 } } },
      { id: "entry-1", type: "strategyNode", position: { x: 600, y: 0 }, data: { label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" } } },
      { id: "sl-1", type: "strategyNode", position: { x: 600, y: 100 }, data: { label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2, type: "ATR-based", atrPeriod: 14, atrMultiplier: 1.5 } } },
      { id: "tp-1", type: "strategyNode", position: { x: 800, y: 0 }, data: { label: "Take Profit", category: "risk", icon: "ShieldCheck", nodeType: "take-profit", params: { percent: 6, type: "ATR-based", atrPeriod: 14, atrMultiplier: 3.0 } } },
    ];
    const edges: Edge[] = [
      { id: "e1", source: "price-1", target: "rsi-1" },
      { id: "e2", source: "rsi-1", target: "cond-1" },
      { id: "e3", source: "cond-1", target: "entry-1" },
      { id: "e4", source: "entry-1", target: "sl-1" },
      { id: "e5", source: "entry-1", target: "tp-1" },
    ];
    const result = runBacktestEngine({ nodes, edges, strategyName: "ATR Stop Test", asset: "BTC/USDT", timeframe: "4h" });
    expect(result.trades.length).toBeGreaterThan(0);
    const fixedNodes = nodes.map((n) => {
      if (n.id === "sl-1") return { ...n, data: { ...n.data, params: { percent: -2, type: "Fixed" } } };
      if (n.id === "tp-1") return { ...n, data: { ...n.data, params: { percent: 6, type: "Fixed" } } };
      return n;
    });
    const fixedResult = runBacktestEngine({ nodes: fixedNodes, edges, strategyName: "ATR Stop Test", asset: "BTC/USDT", timeframe: "4h" });
    expect(result.stats.totalReturn).not.toEqual(fixedResult.stats.totalReturn);
  });
});

// ── Helpers ──

let _tradeCounter = 0;
function makeTrade(overrides: Partial<BacktestTrade>): BacktestTrade {
  _tradeCounter++;
  const base = 1704067200; // 2024-01-01
  return {
    id: `test-${_tradeCounter}`,
    entryTime: base + _tradeCounter * 86400,
    entryPrice: 42000,
    exitTime: base + (_tradeCounter + 1) * 86400,
    exitPrice: 42000 + (overrides.pnl ?? 0) * 20,
    side: "Long",
    pnl: 0,
    pnlPercent: 0,
    rMultiple: 0,
    holdBars: 6,
    asset: "BTC/USDT",
    strategy: "test",
    ...overrides,
  };
}

describe("engine v2 — preset integration", () => {
  it("EMA Ribbon preset produces trades with 3-condition AND chain", () => {
    const graph = presetNodeGraphs["ema-ribbon"];
    if (!graph) throw new Error("ema-ribbon preset not found");
    const nodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: "strategyNode",
      position: n.position,
      data: { ...n.data },
    }));
    const edges: Edge[] = graph.edges.map((e, i) => ({
      id: `pe-${i}`,
      source: e.source,
      target: e.target,
      ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
      ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
    }));
    const result = runBacktestEngine({
      nodes,
      edges,
      strategyName: "EMA Ribbon Trend",
      asset: "BTC/USDT",
      timeframe: "4h",
    });
    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.indicatorRegistry["p-ema8-1"]).toBeDefined();
    expect(result.indicatorRegistry["p-ema21-1"]).toBeDefined();
    expect(result.indicatorRegistry["p-ema55-1"]).toBeDefined();
  });
});

// ── Sharpe / Win-rate sanity bounds ──
//
// Regression guard for the round-2 trust bug where BTC mean-rev produced
// Sharpe = -7326 and win rate = 0%. Every preset must now produce:
//   - win rate in [0, 100]
//   - Sharpe either `null` (insufficient sample) or finite and in a sane band
//   - no NaN / Infinity leakage into the UI

describe("stats sanity — Sharpe & win-rate bounds across presets", () => {
  const presetIds = [
    "btc-mean-rev",
    "macd-div-swing",
    "boll-squeeze",
    "golden-cross",
    "triple-ema-trend",
    "ema-ribbon",
  ];

  for (const presetId of presetIds) {
    it(`${presetId}: stats are finite and within sane bounds`, () => {
      const preset = presetNodeGraphs[presetId];
      if (!preset) return; // preset missing is fine — test only what's shipped

      const nodes: Node[] = preset.nodes.map((n) => ({
        id: n.id,
        type: "strategyNode",
        position: n.position,
        data: { ...n.data },
      }));
      const edges: Edge[] = preset.edges.map((e, i) => ({
        id: `s-${i}`,
        source: e.source,
        target: e.target,
        ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
        ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
      }));
      const result = runBacktestEngine({
        nodes,
        edges,
        strategyName: preset.presetName,
        asset: preset.defaultAsset as "BTC/USDT",
        timeframe: preset.defaultTimeframe,
      });
      const s = result.stats;

      // Win rate bounds
      expect(s.winRate).toBeGreaterThanOrEqual(0);
      expect(s.winRate).toBeLessThanOrEqual(100);
      expect(Number.isFinite(s.winRate)).toBe(true);

      // Sharpe / Sortino: null (insufficient sample) or a finite in-band number
      if (s.sharpe === null) {
        expect(result.trades.length).toBeLessThan(10);
      } else {
        expect(Number.isFinite(s.sharpe)).toBe(true);
        // Clamped to [-10, 10] in compute-stats; typical preset should land in [-5, 5]
        expect(s.sharpe).toBeGreaterThanOrEqual(-10);
        expect(s.sharpe).toBeLessThanOrEqual(10);
      }
      if (s.sortino !== null) {
        expect(Number.isFinite(s.sortino) || s.sortino === Infinity).toBe(true);
      }

      // No NaN leakage on any other field
      expect(Number.isFinite(s.totalReturn)).toBe(true);
      expect(Number.isFinite(s.maxDrawdown)).toBe(true);
      expect(Number.isFinite(s.profitFactor) || s.profitFactor === Infinity).toBe(true);
    });
  }

  it("BTC mean-rev no longer shows the -7326 Sharpe regression", () => {
    const preset = presetNodeGraphs["btc-mean-rev"];
    const nodes: Node[] = preset.nodes.map((n) => ({
      id: n.id,
      type: "strategyNode",
      position: n.position,
      data: { ...n.data },
    }));
    const edges: Edge[] = preset.edges.map((e, i) => ({
      id: `s-${i}`,
      source: e.source,
      target: e.target,
    }));
    const result = runBacktestEngine({
      nodes,
      edges,
      strategyName: preset.presetName,
      asset: "BTC/USDT",
      timeframe: "4h",
    });
    // Either null (too few trades) or finite & sane. Never -7326.
    if (result.stats.sharpe !== null) {
      expect(Math.abs(result.stats.sharpe)).toBeLessThan(10);
    }
  });

  it("null Sharpe → `classifyHealth` returns `no-edge` (safe default)", () => {
    expect(classifyHealth(null, 50, 1.5)).toBe("no-edge");
  });
});
