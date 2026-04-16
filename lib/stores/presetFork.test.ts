import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "./canvasStore";
import { presetNodeGraphs } from "@/lib/seed-data";

function resetStore() {
  const store = useCanvasStore.getState();
  store.setNodes([]);
  store.setEdges([]);
  store.setSelectedNodeId(null);
  store.setStrategyMeta({ name: "", asset: "BTC/USDT", timeframe: "4h", version: 1 });
  store.clearForkedFrom();
}

describe("Preset Fork-to-Canvas", () => {
  beforeEach(() => {
    resetStore();
  });

  it("presetNodeGraphs contains all 10 preset definitions", () => {
    const ids = Object.keys(presetNodeGraphs);
    expect(ids).toContain("btc-mean-rev");
    expect(ids).toContain("macd-div-swing");
    expect(ids).toContain("boll-squeeze");
    expect(ids).toContain("golden-cross");
    expect(ids).toContain("vol-breakout");
    expect(ids).toContain("triple-ema");
    expect(ids).toContain("rsi-macd-combo");
    expect(ids).toContain("ema-ribbon");
    expect(ids).toContain("bb-squeeze-breakout");
    expect(ids).toContain("momentum-adx");
    expect(ids.length).toBe(10);
  });

  it("each preset has nodes, edges, and metadata", () => {
    for (const [id, preset] of Object.entries(presetNodeGraphs)) {
      expect(preset.nodes.length).toBeGreaterThanOrEqual(4);
      expect(preset.edges.length).toBeGreaterThanOrEqual(3);
      expect(preset.defaultAsset).toBeTruthy();
      expect(preset.defaultTimeframe).toBeTruthy();
    }
  });

  it("loadPreset populates nodes, edges, and strategyMeta", () => {
    const store = useCanvasStore.getState();
    store.loadPreset("btc-mean-rev");

    const state = useCanvasStore.getState();
    expect(state.nodes.length).toBeGreaterThanOrEqual(4);
    expect(state.edges.length).toBeGreaterThanOrEqual(3);
    expect(state.strategyMeta.name).toBe("BTC Mean Reversion");
    expect(state.strategyMeta.asset).toBe("BTC/USDT");
    expect(state.strategyMeta.timeframe).toBe("4h");
    expect(state.forkedFrom).toBe("BTC Mean Reversion");
  });

  it("loadPreset sets forkedFrom field", () => {
    const store = useCanvasStore.getState();
    store.loadPreset("macd-div-swing");

    expect(useCanvasStore.getState().forkedFrom).toBe("MACD Divergence Swing");
  });

  it("clearForkedFrom clears the forked banner", () => {
    const store = useCanvasStore.getState();
    store.loadPreset("btc-mean-rev");
    expect(useCanvasStore.getState().forkedFrom).toBeTruthy();

    store.clearForkedFrom();
    expect(useCanvasStore.getState().forkedFrom).toBeNull();
  });

  it("each preset graph has a valid data->indicator->condition->action chain", () => {
    for (const [id, preset] of Object.entries(presetNodeGraphs)) {
      const categories = preset.nodes.map((n) => n.data.category);
      expect(categories).toContain("data");
      expect(categories).toContain("indicator");
      expect(categories).toContain("condition");
      expect(categories).toContain("action");
    }
  });

  it("loadPreset with unknown id does not crash", () => {
    const store = useCanvasStore.getState();
    store.loadPreset("nonexistent-id");
    // Should stay empty
    expect(useCanvasStore.getState().nodes.length).toBe(0);
  });
});
