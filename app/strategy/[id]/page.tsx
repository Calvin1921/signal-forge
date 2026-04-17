"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import Link from "next/link";
import { StrategyNode } from "@/components/canvas/StrategyNode";
import { NodeLibrarySidebar } from "@/components/canvas/NodeLibrarySidebar";
import { NodeInspector } from "@/components/canvas/NodeInspector";
import { BacktestPanel } from "@/components/backtest/BacktestPanel";
import { CanvasToolbar } from "@/components/canvas/CanvasToolbar";
import { GradientButton } from "@/components/ui/GradientButton";
import { useCanvasStore, validateStrategy, type StrategyNodeData } from "@/lib/stores/canvasStore";
import { usePanelStore } from "@/lib/stores/panelStore";
import { useBacktestStore } from "@/lib/stores/backtestStore";
import { type NodeLibraryItem } from "@/lib/seed-data";
import {
  Zap,
  Play,
  ChevronDown,
  Loader2,
  GitFork,
  X,
  ArrowLeft,
  BarChart2,
} from "lucide-react";

// ── Context Menu ──

interface ContextMenuState {
  x: number;
  y: number;
  nodeId: string;
}

// ── Inner Canvas (needs ReactFlowProvider) ──

function StrategyCanvasInner() {
  const {
    nodes,
    edges,
    selectedNodeId,
    strategyMeta,
    forkedFrom,
    setNodes,
    setEdges,
    setSelectedNodeId,
    setStrategyMeta,
    addNode,
    removeNodes,
    onConnect,
    clearForkedFrom,
  } = useCanvasStore();

  const {
    minimapVisible,
    backtestPanelOpen,
    openBacktestPanel,
    toggleBacktestPanel,
    sidebarExpanded,
  } = usePanelStore();

  const backtestIsRunning = useBacktestStore((s) => s.isRunning);
  const runBacktest = useBacktestStore((s) => s.runBacktest);

  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  const nodeTypes: NodeTypes = useMemo(() => ({ strategyNode: StrategyNode }), []);

  const { isReady } = validateStrategy(nodes, edges);

  // ── Fit view on mount and preset load ──
  const hasFittedRef = useRef(false);
  useEffect(() => {
    if (hasFittedRef.current) return;
    if (nodes.length === 0) return;
    hasFittedRef.current = true;
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }, 150);
    return () => clearTimeout(timer);
  }, [nodes.length, reactFlowInstance]);

  useEffect(() => {
    if (!forkedFrom) return;
    const timer = setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }, 150);
    return () => clearTimeout(timer);
  }, [forkedFrom, reactFlowInstance]);

  // ── Node changes ──

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  // ── Node click ──

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
      setContextMenu(null);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId]);

  // ── Connection ──

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection);
    },
    [onConnect]
  );

  // ── Drag and drop from sidebar ──

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const raw = event.dataTransfer.getData("application/signalforge-node");
      if (!raw) return;

      const item: NodeLibraryItem = JSON.parse(raw);

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNode(item, position);
    },
    [reactFlowInstance, addNode]
  );

  // ── Right-click context menu ──

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      event.preventDefault();
      event.stopPropagation();

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      setContextMenu({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        nodeId: node.id,
      });
    },
    []
  );

  // ── Keyboard delete ──

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedNodeId
      ) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
        removeNodes([selectedNodeId]);
      }
    },
    [selectedNodeId, removeNodes]
  );

  // ── Delete from context menu ──

  const handleDeleteFromContextMenu = useCallback(
    (nodeId: string) => {
      removeNodes([nodeId]);
      setContextMenu(null);
    },
    [removeNodes]
  );

  // ── Toolbar name editing ──

  const handleNameBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const name = e.target.value.trim();
      if (name) {
        setStrategyMeta({ name });
      }
      setIsEditingName(false);
    },
    [setStrategyMeta]
  );

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        setIsEditingName(false);
      }
    },
    []
  );

  // ── Toolbar asset / timeframe ──

  const handleAssetChange = useCallback(
    (asset: string) => {
      setStrategyMeta({ asset });
      const updated = nodes.map((n) => {
        const d = n.data as StrategyNodeData;
        if (d.category === "data" && d.params.asset !== undefined) {
          return {
            ...n,
            data: { ...d, params: { ...d.params, asset } },
          };
        }
        return n;
      });
      setNodes(updated);
    },
    [setStrategyMeta, nodes, setNodes]
  );

  const handleTimeframeChange = useCallback(
    (timeframe: string) => {
      setStrategyMeta({ timeframe });
      const updated = nodes.map((n) => {
        const d = n.data as StrategyNodeData;
        if (d.category === "data" && d.params.timeframe !== undefined) {
          return {
            ...n,
            data: { ...d, params: { ...d.params, timeframe } },
          };
        }
        return n;
      });
      setNodes(updated);
    },
    [setStrategyMeta, nodes, setNodes]
  );

  return (
    <div className="h-screen w-screen overflow-hidden" onKeyDown={onKeyDown} tabIndex={-1}>
      {/* ── Full-bleed Canvas ── */}
      <div
        ref={reactFlowWrapper}
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 20% 30%, oklch(24% 0.04 200 / 0.35) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 80% 70%, oklch(22% 0.03 330 / 0.25) 0%, transparent 60%),
            var(--surface-0)
          `,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true }}
          deleteKeyCode={null}
          selectionKeyCode={null}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.2}
            color="oklch(36% 0.008 260)"
          />
          {minimapVisible && (
            <MiniMap
              position="bottom-right"
              style={{
                background: "oklch(17% 0.010 260 / 0.50)",
                backdropFilter: "blur(24px) saturate(1.4)",
                WebkitBackdropFilter: "blur(24px) saturate(1.4)",
                border: "1px solid oklch(40% 0.008 260 / 0.25)",
                borderRadius: "var(--radius-md)",
                marginRight: 16,
                marginBottom: 68,
                zIndex: 10,
              }}
              maskColor="oklch(12% 0.005 260 / 0.7)"
              nodeColor={(n) => {
                const data = n.data as { category?: string };
                const colors: Record<string, string> = {
                  data: "oklch(75% 0.15 200)",
                  indicator: "oklch(78% 0.15 80)",
                  condition: "oklch(72% 0.17 155)",
                  action: "oklch(70% 0.15 330)",
                  risk: "oklch(70% 0.15 25)",
                };
                return colors[data?.category || "data"] || "oklch(75% 0.15 200)";
              }}
            />
          )}
        </ReactFlow>

        {/* Empty canvas hint */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div
              className="flex items-center gap-3 px-6 py-4 rounded-[var(--radius-lg)] glass"
              style={{
              }}
            >
              <ArrowLeft
                size={20}
                style={{ color: "var(--accent-primary)" }}
                className="animate-pulse"
              />
              <span className="text-subhead text-secondary">
                Hover the left panel and drag a{" "}
                <span className="text-primary font-medium">Data Source</span> to
                start building
              </span>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="absolute z-50 glass rounded-[var(--radius-md)] overflow-hidden"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={() => {
                const node = nodes.find((n) => n.id === contextMenu.nodeId);
                if (node) {
                  const data = node.data as StrategyNodeData;
                  addNode(
                    {
                      type: data.nodeType,
                      label: data.label,
                      category: data.category as
                        | "data"
                        | "indicator"
                        | "condition"
                        | "action"
                        | "risk",
                      icon: data.icon,
                    },
                    {
                      x: node.position.x + 50,
                      y: node.position.y + 80,
                    }
                  );
                }
                setContextMenu(null);
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-footnote text-primary hover:bg-surface-4 text-left min-h-[44px] focus-ring"
              style={{
                transitionProperty: "background-color",
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-spring)",
              }}
            >
              Duplicate
            </button>
            <div style={{ height: 1, background: "var(--surface-4)" }} />
            <button
              onClick={() => handleDeleteFromContextMenu(contextMenu.nodeId)}
              className="flex items-center gap-2 w-full px-4 py-2 text-footnote hover:bg-surface-4 text-left min-h-[44px] focus-ring"
              style={{
                color: "var(--semantic-loss)",
                transitionProperty: "background-color",
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-spring)",
              }}
            >
              Delete Node
            </button>
          </div>
        )}
      </div>

      {/* ── Top-left: Logo + Strategy Name ── */}
      <div className="fixed top-4 left-4 z-30 flex items-center gap-3 h-11">
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] hover:brightness-110 focus-ring shrink-0"
          style={{
            background: "var(--gradient-cta)",
            transitionProperty: "filter",
            transitionDuration: "var(--duration-fast)",
            transitionTimingFunction: "var(--ease-spring)",
          }}
          title="Back to dashboard"
        >
          <Zap size={16} className="text-primary" />
        </Link>
        {isEditingName ? (
          <input
            autoFocus
            defaultValue={strategyMeta.name}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            className="text-headline text-primary bg-surface-2 px-2 py-1 rounded-[var(--radius-sm)] outline-none focus-ring"
          />
        ) : (
          <h1
            className="text-headline text-primary cursor-pointer hover:text-accent font-medium"
            onClick={() => setIsEditingName(true)}
            title="Click to rename"
            style={{
              transitionProperty: "color",
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-smooth)",
            }}
          >
            {strategyMeta.name}
          </h1>
        )}
        {forkedFrom && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-[var(--radius-sm)] bg-surface-2 text-caption-1 text-secondary">
            <GitFork size={11} style={{ color: "var(--accent-primary)" }} />
            <span>{forkedFrom}</span>
            <button
              onClick={clearForkedFrom}
              className="text-muted hover:text-primary ml-0.5"
              style={{
                transitionProperty: "color",
                transitionDuration: "var(--duration-fast)",
              }}
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>

      {/* ── Top-right: Asset + Timeframe + Backtest ── */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2 h-11 px-3 py-1.5 rounded-[var(--radius-lg)] glass">
        <select
          value={strategyMeta.asset}
          onChange={(e) => handleAssetChange(e.target.value)}
          className="text-caption-1 px-2 h-8 rounded-[var(--radius-sm)] text-primary font-mono-data outline-none focus-ring appearance-none cursor-pointer"
          style={{ background: "var(--surface-3)" }}
        >
          {["BTC/USDT", "ETH/USDT", "SPY", "AAPL", "EUR/USD"].map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <div className="relative">
          <select
            value={strategyMeta.timeframe}
            onChange={(e) => handleTimeframeChange(e.target.value)}
            className="text-caption-1 px-2 pr-6 h-8 rounded-[var(--radius-sm)] text-primary font-mono-data outline-none focus-ring appearance-none cursor-pointer"
            style={{ background: "var(--surface-2)" }}
          >
            {["1m", "5m", "15m", "1h", "4h", "1D"].map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-secondary" />
        </div>

        <div
          style={{
            width: 1,
            height: 20,
            background: "oklch(60% 0.005 260 / 0.15)",
          }}
        />

        {/* Backtest */}
        <button
          onClick={async () => {
            openBacktestPanel();
            await runBacktest();
          }}
          disabled={backtestIsRunning}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius-sm)] text-caption-1 font-medium focus-ring cursor-pointer text-primary disabled:opacity-40 disabled:pointer-events-none"
          style={{
            background: "var(--gradient-cta)",
            transitionProperty: "filter",
            transitionDuration: "var(--duration-fast)",
            transitionTimingFunction: "var(--ease-spring)",
          }}
        >
          {backtestIsRunning ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Play size={13} />
          )}
          {backtestIsRunning ? "Running..." : "Backtest"}
        </button>

        {/* Results toggle */}
        <button
          onClick={toggleBacktestPanel}
          className={[
            "flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius-sm)] text-caption-1 font-medium focus-ring cursor-pointer",
            backtestPanelOpen
              ? "text-accent bg-surface-3"
              : "text-secondary hover:text-primary bg-surface-2 hover:bg-surface-3",
          ].join(" ")}
          style={{
            transitionProperty: "color, background-color",
            transitionDuration: "var(--duration-fast)",
            transitionTimingFunction: "var(--ease-spring)",
          }}
          title={backtestPanelOpen ? "Hide results" : "Show results"}
        >
          <BarChart2 size={13} />
          Results
        </button>
      </div>


      {/* ── Floating Node Library (left) ── */}
      <NodeLibrarySidebar />

      {/* ── Floating Backtest Results (right) ── */}
      <BacktestPanel />

      {/* ── Floating Canvas Toolbar (bottom center) ── */}
      <CanvasToolbar />

      {/* ── Floating Node Inspector (when a node is selected) ── */}
      {selectedNodeId && (
        <NodeInspector
          key={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
          initialPosition={{ x: sidebarExpanded ? 296 : 80, y: 120 }}
        />
      )}
    </div>
  );
}

// ── Wrapped Page ──

export default function StrategyCanvasPage() {
  return (
    <ReactFlowProvider>
      <StrategyCanvasInner />
    </ReactFlowProvider>
  );
}
