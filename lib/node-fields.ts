export interface FieldDef {
  key: string;
  label: string;
  type: "number" | "select" | "text";
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export const fieldsByNodeType: Record<string, FieldDef[]> = {
  "price-data": [
    { key: "asset", label: "Asset", type: "select", options: ["BTC/USDT", "ETH/USDT", "SPY", "AAPL", "EUR/USD"] },
    { key: "timeframe", label: "Timeframe", type: "select", options: ["1m", "5m", "15m", "1h", "4h", "1D"] },
  ],
  "volume-data": [
    { key: "asset", label: "Asset", type: "select", options: ["BTC/USDT", "ETH/USDT", "SPY", "AAPL", "EUR/USD"] },
    { key: "timeframe", label: "Timeframe", type: "select", options: ["1m", "5m", "15m", "1h", "4h", "1D"] },
  ],
  "order-book": [
    { key: "asset", label: "Asset", type: "select", options: ["BTC/USDT", "ETH/USDT", "SPY", "AAPL", "EUR/USD"] },
    { key: "depth", label: "Depth", type: "number", min: 1, max: 50, step: 1 },
  ],
  rsi: [
    { key: "period", label: "Period", type: "number", min: 2, max: 100, step: 1 },
    { key: "source", label: "Source", type: "select", options: ["close", "open", "high", "low", "hl2", "hlc3"] },
  ],
  macd: [
    { key: "fast", label: "Fast", type: "number", min: 2, max: 100, step: 1 },
    { key: "slow", label: "Slow", type: "number", min: 2, max: 200, step: 1 },
    { key: "signal", label: "Signal", type: "number", min: 2, max: 50, step: 1 },
  ],
  bollinger: [
    { key: "period", label: "Period", type: "number", min: 2, max: 100, step: 1 },
    { key: "stdDev", label: "Std Dev", type: "number", min: 0.5, max: 5, step: 0.5 },
  ],
  ema: [
    { key: "period", label: "Period", type: "number", min: 2, max: 500, step: 1 },
    { key: "source", label: "Source", type: "select", options: ["close", "open", "high", "low", "hl2", "hlc3"] },
  ],
  sma: [
    { key: "period", label: "Period", type: "number", min: 2, max: 500, step: 1 },
    { key: "source", label: "Source", type: "select", options: ["close", "open", "high", "low", "hl2", "hlc3"] },
  ],
  "volume-ma": [
    { key: "period", label: "Period", type: "number", min: 2, max: 200, step: 1 },
  ],
  atr: [
    { key: "period", label: "Period", type: "number", min: 2, max: 100, step: 1 },
  ],
  stochastic: [
    { key: "kPeriod", label: "%K Period", type: "number", min: 2, max: 100, step: 1 },
    { key: "dPeriod", label: "%D Period", type: "number", min: 2, max: 50, step: 1 },
    { key: "smooth", label: "Smooth", type: "number", min: 1, max: 10, step: 1 },
  ],
  adx: [
    { key: "period", label: "Period", type: "number", min: 2, max: 100, step: 1 },
  ],
  roc: [
    { key: "period", label: "Period", type: "number", min: 1, max: 200, step: 1 },
  ],
  vwap: [],
  donchian: [
    { key: "period", label: "Period", type: "number", min: 2, max: 200, step: 1 },
  ],
  "bb-bandwidth": [
    { key: "period", label: "Period", type: "number", min: 2, max: 100, step: 1 },
    { key: "stdDev", label: "Std Dev", type: "number", min: 0.5, max: 5, step: 0.5 },
  ],
  "pivot-points": [
    { key: "type", label: "Type", type: "select", options: ["Standard", "Fibonacci", "Camarilla"] },
  ],
  "swing-hl": [
    { key: "lookback", label: "Lookback", type: "number", min: 2, max: 50, step: 1 },
  ],
  "candle-pattern": [
    { key: "pattern", label: "Pattern", type: "select", options: ["bullish_engulfing", "bearish_engulfing", "hammer", "shooting_star", "doji", "morning_star", "evening_star"] },
  ],
  "in-range": [
    { key: "low", label: "Low", type: "number", min: -10000, max: 100000, step: 0.1 },
    { key: "high", label: "High", type: "number", min: -10000, max: 100000, step: 0.1 },
  ],
  "greater-than": [
    { key: "operator", label: "Operator", type: "select", options: [">", ">=", "<", "<=", "crosses above", "crosses below"] },
    { key: "value", label: "Value", type: "number", min: -10000, max: 100000, step: 0.1 },
  ],
  "less-than": [
    { key: "operator", label: "Operator", type: "select", options: [">", ">=", "<", "<=", "crosses above", "crosses below"] },
    { key: "value", label: "Value", type: "number", min: -10000, max: 100000, step: 0.1 },
  ],
  "crosses-above": [
    { key: "operator", label: "Operator", type: "select", options: [">", ">=", "<", "<=", "crosses above", "crosses below"] },
    { key: "value", label: "Value", type: "number", min: -10000, max: 100000, step: 0.1 },
  ],
  "crosses-below": [
    { key: "operator", label: "Operator", type: "select", options: [">", ">=", "<", "<=", "crosses above", "crosses below"] },
    { key: "value", label: "Value", type: "number", min: -10000, max: 100000, step: 0.1 },
  ],
  "and-gate": [
    { key: "logic", label: "Logic", type: "select", options: ["AND", "OR"] },
  ],
  "or-gate": [
    { key: "logic", label: "Logic", type: "select", options: ["AND", "OR"] },
  ],
  "market-entry": [
    { key: "side", label: "Side", type: "select", options: ["Long", "Short"] },
    { key: "type", label: "Order", type: "select", options: ["Market", "Limit"] },
    { key: "maxHoldBars", label: "Max Hold", type: "number", min: 1, max: 500, step: 1 },
  ],
  "limit-entry": [
    { key: "side", label: "Side", type: "select", options: ["Long", "Short"] },
    { key: "type", label: "Order", type: "select", options: ["Market", "Limit"] },
    { key: "price", label: "Price", type: "number", min: 0, max: 1000000, step: 0.01 },
  ],
  "exit-position": [
    { key: "side", label: "Side", type: "select", options: ["Long", "Short"] },
    { key: "type", label: "Order", type: "select", options: ["Market", "Limit"] },
  ],
  alert: [
    { key: "message", label: "Message", type: "text" },
  ],
  "stop-loss": [
    { key: "percent", label: "SL %", type: "number", min: -50, max: 0, step: 0.1 },
    { key: "type", label: "Type", type: "select", options: ["Fixed", "ATR-based"] },
    { key: "atrPeriod", label: "ATR Period", type: "number", min: 2, max: 100, step: 1 },
    { key: "atrMultiplier", label: "ATR Mult", type: "number", min: 0.1, max: 10, step: 0.1 },
  ],
  "take-profit": [
    { key: "percent", label: "TP %", type: "number", min: 0, max: 100, step: 0.1 },
    { key: "type", label: "Type", type: "select", options: ["Fixed", "ATR-based"] },
    { key: "atrPeriod", label: "ATR Period", type: "number", min: 2, max: 100, step: 1 },
    { key: "atrMultiplier", label: "ATR Mult", type: "number", min: 0.1, max: 10, step: 0.1 },
  ],
  "position-size": [
    { key: "percent", label: "Size %", type: "number", min: 0.1, max: 100, step: 0.1 },
    { key: "maxRisk", label: "Max Risk %", type: "number", min: 0.1, max: 10, step: 0.1 },
  ],
  "trailing-stop": [
    { key: "percent", label: "Trail %", type: "number", min: -50, max: 0, step: 0.1 },
    { key: "activation", label: "Activation %", type: "number", min: 0, max: 50, step: 0.1 },
  ],
};

export const CATEGORIES = ["data", "indicator", "condition", "action", "risk"] as const;
export type NodeCategory = (typeof CATEGORIES)[number];

export const categoryColors: Record<string, string> = {
  data: "var(--node-data)",
  indicator: "var(--node-indicator)",
  condition: "var(--node-condition)",
  action: "var(--node-action)",
  risk: "var(--node-risk)",
};

export const categoryLabels: Record<string, string> = {
  data: "Data Source",
  indicator: "Indicator",
  condition: "Condition",
  action: "Action",
  risk: "Risk Mgmt",
};
