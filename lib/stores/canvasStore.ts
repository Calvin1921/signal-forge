import { create } from "zustand";
import type { Node, Edge, Connection } from "@xyflow/react";
import { type NodeLibraryItem, nodeLibrary, presetNodeGraphs, presetStrategies } from "@/lib/seed-data";

// ── Types ──

interface StrategyMeta {
  name: string;
  asset: string;
  timeframe: string;
  version: number;
}

export interface StrategyNodeData {
  label: string;
  category: string;
  icon: string;
  nodeType: string;
  params: Record<string, unknown>;
  [key: string]: unknown;
}

// ── Connection Rules ──

const connectionRules: Record<string, string[]> = {
  data: ["indicator", "condition"],
  indicator: ["condition", "indicator"],
  condition: ["action", "condition"],
  action: ["risk"],
  risk: [],
};

export function isConnectionValid(
  sourceCategory: string,
  targetCategory: string
): boolean {
  const allowed = connectionRules[sourceCategory];
  return allowed ? allowed.includes(targetCategory) : false;
}

// ── Default params for each node type ──

export const defaultNodeParams: Record<string, Record<string, unknown>> = {
  "price-data": { asset: "BTC/USDT", timeframe: "4h" },
  "volume-data": { asset: "BTC/USDT", timeframe: "4h" },
  "order-book": { asset: "BTC/USDT", depth: 10 },
  rsi: { period: 14, source: "close" },
  macd: { fast: 12, slow: 26, signal: 9 },
  bollinger: { period: 20, stdDev: 2 },
  ema: { period: 20, source: "close" },
  sma: { period: 50, source: "close" },
  "volume-ma": { period: 20 },
  "greater-than": { operator: ">", value: 70 },
  "less-than": { operator: "<", value: 30 },
  "crosses-above": { operator: "crosses above", value: 0 },
  "crosses-below": { operator: "crosses below", value: 0 },
  "and-gate": { logic: "AND" },
  "or-gate": { logic: "OR" },
  "market-entry": { side: "Long", type: "Market", maxHoldBars: 30 },
  "limit-entry": { side: "Long", type: "Limit", price: 0 },
  "exit-position": { side: "Long", type: "Market" },
  alert: { message: "Signal triggered" },
  "stop-loss": { percent: -2, type: "Fixed", atrPeriod: 14, atrMultiplier: 1.5 },
  "take-profit": { percent: 6, type: "Fixed", atrPeriod: 14, atrMultiplier: 3.0 },
  "position-size": { percent: 2, maxRisk: 1 },
  "trailing-stop": { percent: -1.5, activation: 1 },
  atr: { period: 14 },
  stochastic: { kPeriod: 14, dPeriod: 3, smooth: 3 },
  adx: { period: 14 },
  roc: { period: 12 },
  vwap: { resetDaily: true },
  donchian: { period: 20 },
  "bb-bandwidth": { period: 20, stdDev: 2 },
  "pivot-points": { type: "Standard" },
  "swing-hl": { lookback: 5 },
  "candle-pattern": { pattern: "bullish_engulfing" },
  "in-range": { low: 30, high: 70 },
};

// ── Parameter display labels ──

export function getParamSummary(nodeType: string, params: Record<string, unknown>): string {
  switch (nodeType) {
    case "price-data":
    case "volume-data":
      return `${params.asset} ${params.timeframe}`;
    case "rsi":
      return `RSI(${params.period})`;
    case "macd":
      return `MACD(${params.fast}/${params.slow}/${params.signal})`;
    case "bollinger":
      return `BB(${params.period}, ${params.stdDev}σ)`;
    case "ema":
      return `EMA(${params.period})`;
    case "sma":
      return `SMA(${params.period})`;
    case "volume-ma":
      return `Vol MA(${params.period})`;
    case "greater-than":
    case "less-than":
    case "crosses-above":
    case "crosses-below":
      return `${params.operator} ${params.value}`;
    case "and-gate":
      return "All conditions met";
    case "or-gate":
      return "Any condition met";
    case "market-entry":
    case "limit-entry":
    case "exit-position":
      return `${params.side} ${params.type}`;
    case "stop-loss":
      return `SL: ${params.percent}%`;
    case "take-profit":
      return `TP: +${params.percent}%`;
    case "position-size":
      return `Size: ${params.percent}%`;
    case "trailing-stop":
      return `Trail: ${params.percent}%`;
    case "atr": return `ATR(${params.period})`;
    case "stochastic": return `Stoch(${params.kPeriod}/${params.dPeriod}/${params.smooth})`;
    case "adx": return `ADX(${params.period})`;
    case "roc": return `ROC(${params.period})`;
    case "vwap": return "VWAP";
    case "donchian": return `DC(${params.period})`;
    case "bb-bandwidth": return `BBW(${params.period})`;
    case "pivot-points": return `Pivots (${params.type})`;
    case "swing-hl": return `Swing(${params.lookback})`;
    case "candle-pattern": return `${params.pattern}`;
    case "in-range": return `${params.low} – ${params.high}`;
    default:
      return "";
  }
}

// ── Strategy validation ──

export function validateStrategy(nodes: Node[], edges: Edge[]): {
  isReady: boolean;
  disconnectedNodeIds: string[];
} {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const targetIds = new Set(edges.map((e) => e.target));
  const sourceIds = new Set(edges.map((e) => e.source));

  const hasDataSource = nodes.some(
    (n) => (n.data as StrategyNodeData).category === "data"
  );
  const hasIndicator = nodes.some(
    (n) => (n.data as StrategyNodeData).category === "indicator"
  );
  const hasCondition = nodes.some(
    (n) => (n.data as StrategyNodeData).category === "condition"
  );
  const hasAction = nodes.some(
    (n) => (n.data as StrategyNodeData).category === "action"
  );

  // Check if there is a connected path from data -> indicator -> condition -> action
  const isReady = hasDataSource && hasIndicator && hasCondition && hasAction;

  // Nodes that should have inputs but don't
  const disconnectedNodeIds: string[] = [];
  for (const node of nodes) {
    const data = node.data as StrategyNodeData;
    // Data sources don't need inputs
    if (data.category === "data") continue;
    // Everything else needs at least one input connection
    if (!targetIds.has(node.id)) {
      disconnectedNodeIds.push(node.id);
    }
  }

  // Also check nodes that should have outputs but don't (except risk nodes)
  for (const node of nodes) {
    const data = node.data as StrategyNodeData;
    if (data.category === "risk") continue;
    if (!sourceIds.has(node.id) && nodes.length > 1) {
      if (!disconnectedNodeIds.includes(node.id)) {
        disconnectedNodeIds.push(node.id);
      }
    }
  }

  return { isReady, disconnectedNodeIds };
}

// ── Edge styling ──

function getEdgeStyle(sourceCategory: string) {
  const colorMap: Record<string, string> = {
    data: "var(--node-data)",
    indicator: "var(--node-indicator)",
    condition: "var(--node-condition)",
    action: "var(--node-action)",
    risk: "var(--node-risk)",
  };
  return {
    stroke: colorMap[sourceCategory] || "var(--accent-primary)",
    strokeWidth: 2,
  };
}

// ── Demo state ──

const demoNodes: Node[] = [
  {
    id: "price-1",
    type: "strategyNode",
    position: { x: 50, y: 180 },
    data: {
      label: "Price Data",
      category: "data",
      icon: "BarChart3",
      nodeType: "price-data",
      params: { asset: "BTC/USDT", timeframe: "4h" },
    } satisfies StrategyNodeData,
  },
  {
    id: "rsi-1",
    type: "strategyNode",
    position: { x: 350, y: 180 },
    data: {
      label: "RSI",
      category: "indicator",
      icon: "TrendingUp",
      nodeType: "rsi",
      params: { period: 14, source: "close" },
    } satisfies StrategyNodeData,
  },
  {
    id: "cond-1",
    type: "strategyNode",
    position: { x: 650, y: 120 },
    data: {
      label: "RSI < 30",
      category: "condition",
      icon: "ChevronDown",
      nodeType: "less-than",
      params: { operator: "<", value: 30 },
    } satisfies StrategyNodeData,
  },
  {
    id: "entry-1",
    type: "strategyNode",
    position: { x: 950, y: 120 },
    data: {
      label: "Market Entry",
      category: "action",
      icon: "LogIn",
      nodeType: "market-entry",
      params: { side: "Long", type: "Market" },
    } satisfies StrategyNodeData,
  },
  {
    id: "sl-1",
    type: "strategyNode",
    position: { x: 950, y: 300 },
    data: {
      label: "Stop Loss",
      category: "risk",
      icon: "ShieldOff",
      nodeType: "stop-loss",
      params: { percent: -2, type: "Fixed" },
    } satisfies StrategyNodeData,
  },
  {
    id: "tp-1",
    type: "strategyNode",
    position: { x: 1200, y: 200 },
    data: {
      label: "Take Profit",
      category: "risk",
      icon: "ShieldCheck",
      nodeType: "take-profit",
      params: { percent: 6, type: "Fixed" },
    } satisfies StrategyNodeData,
  },
];

const demoEdges: Edge[] = [
  {
    id: "e1",
    source: "price-1",
    target: "rsi-1",
    animated: true,
    style: getEdgeStyle("data"),
  },
  {
    id: "e2",
    source: "rsi-1",
    target: "cond-1",
    animated: true,
    style: getEdgeStyle("indicator"),
  },
  {
    id: "e3",
    source: "cond-1",
    target: "entry-1",
    animated: true,
    style: getEdgeStyle("condition"),
  },
  {
    id: "e4",
    source: "entry-1",
    target: "sl-1",
    animated: true,
    style: getEdgeStyle("action"),
  },
  {
    id: "e5",
    source: "entry-1",
    target: "tp-1",
    animated: true,
    style: getEdgeStyle("action"),
  },
];

// ── Store ──

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  strategyMeta: StrategyMeta;
  rejectedConnection: { sourceId: string; targetId: string } | null;
  forkedFrom: string | null;

  // Setters
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  setStrategyMeta: (meta: Partial<StrategyMeta>) => void;

  // Node operations
  addNode: (item: NodeLibraryItem, position: { x: number; y: number }) => void;
  removeNodes: (ids: string[]) => void;
  updateNodeData: (
    nodeId: string,
    paramKey: string,
    value: unknown
  ) => void;

  // Connection
  onConnect: (connection: Connection) => void;
  clearRejectedConnection: () => void;

  // Preset loading
  loadPreset: (presetId: string) => void;
  clearForkedFrom: () => void;

  // Canvas reset
  clearCanvas: () => void;
}

let nodeCounter = 100;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: demoNodes,
  edges: demoEdges,
  selectedNodeId: null,
  strategyMeta: {
    name: "RSI Mean Reversion",
    asset: "BTC/USDT",
    timeframe: "4h",
    version: 1,
  },
  rejectedConnection: null,
  forkedFrom: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setStrategyMeta: (meta) =>
    set((s) => ({ strategyMeta: { ...s.strategyMeta, ...meta } })),

  addNode: (item, position) => {
    nodeCounter++;
    const id = `${item.type}-${nodeCounter}`;
    const params = defaultNodeParams[item.type] || {};
    const newNode: Node = {
      id,
      type: "strategyNode",
      position,
      data: {
        label: item.label,
        category: item.category,
        icon: item.icon,
        nodeType: item.type,
        params: { ...params },
      } satisfies StrategyNodeData,
    };
    set((s) => ({ nodes: [...s.nodes, newNode] }));
  },

  removeNodes: (ids) => {
    const idSet = new Set(ids);
    set((s) => ({
      nodes: s.nodes.filter((n) => !idSet.has(n.id)),
      edges: s.edges.filter(
        (e) => !idSet.has(e.source) && !idSet.has(e.target)
      ),
      selectedNodeId: s.selectedNodeId && idSet.has(s.selectedNodeId)
        ? null
        : s.selectedNodeId,
    }));
  },

  updateNodeData: (nodeId, paramKey, value) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const data = n.data as StrategyNodeData;
        return {
          ...n,
          data: {
            ...data,
            params: { ...data.params, [paramKey]: value },
          },
        };
      }),
    }));
  },

  onConnect: (connection) => {
    const { nodes, edges } = get();
    const sourceNode = nodes.find((n) => n.id === connection.source);
    const targetNode = nodes.find((n) => n.id === connection.target);

    if (!sourceNode || !targetNode) return;

    const sourceData = sourceNode.data as StrategyNodeData;
    const targetData = targetNode.data as StrategyNodeData;

    // Enforce connection rules
    if (!isConnectionValid(sourceData.category, targetData.category)) {
      set({
        rejectedConnection: {
          sourceId: connection.source!,
          targetId: connection.target!,
        },
      });
      // Auto-clear after animation
      setTimeout(() => {
        set({ rejectedConnection: null });
      }, 800);
      return;
    }

    // AND/OR gates allow multiple inputs (one per handle ID)
    // Other nodes: only one connection per input
    const isLogicGate = targetData.nodeType === "and-gate" || targetData.nodeType === "or-gate";

    let filteredEdges: Edge[];
    if (isLogicGate) {
      // For logic gates, allow one connection per target handle
      const targetHandle = connection.targetHandle;
      const existingInput = edges.find(
        (e) => e.target === connection.target && e.targetHandle === targetHandle
      );
      filteredEdges = existingInput
        ? edges.filter((e) => e.id !== existingInput.id)
        : edges;
    } else {
      // Standard single-input rule
      const existingInput = edges.find(
        (e) => e.target === connection.target
      );
      filteredEdges = existingInput
        ? edges.filter((e) => e.id !== existingInput.id)
        : edges;
    }

    const newEdge: Edge = {
      id: `e-${connection.source}-${connection.target}-${connection.targetHandle || "default"}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      animated: true,
      style: getEdgeStyle(sourceData.category),
    };

    set({ edges: [...filteredEdges, newEdge] });
  },

  clearRejectedConnection: () => set({ rejectedConnection: null }),

  loadPreset: (presetId: string) => {
    const graph = presetNodeGraphs[presetId];
    if (!graph) return;

    const preset = presetStrategies.find((p) => p.id === presetId);

    const nodes: Node[] = graph.nodes.map((n) => ({
      id: n.id,
      type: "strategyNode",
      position: n.position,
      data: {
        label: n.data.label,
        category: n.data.category,
        icon: n.data.icon,
        nodeType: n.data.nodeType,
        params: { ...n.data.params },
      } satisfies StrategyNodeData,
    }));

    const edges: Edge[] = graph.edges.map((e, i) => {
      const sourceNode = graph.nodes.find((n) => n.id === e.source);
      const sourceCategory = sourceNode?.data.category || "data";
      return {
        id: `pe-${i}`,
        source: e.source,
        target: e.target,
        ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
        ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
        animated: true,
        style: {
          stroke:
            sourceCategory === "data"
              ? "var(--node-data)"
              : sourceCategory === "indicator"
                ? "var(--node-indicator)"
                : sourceCategory === "condition"
                  ? "var(--node-condition)"
                  : sourceCategory === "action"
                    ? "var(--node-action)"
                    : "var(--node-risk)",
          strokeWidth: 2,
        },
      };
    });

    set({
      nodes,
      edges,
      strategyMeta: {
        name: preset?.name || graph.presetName,
        asset: graph.defaultAsset,
        timeframe: graph.defaultTimeframe,
        version: 1,
      },
      forkedFrom: preset?.name || graph.presetName,
      selectedNodeId: null,
    });
  },

  clearForkedFrom: () => set({ forkedFrom: null }),

  clearCanvas: () =>
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      strategyMeta: {
        name: "Untitled Strategy",
        asset: "BTC/USDT",
        timeframe: "4h",
        version: 1,
      },
      forkedFrom: null,
      rejectedConnection: null,
    }),
}));
