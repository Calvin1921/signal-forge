import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore, isConnectionValid, validateStrategy, getParamSummary } from "./canvasStore";
import type { Node, Edge } from "@xyflow/react";

// Reset store between tests
function resetStore() {
  const store = useCanvasStore.getState();
  // We re-initialize by setting back to initial demo state
  // But for isolated tests we start fresh
  store.setNodes([]);
  store.setEdges([]);
  store.setSelectedNodeId(null);
}

describe("canvasStore", () => {
  beforeEach(() => {
    resetStore();
  });

  // ── Connection rules ──

  describe("isConnectionValid", () => {
    it("allows data -> indicator", () => {
      expect(isConnectionValid("data", "indicator")).toBe(true);
    });

    it("allows data -> condition", () => {
      expect(isConnectionValid("data", "condition")).toBe(true);
    });

    it("allows indicator -> condition", () => {
      expect(isConnectionValid("indicator", "condition")).toBe(true);
    });

    it("allows indicator -> indicator", () => {
      expect(isConnectionValid("indicator", "indicator")).toBe(true);
    });

    it("allows condition -> action", () => {
      expect(isConnectionValid("condition", "action")).toBe(true);
    });

    it("allows condition -> condition (AND/OR)", () => {
      expect(isConnectionValid("condition", "condition")).toBe(true);
    });

    it("allows action -> risk", () => {
      expect(isConnectionValid("action", "risk")).toBe(true);
    });

    it("rejects data -> action (skip condition)", () => {
      expect(isConnectionValid("data", "action")).toBe(false);
    });

    it("rejects indicator -> action (skip condition)", () => {
      expect(isConnectionValid("indicator", "action")).toBe(false);
    });

    it("rejects risk -> anything", () => {
      expect(isConnectionValid("risk", "data")).toBe(false);
      expect(isConnectionValid("risk", "indicator")).toBe(false);
      expect(isConnectionValid("risk", "action")).toBe(false);
    });

    it("rejects action -> data (backwards)", () => {
      expect(isConnectionValid("action", "data")).toBe(false);
    });
  });

  // ── Adding nodes ──

  describe("addNode", () => {
    it("adds a node to the canvas", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 100, y: 200 }
      );
      const nodes = useCanvasStore.getState().nodes;
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe("strategyNode");
      expect((nodes[0].data as { label: string }).label).toBe("RSI");
      expect(nodes[0].position).toEqual({ x: 100, y: 200 });
    });

    it("assigns default params based on node type", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 0, y: 0 }
      );
      const data = useCanvasStore.getState().nodes[0].data as { params: Record<string, unknown> };
      expect(data.params.period).toBe(14);
      expect(data.params.source).toBe("close");
    });

    it("assigns unique IDs to multiple nodes of the same type", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 0, y: 0 }
      );
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 100, y: 0 }
      );
      const nodes = useCanvasStore.getState().nodes;
      expect(nodes).toHaveLength(2);
      expect(nodes[0].id).not.toBe(nodes[1].id);
    });
  });

  // ── Removing nodes ──

  describe("removeNodes", () => {
    it("removes a node and its connected edges", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "price-data", label: "Price Data", category: "data", icon: "BarChart3" },
        { x: 0, y: 0 }
      );
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 200, y: 0 }
      );

      const nodes = useCanvasStore.getState().nodes;
      // Manually create a connection
      store.onConnect({
        source: nodes[0].id,
        target: nodes[1].id,
        sourceHandle: null,
        targetHandle: null,
      });

      expect(useCanvasStore.getState().edges).toHaveLength(1);

      // Remove the source node
      store.removeNodes([nodes[0].id]);
      expect(useCanvasStore.getState().nodes).toHaveLength(1);
      expect(useCanvasStore.getState().edges).toHaveLength(0);
    });

    it("clears selectedNodeId if deleted node was selected", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 0, y: 0 }
      );
      const nodeId = useCanvasStore.getState().nodes[0].id;
      store.setSelectedNodeId(nodeId);
      expect(useCanvasStore.getState().selectedNodeId).toBe(nodeId);

      store.removeNodes([nodeId]);
      expect(useCanvasStore.getState().selectedNodeId).toBeNull();
    });
  });

  // ── Updating node data ──

  describe("updateNodeData", () => {
    it("updates a specific parameter on a node", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 0, y: 0 }
      );
      const nodeId = useCanvasStore.getState().nodes[0].id;

      store.updateNodeData(nodeId, "period", 21);

      const data = useCanvasStore.getState().nodes[0].data as { params: Record<string, unknown> };
      expect(data.params.period).toBe(21);
    });
  });

  // ── Connections ──

  describe("onConnect", () => {
    it("creates an edge for a valid connection", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "price-data", label: "Price Data", category: "data", icon: "BarChart3" },
        { x: 0, y: 0 }
      );
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 200, y: 0 }
      );

      const nodes = useCanvasStore.getState().nodes;
      store.onConnect({
        source: nodes[0].id,
        target: nodes[1].id,
        sourceHandle: null,
        targetHandle: null,
      });

      expect(useCanvasStore.getState().edges).toHaveLength(1);
      const edge = useCanvasStore.getState().edges[0];
      expect(edge.source).toBe(nodes[0].id);
      expect(edge.target).toBe(nodes[1].id);
      expect(edge.animated).toBe(true);
    });

    it("rejects an invalid connection and sets rejectedConnection", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "price-data", label: "Price Data", category: "data", icon: "BarChart3" },
        { x: 0, y: 0 }
      );
      store.addNode(
        { type: "market-entry", label: "Market Entry", category: "action", icon: "LogIn" },
        { x: 200, y: 0 }
      );

      const nodes = useCanvasStore.getState().nodes;
      store.onConnect({
        source: nodes[0].id,
        target: nodes[1].id,
        sourceHandle: null,
        targetHandle: null,
      });

      // data -> action is invalid
      expect(useCanvasStore.getState().edges).toHaveLength(0);
      expect(useCanvasStore.getState().rejectedConnection).not.toBeNull();
    });

    it("allows multiple connections to AND gate on different handles", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "less-than", label: "Less Than", category: "condition", icon: "ChevronDown" },
        { x: 0, y: 0 }
      );
      store.addNode(
        { type: "crosses-above", label: "Crosses Above", category: "condition", icon: "ArrowUpRight" },
        { x: 0, y: 100 }
      );
      store.addNode(
        { type: "and-gate", label: "AND", category: "condition", icon: "GitMerge" },
        { x: 200, y: 50 }
      );

      const nodes = useCanvasStore.getState().nodes;
      // First connection: condition1 -> AND (input-0)
      store.onConnect({
        source: nodes[0].id,
        target: nodes[2].id,
        sourceHandle: null,
        targetHandle: "input-0",
      });
      expect(useCanvasStore.getState().edges).toHaveLength(1);

      // Second connection: condition2 -> AND (input-1) — should NOT replace
      store.onConnect({
        source: nodes[1].id,
        target: nodes[2].id,
        sourceHandle: null,
        targetHandle: "input-1",
      });
      expect(useCanvasStore.getState().edges).toHaveLength(2);
    });

    it("replaces existing input connection (one-per-input rule)", () => {
      const store = useCanvasStore.getState();
      store.addNode(
        { type: "price-data", label: "Price Data", category: "data", icon: "BarChart3" },
        { x: 0, y: 0 }
      );
      store.addNode(
        { type: "volume-data", label: "Volume Data", category: "data", icon: "BarChart" },
        { x: 0, y: 100 }
      );
      store.addNode(
        { type: "rsi", label: "RSI", category: "indicator", icon: "TrendingUp" },
        { x: 200, y: 0 }
      );

      const nodes = useCanvasStore.getState().nodes;
      // First connection: price -> RSI
      store.onConnect({
        source: nodes[0].id,
        target: nodes[2].id,
        sourceHandle: null,
        targetHandle: null,
      });
      expect(useCanvasStore.getState().edges).toHaveLength(1);

      // Second connection: volume -> RSI (replaces first)
      store.onConnect({
        source: nodes[1].id,
        target: nodes[2].id,
        sourceHandle: null,
        targetHandle: null,
      });
      expect(useCanvasStore.getState().edges).toHaveLength(1);
      expect(useCanvasStore.getState().edges[0].source).toBe(nodes[1].id);
    });
  });

  // ── Validation ──

  describe("validateStrategy", () => {
    it("reports not ready when missing components", () => {
      const nodes: Node[] = [
        {
          id: "d1",
          type: "strategyNode",
          position: { x: 0, y: 0 },
          data: { label: "Price", category: "data", icon: "BarChart3", nodeType: "price-data", params: {} },
        },
      ];
      const { isReady } = validateStrategy(nodes, []);
      expect(isReady).toBe(false);
    });

    it("reports ready when full chain exists", () => {
      const nodes: Node[] = [
        { id: "d1", type: "strategyNode", position: { x: 0, y: 0 }, data: { label: "Price", category: "data", icon: "BarChart3", nodeType: "price-data", params: {} } },
        { id: "i1", type: "strategyNode", position: { x: 100, y: 0 }, data: { label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: {} } },
        { id: "c1", type: "strategyNode", position: { x: 200, y: 0 }, data: { label: "RSI < 30", category: "condition", icon: "ChevronDown", nodeType: "less-than", params: {} } },
        { id: "a1", type: "strategyNode", position: { x: 300, y: 0 }, data: { label: "Entry", category: "action", icon: "LogIn", nodeType: "market-entry", params: {} } },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "d1", target: "i1" },
        { id: "e2", source: "i1", target: "c1" },
        { id: "e3", source: "c1", target: "a1" },
      ];
      const { isReady } = validateStrategy(nodes, edges);
      expect(isReady).toBe(true);
    });

    it("identifies disconnected nodes", () => {
      const nodes: Node[] = [
        { id: "d1", type: "strategyNode", position: { x: 0, y: 0 }, data: { label: "Price", category: "data", icon: "BarChart3", nodeType: "price-data", params: {} } },
        { id: "i1", type: "strategyNode", position: { x: 100, y: 0 }, data: { label: "RSI", category: "indicator", icon: "TrendingUp", nodeType: "rsi", params: {} } },
      ];
      // No edges: RSI has no input, both have no connections to each other
      const { disconnectedNodeIds } = validateStrategy(nodes, []);
      expect(disconnectedNodeIds).toContain("i1"); // indicator with no input
    });
  });

  // ── Param summaries ──

  describe("getParamSummary", () => {
    it("formats RSI summary", () => {
      expect(getParamSummary("rsi", { period: 14, source: "close" })).toBe("RSI(14)");
    });

    it("formats MACD summary", () => {
      expect(getParamSummary("macd", { fast: 12, slow: 26, signal: 9 })).toBe("MACD(12/26/9)");
    });

    it("formats stop loss summary", () => {
      expect(getParamSummary("stop-loss", { percent: -2, type: "Fixed" })).toBe("SL: -2%");
    });

    it("formats take profit summary", () => {
      expect(getParamSummary("take-profit", { percent: 6, type: "Fixed" })).toBe("TP: +6%");
    });

    it("formats price data summary", () => {
      expect(getParamSummary("price-data", { asset: "BTC/USDT", timeframe: "4h" })).toBe("BTC/USDT 4h");
    });

    it("formats AND gate summary", () => {
      expect(getParamSummary("and-gate", { logic: "AND" })).toBe("All conditions met");
    });

    it("formats OR gate summary", () => {
      expect(getParamSummary("or-gate", { logic: "OR" })).toBe("Any condition met");
    });
  });

  // ── Strategy metadata ──

  describe("setStrategyMeta", () => {
    it("partially updates strategy metadata", () => {
      const store = useCanvasStore.getState();
      store.setStrategyMeta({ name: "New Strategy" });
      expect(useCanvasStore.getState().strategyMeta.name).toBe("New Strategy");
      // Other fields unchanged
      expect(useCanvasStore.getState().strategyMeta.asset).toBe("BTC/USDT");
    });
  });
});
