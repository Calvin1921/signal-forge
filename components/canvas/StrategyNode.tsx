"use client";

import { memo, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import * as Icons from "lucide-react";
import { type StrategyNodeData, validateStrategy } from "@/lib/stores/canvasStore";
import { useCanvasStore } from "@/lib/stores/canvasStore";
import { fieldsByNodeType, categoryColors, categoryLabels, type FieldDef } from "@/lib/node-fields";

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
    "input-base text-caption-1 font-mono-data text-primary px-1.5 py-0.5 w-full";

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
        className="relative rounded-[var(--radius-md)] transition-normal"
        style={{
          ...nodeGlassStyle,
          borderLeft: `4px solid ${color}`,
          boxShadow: nodeBoxShadow(!!selected, color),
          animation: isDisconnected ? "warningPulse 2s ease-in-out infinite" : undefined,
          minWidth: "140px",
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
      className="relative rounded-[var(--radius-md)] min-w-[240px] transition-normal"
      style={{
        ...nodeGlassStyle,
        borderLeft: `4px solid ${color}`,
        boxShadow: nodeBoxShadow(!!selected, color),
        animation: isDisconnected ? "warningPulse 2s ease-in-out infinite" : undefined,
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
