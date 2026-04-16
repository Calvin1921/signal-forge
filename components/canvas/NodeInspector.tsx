"use client";

import { FloatingPanel } from "@/components/panels/FloatingPanel";
import { useCanvasStore, type StrategyNodeData } from "@/lib/stores/canvasStore";

interface NodeInspectorProps {
  onClose: () => void;
}

// ── Field Definitions ──

interface FieldDef {
  key: string;
  label: string;
  type: "number" | "select" | "text";
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

const fieldsByNodeType: Record<string, FieldDef[]> = {
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
    { key: "fast", label: "Fast Period", type: "number", min: 2, max: 100, step: 1 },
    { key: "slow", label: "Slow Period", type: "number", min: 2, max: 200, step: 1 },
    { key: "signal", label: "Signal Period", type: "number", min: 2, max: 50, step: 1 },
  ],
  bollinger: [
    { key: "period", label: "Period", type: "number", min: 2, max: 100, step: 1 },
    { key: "stdDev", label: "Std Deviation", type: "number", min: 0.5, max: 5, step: 0.5 },
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
    { key: "type", label: "Order Type", type: "select", options: ["Market", "Limit"] },
    { key: "price", label: "Limit Price", type: "number", min: 0, max: 1000000, step: 0.01 },
  ],
  "exit-position": [
    { key: "side", label: "Side", type: "select", options: ["Long", "Short"] },
    { key: "type", label: "Order Type", type: "select", options: ["Market", "Limit"] },
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
    { key: "percent", label: "Position Size %", type: "number", min: 0.1, max: 100, step: 0.1 },
    { key: "maxRisk", label: "Max Risk %", type: "number", min: 0.1, max: 10, step: 0.1 },
  ],
  "trailing-stop": [
    { key: "percent", label: "Trail %", type: "number", min: -50, max: 0, step: 0.1 },
    { key: "activation", label: "Activation %", type: "number", min: 0, max: 50, step: 0.1 },
  ],
};

// ── Component ──

export function NodeInspector({ onClose }: NodeInspectorProps) {
  const { nodes, selectedNodeId, updateNodeData } = useCanvasStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) return null;

  const data = node.data as StrategyNodeData;

  const categoryColors: Record<string, string> = {
    data: "var(--node-data)",
    indicator: "var(--node-indicator)",
    condition: "var(--node-condition)",
    action: "var(--node-action)",
    risk: "var(--node-risk)",
  };

  const color = categoryColors[data.category] || "var(--accent-primary)";
  const fields = fieldsByNodeType[data.nodeType] || [];

  return (
    <FloatingPanel
      title={`${data.label} Settings`}
      onClose={onClose}
      initialPosition={{ x: 80, y: 120 }}
      width={280}
    >
      <div className="flex flex-col gap-3">
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: color }}
          />
          <span className="text-caption-1 text-secondary uppercase tracking-wider">
            {data.category}
          </span>
          <span className="text-caption-2 text-muted ml-auto font-mono-data">
            {node.id}
          </span>
        </div>

        {/* Parameter fields */}
        {fields.map((field) => {
          const currentValue = data.params[field.key];

          if (field.type === "select") {
            return (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-footnote text-secondary">{field.label}</label>
                <select
                  value={String(currentValue ?? "")}
                  onChange={(e) => updateNodeData(node.id, field.key, e.target.value)}
                  className="px-3 py-2 min-h-[44px] rounded-[var(--radius-sm)] bg-surface-3 text-subhead text-primary font-mono-data outline-none focus-ring appearance-none cursor-pointer"
                  style={{ background: "var(--surface-3)" }}
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.type === "number") {
            return (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-footnote text-secondary">{field.label}</label>
                <input
                  type="number"
                  value={currentValue != null ? Number(currentValue) : ""}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  onChange={(e) => {
                    const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                    updateNodeData(node.id, field.key, val);
                  }}
                  className="px-3 py-2 min-h-[44px] rounded-[var(--radius-sm)] bg-surface-3 text-subhead font-mono-data text-primary outline-none focus-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            );
          }

          if (field.type === "text") {
            return (
              <div key={field.key} className="flex flex-col gap-1">
                <label className="text-footnote text-secondary">{field.label}</label>
                <input
                  type="text"
                  value={String(currentValue ?? "")}
                  onChange={(e) => updateNodeData(node.id, field.key, e.target.value)}
                  className="px-3 py-2 min-h-[44px] rounded-[var(--radius-sm)] bg-surface-3 text-subhead text-primary outline-none focus-ring"
                />
              </div>
            );
          }

          return null;
        })}

        {/* Fallback for unknown node types */}
        {fields.length === 0 &&
          data.params &&
          Object.entries(data.params).map(([key, val]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-footnote text-secondary capitalize">{key}</label>
              <div className="px-3 py-2 rounded-[var(--radius-sm)] bg-surface-3 text-subhead font-mono-data text-primary">
                {String(val)}
              </div>
            </div>
          ))}
      </div>
    </FloatingPanel>
  );
}
