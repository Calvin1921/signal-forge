"use client";

import { FloatingPanel } from "@/components/panels/FloatingPanel";
import { useCanvasStore, type StrategyNodeData } from "@/lib/stores/canvasStore";
import { fieldsByNodeType, categoryColors } from "@/lib/node-fields";

interface NodeInspectorProps {
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

export function NodeInspector({ onClose, initialPosition }: NodeInspectorProps) {
  const { nodes, selectedNodeId, updateNodeData } = useCanvasStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  if (!node) return null;

  const data = node.data as StrategyNodeData;

  const color = categoryColors[data.category] || "var(--accent-primary)";
  const fields = fieldsByNodeType[data.nodeType] || [];

  return (
    <FloatingPanel
      title={`${data.label} Settings`}
      onClose={onClose}
      initialPosition={initialPosition ?? { x: 80, y: 120 }}
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
                  className="input-inspector text-subhead text-primary font-mono-data appearance-none cursor-pointer"
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
                  className="input-inspector text-subhead font-mono-data text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  className="input-inspector text-subhead text-primary"
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
