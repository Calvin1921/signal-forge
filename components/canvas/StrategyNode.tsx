"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import * as Icons from "lucide-react";
import { type StrategyNodeData, validateStrategy } from "@/lib/stores/canvasStore";
import { useCanvasStore } from "@/lib/stores/canvasStore";

// ── Field definitions (migrated from NodeInspector) ──

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

const categoryColors: Record<string, string> = {
  data: "var(--node-data)",
  indicator: "var(--node-indicator)",
  condition: "var(--node-condition)",
  action: "var(--node-action)",
  risk: "var(--node-risk)",
};

const categoryLabels: Record<string, string> = {
  data: "Data Source",
  indicator: "Indicator",
  condition: "Condition",
  action: "Action",
  risk: "Risk Mgmt",
};

const logicGateTypes = new Set(["and-gate", "or-gate"]);
const dualInputTypes = new Set(["and-gate", "or-gate", "greater-than", "less-than", "crosses-above", "crosses-below", "in-range"]);

const multiOutputHandles: Record<string, { id: string; label: string; top: string }[]> = {
  stochastic: [
    { id: "output-k", label: "%K", top: "30%" },
    { id: "output-d", label: "%D", top: "70%" },
  ],
  bollinger: [
    { id: "output-upper", label: "Upper", top: "25%" },
    { id: "output-middle", label: "Mid", top: "50%" },
    { id: "output-lower", label: "Lower", top: "75%" },
  ],
  donchian: [
    { id: "output-upper", label: "Upper", top: "25%" },
    { id: "output-middle", label: "Mid", top: "50%" },
    { id: "output-lower", label: "Lower", top: "75%" },
  ],
  macd: [
    { id: "output-macd", label: "MACD", top: "25%" },
    { id: "output-signal", label: "Signal", top: "50%" },
    { id: "output-histogram", label: "Hist", top: "75%" },
  ],
  "pivot-points": [
    { id: "output-pp", label: "PP", top: "20%" },
    { id: "output-r1", label: "R1", top: "40%" },
    { id: "output-s1", label: "S1", top: "60%" },
    { id: "output-r2", label: "R2", top: "80%" },
  ],
  "swing-hl": [
    { id: "output-high", label: "High", top: "30%" },
    { id: "output-low", label: "Low", top: "70%" },
  ],
};

/* Glass style for node cards — thin border, no shadow */
const nodeGlassStyle = {
  background: "oklch(22% 0.012 260 / 0.55)",
  backdropFilter: "blur(20px) saturate(1.4)",
  WebkitBackdropFilter: "blur(20px) saturate(1.4)",
  border: "1px solid oklch(40% 0.008 260 / 0.25)",
};

function nodeBoxShadow(selected: boolean, color: string) {
  if (selected) {
    return `0 0 0 2px ${color}50`;
  }
  return "none";
}

// ── Stop propagation helper for inputs ──
function stopPropagation(e: React.MouseEvent | React.PointerEvent | React.FocusEvent) {
  e.stopPropagation();
}

// ── Inline Field Component ──

function InlineField({
  field,
  value,
  color,
  nodeId,
}: {
  field: FieldDef;
  value: unknown;
  color: string;
  nodeId: string;
}) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const handleChange = useCallback(
    (newVal: string | number) => {
      updateNodeData(nodeId, field.key, newVal);
    },
    [updateNodeData, nodeId, field.key]
  );

  const baseInputClass =
    "text-caption-1 font-mono-data text-primary bg-transparent rounded-[var(--radius-sm)] outline-none px-1.5 py-0.5 w-full focus-ring";

  const focusStyle = {
    "--tw-ring-color": color,
  } as React.CSSProperties;

  if (field.type === "select") {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption-1 text-muted shrink-0 capitalize">{field.label}</span>
        <select
          value={String(value ?? "")}
          onChange={(e) => handleChange(e.target.value)}
          onMouseDown={stopPropagation}
          onPointerDown={stopPropagation}
          onFocus={stopPropagation}
          className={[
            baseInputClass,
            "appearance-none cursor-pointer text-right",
          ].join(" ")}
          style={{
            background: "oklch(20% 0.008 260 / 0.4)",
            maxWidth: "120px",
            ...focusStyle,
          }}
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
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption-1 text-muted shrink-0 capitalize">{field.label}</span>
        <input
          type="number"
          value={value != null ? Number(value) : ""}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => {
            const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
            handleChange(val);
          }}
          onMouseDown={stopPropagation}
          onPointerDown={stopPropagation}
          onFocus={stopPropagation}
          className={[
            baseInputClass,
            "text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          ].join(" ")}
          style={{
            background: "oklch(20% 0.008 260 / 0.4)",
            maxWidth: "80px",
            ...focusStyle,
          }}
        />
      </div>
    );
  }

  // text
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-caption-1 text-muted shrink-0 capitalize">{field.label}</span>
      <input
        type="text"
        value={String(value ?? "")}
        onChange={(e) => handleChange(e.target.value)}
        onMouseDown={stopPropagation}
        onPointerDown={stopPropagation}
        onFocus={stopPropagation}
        className={baseInputClass}
        style={{
          background: "oklch(20% 0.008 260 / 0.4)",
          maxWidth: "140px",
          ...focusStyle,
        }}
      />
    </div>
  );
}

// ── Main Node Component ──

function StrategyNodeComponent({ id, data, selected }: NodeProps & { data: StrategyNodeData }) {
  const nodeData = data as StrategyNodeData;
  const color = categoryColors[nodeData.category] || "var(--accent-primary)";
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ size?: number }>>)[nodeData.icon] || Icons.Box;

  const { nodes, edges } = useCanvasStore();
  const { disconnectedNodeIds } = validateStrategy(nodes, edges);
  const isDisconnected = disconnectedNodeIds.includes(id);

  const fields = fieldsByNodeType[nodeData.nodeType] || [];
  const isLogicGate = logicGateTypes.has(nodeData.nodeType);

  // ── Logic Gate (AND / OR) compact rendering ──
  if (isLogicGate) {
    const gateLabel = nodeData.nodeType === "and-gate" ? "AND" : "OR";
    return (
      <div
        className="relative rounded-[var(--radius-md)]"
        style={{
          ...nodeGlassStyle,
          borderLeft: `4px solid ${color}`,
          boxShadow: nodeBoxShadow(!!selected, color),
          animation: isDisconnected ? "warningPulse 2s ease-in-out infinite" : undefined,
          minWidth: "140px",
          transition: `box-shadow var(--duration-normal) var(--ease-spring)`,
        }}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="input-0"
          className="!w-3 !h-3 !rounded-full !border-2"
          style={{
            background: "var(--surface-0)",
            borderColor: color,
            top: "30%",
          }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="input-1"
          className="!w-3 !h-3 !rounded-full !border-2"
          style={{
            background: "var(--surface-0)",
            borderColor: color,
            top: "70%",
          }}
        />

        <div className="flex items-center justify-center gap-2 px-4 py-3">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)]"
            style={{ background: `${color}20` }}
          >
            <IconComponent size={14} />
          </div>
          <span className="text-footnote font-bold text-primary tracking-wide">{gateLabel}</span>
        </div>

        {/* Inline field for logic gate */}
        {fields.length > 0 && (
          <div className="px-3 pb-2 flex flex-col gap-1">
            {fields.map((field) => (
              <InlineField
                key={field.key}
                field={field}
                value={nodeData.params[field.key]}
                color={color}
                nodeId={id}
              />
            ))}
          </div>
        )}

        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !rounded-full !border-2"
          style={{
            background: "var(--surface-0)",
            borderColor: color,
          }}
        />
      </div>
    );
  }

  // ── Standard node rendering with inline editing ──
  return (
    <div
      className="relative rounded-[var(--radius-md)] min-w-[240px]"
      style={{
        ...nodeGlassStyle,
        borderLeft: `4px solid ${color}`,
        boxShadow: nodeBoxShadow(!!selected, color),
        animation: isDisconnected ? "warningPulse 2s ease-in-out infinite" : undefined,
        transition: `box-shadow var(--duration-normal) var(--ease-spring)`,
      }}
    >
      {/* Input handle(s) (not on data sources) */}
      {nodeData.category !== "data" && dualInputTypes.has(nodeData.nodeType) ? (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="input-0"
            className="!w-3 !h-3 !rounded-full !border-2"
            style={{
              background: "var(--surface-0)",
              borderColor: color,
              top: "30%",
            }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="input-1"
            className="!w-3 !h-3 !rounded-full !border-2"
            style={{
              background: "var(--surface-0)",
              borderColor: color,
              top: "70%",
            }}
          />
        </>
      ) : nodeData.category !== "data" ? (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !rounded-full !border-2"
          style={{
            background: "var(--surface-0)",
            borderColor: color,
          }}
        />
      ) : null}

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div
          className="flex items-center justify-center w-6 h-6 rounded-[var(--radius-sm)]"
          style={{ background: `${color}20` }}
        >
          <IconComponent size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-footnote font-semibold text-primary truncate">{nodeData.label}</div>
          <div className="text-caption-2 text-muted">{categoryLabels[nodeData.category]}</div>
        </div>
      </div>

      {/* Inline editable parameter fields */}
      {fields.length > 0 && (
        <div className="px-4 pb-3 flex flex-col gap-1.5">
          {fields.map((field) => (
            <InlineField
              key={field.key}
              field={field}
              value={nodeData.params[field.key]}
              color={color}
              nodeId={id}
            />
          ))}
        </div>
      )}

      {/* Fallback for unknown node types */}
      {fields.length === 0 && nodeData.params && Object.keys(nodeData.params).length > 0 && (
        <div className="px-4 pb-3 flex flex-col gap-0.5">
          {Object.entries(nodeData.params).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-caption-1">
              <span className="text-muted capitalize">{key}</span>
              <span className="font-mono-data text-secondary">{String(val)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Output handle(s) */}
      {multiOutputHandles[nodeData.nodeType] ? (
        multiOutputHandles[nodeData.nodeType].map((h) => (
          <Handle
            key={h.id}
            type="source"
            position={Position.Right}
            id={h.id}
            className="!w-3 !h-3 !rounded-full !border-2"
            style={{
              background: "var(--surface-0)",
              borderColor: color,
              top: h.top,
            }}
          />
        ))
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !rounded-full !border-2"
          style={{
            background: "var(--surface-0)",
            borderColor: color,
          }}
        />
      )}
    </div>
  );
}

export const StrategyNode = memo(StrategyNodeComponent);
