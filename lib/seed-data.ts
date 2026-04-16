// ── Seed Data for SignalForge ──

export type HealthRating = "strong-edge" | "solid-edge" | "marginal" | "no-edge" | "too-good";

export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  asset: string;
  timeframe: string;
  complexity: "Beginner" | "Intermediate" | "Advanced";
  stats: {
    winRate: number;
    sharpe: number;
    totalReturn: number;
    maxDrawdown: number;
    totalTrades: number;
  };
  health: HealthRating;
  lastSignal: string;
  pnl: number;
  pnlPercent: number;
}

export interface Trade {
  id: string;
  time: string;
  strategy: string;
  asset: string;
  side: "Long" | "Short";
  entry: number;
  exit: number;
  pnl: number;
  pnlPercent: number;
  rMultiple: number;
  duration: string;
}

export interface DashboardStats {
  portfolioPnlToday: number;
  portfolioPnlPercent: number;
  winRate30d: number;
  winRatePrev: number;
  activeStrategies: number;
  healthDistribution: string;
  overnightSignals: number;
  overnightDetail: string;
}

// ── Dashboard Stats ──
export const dashboardStats: DashboardStats = {
  portfolioPnlToday: 342.18,
  portfolioPnlPercent: 1.2,
  winRate30d: 58,
  winRatePrev: 54,
  activeStrategies: 3,
  healthDistribution: "2 Strong \u00b7 1 Marginal",
  overnightSignals: 2,
  overnightDetail: "BTC Mean Rev triggered",
};

// ── Active Strategies ──
export const activeStrategies: StrategyPreset[] = [
  {
    id: "btc-mean-rev",
    name: "BTC Mean Reversion",
    description: "Buys BTC dips when RSI drops below 30 on the 4h chart, exits on mean reversion to the 20-period EMA.",
    asset: "BTC/USDT",
    timeframe: "4h",
    complexity: "Beginner",
    stats: { winRate: 55, sharpe: 1.4, totalReturn: 12.5, maxDrawdown: -8.2, totalTrades: 87 },
    health: "strong-edge",
    lastSignal: "2h ago",
    pnl: 1247,
    pnlPercent: 2.5,
  },
  {
    id: "macd-div-swing",
    name: "MACD Divergence Swing",
    description: "Identifies bullish MACD divergences on the daily chart and enters long swing trades with a 3:1 reward-to-risk ratio.",
    asset: "SPY",
    timeframe: "1D",
    complexity: "Intermediate",
    stats: { winRate: 48, sharpe: 1.1, totalReturn: 8.9, maxDrawdown: -11.4, totalTrades: 62 },
    health: "solid-edge",
    lastSignal: "4 days ago",
    pnl: 892,
    pnlPercent: 1.8,
  },
  {
    id: "boll-squeeze",
    name: "Bollinger Squeeze",
    description: "Detects Bollinger Band squeezes on EUR/USD 1h chart and enters breakout trades in the direction of the squeeze release.",
    asset: "EUR/USD",
    timeframe: "1h",
    complexity: "Intermediate",
    stats: { winRate: 42, sharpe: 0.7, totalReturn: -3.1, maxDrawdown: -15.6, totalTrades: 44 },
    health: "marginal",
    lastSignal: "6h ago",
    pnl: -156,
    pnlPercent: -0.3,
  },
];

// ── Preset Strategies (for Presets page) ──
export const presetStrategies: StrategyPreset[] = [
  ...activeStrategies,
  {
    id: "golden-cross",
    name: "Golden Cross Momentum",
    description: "Enters long when the 50-day EMA crosses above the 200-day EMA, exits on the death cross.",
    asset: "ETH/USDT",
    timeframe: "1D",
    complexity: "Beginner",
    stats: { winRate: 52, sharpe: 1.2, totalReturn: 18.4, maxDrawdown: -12.1, totalTrades: 34 },
    health: "solid-edge",
    lastSignal: "2 days ago",
    pnl: 2340,
    pnlPercent: 4.7,
  },
  {
    id: "vol-breakout",
    name: "Volume-Weighted Breakout",
    description: "Monitors for price breakouts confirmed by above-average volume, enters momentum trades with tight stops.",
    asset: "AAPL",
    timeframe: "1h",
    complexity: "Advanced",
    stats: { winRate: 45, sharpe: 0.9, totalReturn: 5.2, maxDrawdown: -9.8, totalTrades: 156 },
    health: "marginal",
    lastSignal: "12h ago",
    pnl: 580,
    pnlPercent: 1.2,
  },
  {
    id: "triple-ema",
    name: "Triple EMA Trend",
    description: "Uses 8/21/55 EMA alignment to identify trend direction and enters pullbacks to the 21 EMA.",
    asset: "BTC/USDT",
    timeframe: "4h",
    complexity: "Intermediate",
    stats: { winRate: 51, sharpe: 1.5, totalReturn: 22.1, maxDrawdown: -7.5, totalTrades: 98 },
    health: "strong-edge",
    lastSignal: "8h ago",
    pnl: 3120,
    pnlPercent: 6.2,
  },
  {
    id: "rsi-macd-combo",
    name: "RSI + MACD Combo",
    description: "Combines RSI oversold (< 30) AND MACD bullish crossover to confirm long entries. Uses an AND gate to require both conditions simultaneously.",
    asset: "BTC/USDT",
    timeframe: "4h",
    complexity: "Advanced",
    stats: { winRate: 62, sharpe: 1.8, totalReturn: 16.3, maxDrawdown: -6.4, totalTrades: 42 },
    health: "strong-edge",
    lastSignal: "5h ago",
    pnl: 1890,
    pnlPercent: 3.8,
  },
];

// ── Sample Trades ──
export const sampleTrades: Trade[] = [
  { id: "t1", time: "2025-04-15 14:32", strategy: "BTC Mean Rev", asset: "BTC/USDT", side: "Long", entry: 93420, exit: 95180, pnl: 412.50, pnlPercent: 1.88, rMultiple: 2.4, duration: "6h 12m" },
  { id: "t2", time: "2025-04-15 09:15", strategy: "MACD Div Swing", asset: "SPY", side: "Long", entry: 578.20, exit: 583.45, pnl: 262.50, pnlPercent: 0.91, rMultiple: 1.8, duration: "2d 4h" },
  { id: "t3", time: "2025-04-14 22:48", strategy: "Boll Squeeze", asset: "EUR/USD", side: "Short", entry: 1.0842, exit: 1.0791, pnl: 255.00, pnlPercent: 0.47, rMultiple: 1.5, duration: "3h 22m" },
  { id: "t4", time: "2025-04-14 16:05", strategy: "BTC Mean Rev", asset: "BTC/USDT", side: "Long", entry: 94100, exit: 93650, pnl: -225.00, pnlPercent: -0.48, rMultiple: -1.0, duration: "2h 45m" },
  { id: "t5", time: "2025-04-14 11:20", strategy: "MACD Div Swing", asset: "SPY", side: "Long", entry: 575.80, exit: 579.30, pnl: 175.00, pnlPercent: 0.61, rMultiple: 1.2, duration: "1d 8h" },
  { id: "t6", time: "2025-04-13 19:42", strategy: "BTC Mean Rev", asset: "BTC/USDT", side: "Long", entry: 91850, exit: 94200, pnl: 587.50, pnlPercent: 2.56, rMultiple: 3.1, duration: "8h 30m" },
  { id: "t7", time: "2025-04-13 08:30", strategy: "Boll Squeeze", asset: "EUR/USD", side: "Long", entry: 1.0798, exit: 1.0775, pnl: -115.00, pnlPercent: -0.21, rMultiple: -0.7, duration: "1h 55m" },
  { id: "t8", time: "2025-04-12 21:15", strategy: "BTC Mean Rev", asset: "BTC/USDT", side: "Long", entry: 92300, exit: 93100, pnl: 200.00, pnlPercent: 0.87, rMultiple: 1.1, duration: "4h 10m" },
  { id: "t9", time: "2025-04-12 14:50", strategy: "MACD Div Swing", asset: "SPY", side: "Long", entry: 581.40, exit: 579.60, pnl: -180.00, pnlPercent: -0.31, rMultiple: -0.6, duration: "6h 20m" },
  { id: "t10", time: "2025-04-12 07:22", strategy: "Boll Squeeze", asset: "EUR/USD", side: "Short", entry: 1.0856, exit: 1.0812, pnl: 220.00, pnlPercent: 0.41, rMultiple: 1.6, duration: "2h 48m" },
  { id: "t11", time: "2025-04-11 18:35", strategy: "BTC Mean Rev", asset: "BTC/USDT", side: "Long", entry: 90200, exit: 91800, pnl: 400.00, pnlPercent: 1.77, rMultiple: 2.2, duration: "7h 15m" },
  { id: "t12", time: "2025-04-11 12:10", strategy: "MACD Div Swing", asset: "SPY", side: "Long", entry: 576.50, exit: 580.20, pnl: 185.00, pnlPercent: 0.64, rMultiple: 1.3, duration: "1d 2h" },
  { id: "t13", time: "2025-04-10 23:45", strategy: "BTC Mean Rev", asset: "BTC/USDT", side: "Long", entry: 89500, exit: 88900, pnl: -300.00, pnlPercent: -0.67, rMultiple: -1.0, duration: "3h 20m" },
  { id: "t14", time: "2025-04-10 16:20", strategy: "Boll Squeeze", asset: "EUR/USD", side: "Long", entry: 1.0810, exit: 1.0845, pnl: 175.00, pnlPercent: 0.32, rMultiple: 1.1, duration: "2h 10m" },
  { id: "t15", time: "2025-04-10 10:05", strategy: "MACD Div Swing", asset: "SPY", side: "Short", entry: 582.10, exit: 578.30, pnl: 190.00, pnlPercent: 0.65, rMultiple: 1.3, duration: "4h 50m" },
  { id: "t16", time: "2025-04-09 20:30", strategy: "BTC Mean Rev", asset: "BTC/USDT", side: "Long", entry: 88100, exit: 90500, pnl: 600.00, pnlPercent: 2.72, rMultiple: 3.4, duration: "9h 45m" },
  { id: "t17", time: "2025-04-09 14:15", strategy: "Boll Squeeze", asset: "EUR/USD", side: "Short", entry: 1.0835, exit: 1.0850, pnl: -75.00, pnlPercent: -0.14, rMultiple: -0.5, duration: "45m" },
  { id: "t18", time: "2025-04-09 08:00", strategy: "MACD Div Swing", asset: "SPY", side: "Long", entry: 574.20, exit: 577.80, pnl: 180.00, pnlPercent: 0.63, rMultiple: 1.2, duration: "1d 6h" },
  { id: "t19", time: "2025-04-08 22:40", strategy: "BTC Mean Rev", asset: "BTC/USDT", side: "Long", entry: 86750, exit: 87200, pnl: 112.50, pnlPercent: 0.52, rMultiple: 0.8, duration: "2h 30m" },
  { id: "t20", time: "2025-04-08 17:10", strategy: "Boll Squeeze", asset: "EUR/USD", side: "Long", entry: 1.0780, exit: 1.0820, pnl: 200.00, pnlPercent: 0.37, rMultiple: 1.2, duration: "3h 15m" },
];

// ── OHLCV Data Generator ──
export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export function generateCandleData(
  asset: "BTC" | "SPY" | "EURUSD",
  count: number = 365
): Candle[] {
  const configs = {
    BTC: { start: 42000, volatility: 0.025, drift: 0.0008, seed: 42 },
    SPY: { start: 450, volatility: 0.008, drift: 0.0003, seed: 77 },
    EURUSD: { start: 1.055, volatility: 0.003, drift: 0.00005, seed: 99 },
  };
  const cfg = configs[asset];
  const rand = seededRandom(cfg.seed);
  const candles: Candle[] = [];

  let price = cfg.start;
  // Start from Jan 1 2024
  const startTime = Math.floor(new Date("2024-01-01").getTime() / 1000);
  const interval = 86400; // daily

  for (let i = 0; i < count; i++) {
    const change = (rand() - 0.48) * cfg.volatility + cfg.drift;
    const open = price;
    const close = open * (1 + change);
    const wickUp = Math.abs(change) * rand() * 0.5;
    const wickDown = Math.abs(change) * rand() * 0.5;
    const high = Math.max(open, close) * (1 + wickUp);
    const low = Math.min(open, close) * (1 - wickDown);
    const volume = Math.floor(1000000 + rand() * 5000000);

    candles.push({
      time: startTime + i * interval,
      open: Number(open.toFixed(asset === "EURUSD" ? 5 : 2)),
      high: Number(high.toFixed(asset === "EURUSD" ? 5 : 2)),
      low: Number(low.toFixed(asset === "EURUSD" ? 5 : 2)),
      close: Number(close.toFixed(asset === "EURUSD" ? 5 : 2)),
      volume,
    });

    price = close;
  }

  return candles;
}

// ── Portfolio Equity Curve ──
export interface EquityPoint {
  time: string; // YYYY-MM-DD
  value: number;
}

export function generateEquityCurve(points: number = 90): EquityPoint[] {
  const data: EquityPoint[] = [];
  const rand = seededRandom(123);
  let equity = 50000;
  const target = 53500;
  const dailyDrift = (target - equity) / points;

  const startDate = new Date("2025-01-15");

  for (let i = 0; i < points; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const noise = (rand() - 0.45) * 400;
    equity += dailyDrift + noise;
    equity = Math.max(equity, 48000);

    data.push({
      time: dateStr,
      value: Number(equity.toFixed(2)),
    });
  }

  return data;
}

// ── Sparkline data for dashboard stat card ──
export function generateSparkline(points: number = 20, seed: number = 456): number[] {
  const rand = seededRandom(seed);
  const data: number[] = [];
  let val = 50;
  for (let i = 0; i < points; i++) {
    val += (rand() - 0.45) * 8;
    val = Math.max(10, Math.min(90, val));
    data.push(val);
  }
  return data;
}

// ── RSI Data Generator (for backtest panel) ──
export function generateRSIData(count: number = 365): { time: number; value: number }[] {
  const rand = seededRandom(789);
  const data: { time: number; value: number }[] = [];
  const startTime = Math.floor(new Date("2024-01-01").getTime() / 1000);
  let rsi = 50;

  for (let i = 0; i < count; i++) {
    rsi += (rand() - 0.5) * 12;
    rsi = Math.max(10, Math.min(95, rsi));
    data.push({
      time: startTime + i * 86400,
      value: Number(rsi.toFixed(1)),
    });
  }

  return data;
}

// ── Backtest sample trades (for strategy page) ──
export const backtestTrades: Trade[] = sampleTrades.filter(t => t.asset === "BTC/USDT").concat([
  { id: "bt1", time: "2024-12-20 08:00", strategy: "RSI Mean Rev", asset: "BTC/USDT", side: "Long", entry: 96800, exit: 98200, pnl: 350.00, pnlPercent: 1.45, rMultiple: 1.8, duration: "5h 20m" },
  { id: "bt2", time: "2024-11-15 14:00", strategy: "RSI Mean Rev", asset: "BTC/USDT", side: "Long", entry: 88500, exit: 87900, pnl: -150.00, pnlPercent: -0.68, rMultiple: -0.8, duration: "2h 10m" },
  { id: "bt3", time: "2024-10-08 20:00", strategy: "RSI Mean Rev", asset: "BTC/USDT", side: "Long", entry: 62400, exit: 64800, pnl: 480.00, pnlPercent: 3.85, rMultiple: 4.2, duration: "12h 30m" },
  { id: "bt4", time: "2024-09-22 10:00", strategy: "RSI Mean Rev", asset: "BTC/USDT", side: "Long", entry: 63100, exit: 62500, pnl: -190.00, pnlPercent: -0.95, rMultiple: -1.0, duration: "3h 45m" },
]);

// ── Backtest stats ──
export const backtestStats = {
  totalReturn: 12.5,
  winRate: 55,
  sharpe: 1.4,
  maxDrawdown: -8.2,
  totalTrades: 87,
  health: "solid-edge" as HealthRating,
};

// ── Preset Node Graphs ──

export interface PresetNodeDef {
  id: string;
  type: string;
  label: string;
  category: "data" | "indicator" | "condition" | "action" | "risk";
  icon: string;
  nodeType: string;
  params: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface PresetEdgeDef {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface PresetNodeGraph {
  presetName: string;
  nodes: { id: string; data: PresetNodeDef; position: { x: number; y: number } }[];
  edges: PresetEdgeDef[];
  defaultAsset: string;
  defaultTimeframe: string;
}

export const presetNodeGraphs: Record<string, PresetNodeGraph> = {
  "btc-mean-rev": {
    presetName: "RSI Mean Reversion",
    defaultAsset: "BTC/USDT",
    defaultTimeframe: "4h",
    nodes: [
      { id: "p-price-1", position: { x: 50, y: 180 }, data: { id: "p-price-1", type: "strategyNode", label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "BTC/USDT", timeframe: "4h" }, position: { x: 50, y: 180 } } },
      { id: "p-rsi-1", position: { x: 350, y: 180 }, data: { id: "p-rsi-1", type: "strategyNode", label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: { period: 14, source: "close" }, position: { x: 350, y: 180 } } },
      { id: "p-cond-1", position: { x: 650, y: 120 }, data: { id: "p-cond-1", type: "strategyNode", label: "RSI < 30", category: "condition", icon: "ChevronDown", nodeType: "less-than", params: { operator: "<", value: 30 }, position: { x: 650, y: 120 } } },
      { id: "p-entry-1", position: { x: 950, y: 120 }, data: { id: "p-entry-1", type: "strategyNode", label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" }, position: { x: 950, y: 120 } } },
      { id: "p-sl-1", position: { x: 1200, y: 60 }, data: { id: "p-sl-1", type: "strategyNode", label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2, type: "Fixed" }, position: { x: 1200, y: 60 } } },
      { id: "p-tp-1", position: { x: 1200, y: 200 }, data: { id: "p-tp-1", type: "strategyNode", label: "Take Profit", category: "risk", icon: "ShieldCheck", nodeType: "take-profit", params: { percent: 6, type: "Fixed" }, position: { x: 1200, y: 200 } } },
    ],
    edges: [
      { source: "p-price-1", target: "p-rsi-1" },
      { source: "p-rsi-1", target: "p-cond-1" },
      { source: "p-cond-1", target: "p-entry-1" },
      { source: "p-entry-1", target: "p-sl-1" },
      { source: "p-entry-1", target: "p-tp-1" },
    ],
  },
  "macd-div-swing": {
    presetName: "MACD Divergence Swing",
    defaultAsset: "SPY",
    defaultTimeframe: "1D",
    nodes: [
      { id: "p-price-1", position: { x: 50, y: 180 }, data: { id: "p-price-1", type: "strategyNode", label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "SPY", timeframe: "1D" }, position: { x: 50, y: 180 } } },
      { id: "p-macd-1", position: { x: 350, y: 180 }, data: { id: "p-macd-1", type: "strategyNode", label: "MACD", category: "indicator", icon: "Activity", nodeType: "macd", params: { fast: 12, slow: 26, signal: 9 }, position: { x: 350, y: 180 } } },
      { id: "p-cond-1", position: { x: 650, y: 120 }, data: { id: "p-cond-1", type: "strategyNode", label: "Crosses Above Signal", category: "condition", icon: "ArrowUpRight", nodeType: "crosses-above", params: { operator: "crosses above", value: 0 }, position: { x: 650, y: 120 } } },
      { id: "p-entry-1", position: { x: 950, y: 120 }, data: { id: "p-entry-1", type: "strategyNode", label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" }, position: { x: 950, y: 120 } } },
      { id: "p-sl-1", position: { x: 1200, y: 60 }, data: { id: "p-sl-1", type: "strategyNode", label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -3, type: "Fixed" }, position: { x: 1200, y: 60 } } },
      { id: "p-tp-1", position: { x: 1200, y: 200 }, data: { id: "p-tp-1", type: "strategyNode", label: "Take Profit", category: "risk", icon: "ShieldCheck", nodeType: "take-profit", params: { percent: 8, type: "Fixed" }, position: { x: 1200, y: 200 } } },
    ],
    edges: [
      { source: "p-price-1", target: "p-macd-1" },
      { source: "p-macd-1", target: "p-cond-1" },
      { source: "p-cond-1", target: "p-entry-1" },
      { source: "p-entry-1", target: "p-sl-1" },
      { source: "p-entry-1", target: "p-tp-1" },
    ],
  },
  "boll-squeeze": {
    presetName: "Bollinger Squeeze",
    defaultAsset: "EUR/USD",
    defaultTimeframe: "1h",
    nodes: [
      { id: "p-price-1", position: { x: 50, y: 180 }, data: { id: "p-price-1", type: "strategyNode", label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "EUR/USD", timeframe: "1h" }, position: { x: 50, y: 180 } } },
      { id: "p-bb-1", position: { x: 350, y: 180 }, data: { id: "p-bb-1", type: "strategyNode", label: "Bollinger Bands", category: "indicator", icon: "Layers", nodeType: "bollinger", params: { period: 20, stdDev: 2 }, position: { x: 350, y: 180 } } },
      { id: "p-cond-1", position: { x: 650, y: 120 }, data: { id: "p-cond-1", type: "strategyNode", label: "Price < Lower Band", category: "condition", icon: "ChevronDown", nodeType: "less-than", params: { operator: "<", value: "lowerBand" }, position: { x: 650, y: 120 } } },
      { id: "p-entry-1", position: { x: 950, y: 120 }, data: { id: "p-entry-1", type: "strategyNode", label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" }, position: { x: 950, y: 120 } } },
      { id: "p-sl-1", position: { x: 1200, y: 60 }, data: { id: "p-sl-1", type: "strategyNode", label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -1.5, type: "Fixed" }, position: { x: 1200, y: 60 } } },
      { id: "p-tp-1", position: { x: 1200, y: 200 }, data: { id: "p-tp-1", type: "strategyNode", label: "Take Profit", category: "risk", icon: "ShieldCheck", nodeType: "take-profit", params: { percent: 4, type: "Fixed" }, position: { x: 1200, y: 200 } } },
    ],
    edges: [
      { source: "p-price-1", target: "p-bb-1" },
      { source: "p-bb-1", target: "p-cond-1" },
      { source: "p-cond-1", target: "p-entry-1" },
      { source: "p-entry-1", target: "p-sl-1" },
      { source: "p-entry-1", target: "p-tp-1" },
    ],
  },
  "golden-cross": {
    presetName: "Golden Cross Momentum",
    defaultAsset: "ETH/USDT",
    defaultTimeframe: "1D",
    nodes: [
      { id: "p-price-1", position: { x: 50, y: 180 }, data: { id: "p-price-1", type: "strategyNode", label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "ETH/USDT", timeframe: "1D" }, position: { x: 50, y: 180 } } },
      { id: "p-ema50-1", position: { x: 300, y: 100 }, data: { id: "p-ema50-1", type: "strategyNode", label: "EMA(50)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 50, source: "close" }, position: { x: 300, y: 100 } } },
      { id: "p-ema200-1", position: { x: 300, y: 280 }, data: { id: "p-ema200-1", type: "strategyNode", label: "EMA(200)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 200, source: "close" }, position: { x: 300, y: 280 } } },
      { id: "p-cond-1", position: { x: 600, y: 180 }, data: { id: "p-cond-1", type: "strategyNode", label: "EMA50 Crosses Above EMA200", category: "condition", icon: "ArrowUpRight", nodeType: "crosses-above", params: { operator: "crosses above", value: 0 }, position: { x: 600, y: 180 } } },
      { id: "p-entry-1", position: { x: 900, y: 180 }, data: { id: "p-entry-1", type: "strategyNode", label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" }, position: { x: 900, y: 180 } } },
      { id: "p-sl-1", position: { x: 1150, y: 120 }, data: { id: "p-sl-1", type: "strategyNode", label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -5, type: "Fixed" }, position: { x: 1150, y: 120 } } },
      { id: "p-tp-1", position: { x: 1150, y: 260 }, data: { id: "p-tp-1", type: "strategyNode", label: "Take Profit", category: "risk", icon: "ShieldCheck", nodeType: "take-profit", params: { percent: 15, type: "Fixed" }, position: { x: 1150, y: 260 } } },
    ],
    edges: [
      { source: "p-price-1", target: "p-ema50-1" },
      { source: "p-price-1", target: "p-ema200-1" },
      { source: "p-ema50-1", target: "p-cond-1" },
      { source: "p-ema200-1", target: "p-cond-1" },
      { source: "p-cond-1", target: "p-entry-1" },
      { source: "p-entry-1", target: "p-sl-1" },
      { source: "p-entry-1", target: "p-tp-1" },
    ],
  },
  "vol-breakout": {
    presetName: "Volume-Weighted Breakout",
    defaultAsset: "AAPL",
    defaultTimeframe: "1D",
    nodes: [
      { id: "p-price-1", position: { x: 50, y: 180 }, data: { id: "p-price-1", type: "strategyNode", label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "AAPL", timeframe: "1D" }, position: { x: 50, y: 180 } } },
      { id: "p-sma-1", position: { x: 350, y: 180 }, data: { id: "p-sma-1", type: "strategyNode", label: "SMA(20)", category: "indicator", icon: "Minus", nodeType: "sma", params: { period: 20, source: "close" }, position: { x: 350, y: 180 } } },
      { id: "p-cond-1", position: { x: 650, y: 120 }, data: { id: "p-cond-1", type: "strategyNode", label: "Price > SMA20", category: "condition", icon: "ChevronUp", nodeType: "greater-than", params: { operator: ">", value: 0 }, position: { x: 650, y: 120 } } },
      { id: "p-entry-1", position: { x: 950, y: 120 }, data: { id: "p-entry-1", type: "strategyNode", label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" }, position: { x: 950, y: 120 } } },
      { id: "p-sl-1", position: { x: 1200, y: 60 }, data: { id: "p-sl-1", type: "strategyNode", label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2, type: "Fixed" }, position: { x: 1200, y: 60 } } },
      { id: "p-tp-1", position: { x: 1200, y: 200 }, data: { id: "p-tp-1", type: "strategyNode", label: "Take Profit", category: "risk", icon: "ShieldCheck", nodeType: "take-profit", params: { percent: 6, type: "Fixed" }, position: { x: 1200, y: 200 } } },
    ],
    edges: [
      { source: "p-price-1", target: "p-sma-1" },
      { source: "p-sma-1", target: "p-cond-1" },
      { source: "p-cond-1", target: "p-entry-1" },
      { source: "p-entry-1", target: "p-sl-1" },
      { source: "p-entry-1", target: "p-tp-1" },
    ],
  },
  "triple-ema": {
    presetName: "Triple EMA Trend",
    defaultAsset: "BTC/USDT",
    defaultTimeframe: "4h",
    nodes: [
      { id: "p-price-1", position: { x: 50, y: 180 }, data: { id: "p-price-1", type: "strategyNode", label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "BTC/USDT", timeframe: "4h" }, position: { x: 50, y: 180 } } },
      { id: "p-ema8-1", position: { x: 300, y: 100 }, data: { id: "p-ema8-1", type: "strategyNode", label: "EMA(8)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 8, source: "close" }, position: { x: 300, y: 100 } } },
      { id: "p-ema21-1", position: { x: 300, y: 280 }, data: { id: "p-ema21-1", type: "strategyNode", label: "EMA(21)", category: "indicator", icon: "TrendingUp", nodeType: "ema", params: { period: 21, source: "close" }, position: { x: 300, y: 280 } } },
      { id: "p-cond-1", position: { x: 600, y: 180 }, data: { id: "p-cond-1", type: "strategyNode", label: "EMA8 > EMA21", category: "condition", icon: "ChevronUp", nodeType: "greater-than", params: { operator: ">", value: 0 }, position: { x: 600, y: 180 } } },
      { id: "p-entry-1", position: { x: 900, y: 180 }, data: { id: "p-entry-1", type: "strategyNode", label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" }, position: { x: 900, y: 180 } } },
      { id: "p-sl-1", position: { x: 1150, y: 120 }, data: { id: "p-sl-1", type: "strategyNode", label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2.5, type: "Fixed" }, position: { x: 1150, y: 120 } } },
      { id: "p-tp-1", position: { x: 1150, y: 260 }, data: { id: "p-tp-1", type: "strategyNode", label: "Take Profit", category: "risk", icon: "ShieldCheck", nodeType: "take-profit", params: { percent: 7, type: "Fixed" }, position: { x: 1150, y: 260 } } },
    ],
    edges: [
      { source: "p-price-1", target: "p-ema8-1" },
      { source: "p-price-1", target: "p-ema21-1" },
      { source: "p-ema8-1", target: "p-cond-1" },
      { source: "p-ema21-1", target: "p-cond-1" },
      { source: "p-cond-1", target: "p-entry-1" },
      { source: "p-entry-1", target: "p-sl-1" },
      { source: "p-entry-1", target: "p-tp-1" },
    ],
  },
  "rsi-macd-combo": {
    presetName: "RSI + MACD Combo",
    defaultAsset: "BTC/USDT",
    defaultTimeframe: "4h",
    nodes: [
      { id: "p-price-1", position: { x: 50, y: 200 }, data: { id: "p-price-1", type: "strategyNode", label: "Price Data", category: "data", icon: "BarChart3", nodeType: "price-data", params: { asset: "BTC/USDT", timeframe: "4h" }, position: { x: 50, y: 200 } } },
      { id: "p-rsi-1", position: { x: 300, y: 80 }, data: { id: "p-rsi-1", type: "strategyNode", label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: { period: 14, source: "close" }, position: { x: 300, y: 80 } } },
      { id: "p-macd-1", position: { x: 300, y: 320 }, data: { id: "p-macd-1", type: "strategyNode", label: "MACD", category: "indicator", icon: "Activity", nodeType: "macd", params: { fast: 12, slow: 26, signal: 9 }, position: { x: 300, y: 320 } } },
      { id: "p-cond-rsi", position: { x: 570, y: 80 }, data: { id: "p-cond-rsi", type: "strategyNode", label: "RSI < 30", category: "condition", icon: "ChevronDown", nodeType: "less-than", params: { operator: "<", value: 30 }, position: { x: 570, y: 80 } } },
      { id: "p-cond-macd", position: { x: 570, y: 320 }, data: { id: "p-cond-macd", type: "strategyNode", label: "Crosses Above Signal", category: "condition", icon: "ArrowUpRight", nodeType: "crosses-above", params: { operator: "crosses above", value: 0 }, position: { x: 570, y: 320 } } },
      { id: "p-and-1", position: { x: 830, y: 200 }, data: { id: "p-and-1", type: "strategyNode", label: "AND", category: "condition", icon: "GitMerge", nodeType: "and-gate", params: { logic: "AND" }, position: { x: 830, y: 200 } } },
      { id: "p-entry-1", position: { x: 1050, y: 200 }, data: { id: "p-entry-1", type: "strategyNode", label: "Market Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: { side: "Long", type: "Market" }, position: { x: 1050, y: 200 } } },
      { id: "p-sl-1", position: { x: 1300, y: 140 }, data: { id: "p-sl-1", type: "strategyNode", label: "Stop Loss", category: "risk", icon: "ShieldOff", nodeType: "stop-loss", params: { percent: -2, type: "Fixed" }, position: { x: 1300, y: 140 } } },
      { id: "p-tp-1", position: { x: 1300, y: 280 }, data: { id: "p-tp-1", type: "strategyNode", label: "Take Profit", category: "risk", icon: "ShieldCheck", nodeType: "take-profit", params: { percent: 6, type: "Fixed" }, position: { x: 1300, y: 280 } } },
    ],
    edges: [
      { source: "p-price-1", target: "p-rsi-1" },
      { source: "p-price-1", target: "p-macd-1" },
      { source: "p-rsi-1", target: "p-cond-rsi" },
      { source: "p-macd-1", target: "p-cond-macd" },
      { source: "p-cond-rsi", target: "p-and-1", targetHandle: "input-0" },
      { source: "p-cond-macd", target: "p-and-1", targetHandle: "input-1" },
      { source: "p-and-1", target: "p-entry-1" },
      { source: "p-entry-1", target: "p-sl-1" },
      { source: "p-entry-1", target: "p-tp-1" },
    ],
  },
};

// ── Node library items ──
export interface NodeLibraryItem {
  type: string;
  label: string;
  category: "data" | "indicator" | "condition" | "action" | "risk";
  icon: string;
}

export const nodeLibrary: NodeLibraryItem[] = [
  // Data Sources
  { type: "price-data", label: "Price Data", category: "data", icon: "BarChart3" },
  { type: "volume-data", label: "Volume Data", category: "data", icon: "BarChart" },
  { type: "order-book", label: "Order Book", category: "data", icon: "BookOpen" },
  // Indicators
  { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
  { type: "macd", label: "MACD", category: "indicator", icon: "Activity" },
  { type: "bollinger", label: "Bollinger Bands", category: "indicator", icon: "Layers" },
  { type: "ema", label: "EMA", category: "indicator", icon: "TrendingUp" },
  { type: "sma", label: "SMA", category: "indicator", icon: "Minus" },
  { type: "volume-ma", label: "Volume MA", category: "indicator", icon: "BarChart" },
  { type: "atr", label: "ATR", category: "indicator", icon: "Activity" },
  { type: "stochastic", label: "Stochastic", category: "indicator", icon: "TrendingUp" },
  { type: "adx", label: "ADX", category: "indicator", icon: "Gauge" },
  { type: "roc", label: "ROC", category: "indicator", icon: "Zap" },
  { type: "vwap", label: "VWAP", category: "indicator", icon: "BarChart3" },
  { type: "donchian", label: "Donchian Channel", category: "indicator", icon: "Layers" },
  { type: "bb-bandwidth", label: "BB Bandwidth", category: "indicator", icon: "Layers" },
  { type: "pivot-points", label: "Pivot Points", category: "indicator", icon: "Target" },
  { type: "swing-hl", label: "Swing High/Low", category: "indicator", icon: "ArrowUpDown" },
  { type: "candle-pattern", label: "Candle Patterns", category: "indicator", icon: "CandlestickChart" },
  // Conditions
  { type: "greater-than", label: "Greater Than", category: "condition", icon: "ChevronUp" },
  { type: "less-than", label: "Less Than", category: "condition", icon: "ChevronDown" },
  { type: "crosses-above", label: "Crosses Above", category: "condition", icon: "ArrowUpRight" },
  { type: "crosses-below", label: "Crosses Below", category: "condition", icon: "ArrowDownRight" },
  { type: "and-gate", label: "AND", category: "condition", icon: "GitMerge" },
  { type: "or-gate", label: "OR", category: "condition", icon: "GitBranch" },
  { type: "in-range", label: "In Range", category: "condition", icon: "ArrowLeftRight" },
  // Actions
  { type: "market-entry", label: "Market Entry", category: "action", icon: "LogIn" },
  { type: "limit-entry", label: "Limit Entry", category: "action", icon: "Target" },
  { type: "exit-position", label: "Exit Position", category: "action", icon: "LogOut" },
  { type: "alert", label: "Alert", category: "action", icon: "Bell" },
  // Risk Management
  { type: "stop-loss", label: "Stop Loss", category: "risk", icon: "ShieldOff" },
  { type: "take-profit", label: "Take Profit", category: "risk", icon: "ShieldCheck" },
  { type: "position-size", label: "Position Size", category: "risk", icon: "Percent" },
  { type: "trailing-stop", label: "Trailing Stop", category: "risk", icon: "Shield" },
];
