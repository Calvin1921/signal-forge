"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GripVertical, Library, X } from "lucide-react";
import * as Icons from "lucide-react";
import { nodeLibrary, type NodeLibraryItem } from "@/lib/seed-data";
import { usePanelStore } from "@/lib/stores/panelStore";
import { IconButton } from "@/components/ui/IconButton";
import { PanelHeader } from "@/components/ui/PanelHeader";

const categoryConfig: Record<string, { label: string; emoji: string; color: string; icon: string }> = {
  data: { label: "Data Sources", emoji: "\ud83d\udcca", color: "var(--node-data)", icon: "BarChart3" },
  indicator: { label: "Indicators", emoji: "\ud83d\udcc8", color: "var(--node-indicator)", icon: "TrendingUp" },
  condition: { label: "Conditions", emoji: "\u26a1", color: "var(--node-condition)", icon: "GitBranch" },
  action: { label: "Actions", emoji: "\ud83c\udfaf", color: "var(--node-action)", icon: "Target" },
  risk: { label: "Risk Management", emoji: "\ud83d\udee1\ufe0f", color: "var(--node-risk)", icon: "Shield" },
};

const categories = ["data", "indicator", "condition", "action", "risk"];

function onDragStart(event: React.DragEvent, item: NodeLibraryItem) {
  event.dataTransfer.setData("application/signalforge-node", JSON.stringify(item));
  event.dataTransfer.effectAllowed = "move";
}

const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

// ── Sidebar body (shared between desktop and mobile overlay) ──
function SidebarContent({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) {
  const filteredLibrary = searchQuery
    ? nodeLibrary.filter(
        (item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : nodeLibrary;

  return (
    <>
      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-caption-1 text-primary bg-surface-2 rounded-[var(--radius-sm)] pl-7 pr-2 py-1.5 outline-none focus-ring placeholder:text-muted transition-fast"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto p-3 pt-0 flex flex-col gap-4">
        {categories.map((cat) => {
          const cfg = categoryConfig[cat];
          const items = filteredLibrary.filter((n) => n.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-caption-1">{cfg.emoji}</span>
                <span
                  className="text-caption-1 font-medium uppercase tracking-wider"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[item.icon] || Icons.Box;
                  return (
                    <div
                      key={item.type}
                      className="flex items-center gap-2 px-2 min-h-[44px] rounded-[var(--radius-sm)] bg-surface-2 hover:bg-surface-3 cursor-grab active:cursor-grabbing group transition-fast"
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                    >
                      <GripVertical
                        size={12}
                        className="text-muted opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <div
                        className="flex items-center justify-center w-5 h-5 rounded-[4px]"
                        style={{
                          background: `color-mix(in oklch, ${cfg.color} 15%, transparent)`,
                        }}
                      >
                        <IconComp size={12} className="text-secondary" />
                      </div>
                      <span className="text-footnote text-primary">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function NodeLibrarySidebar() {
  const { sidebarExpanded, toggleSidebar } = usePanelStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [hovering, setHovering] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const expanded = sidebarExpanded || hovering;

  const handleMouseEnter = useCallback(() => {
    setHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovering(false);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);

  return (
    <>
      {/* ── Desktop sidebar (md and up) ── */}
      <motion.div
        className="hidden md:flex fixed left-4 top-20 z-40 flex-col rounded-[var(--radius-lg)] glass overflow-hidden"
        style={{
          maxHeight: "calc(100vh - 120px)",
        }}
        animate={{
          width: expanded ? 260 : 48,
        }}
        transition={springTransition}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Collapsed: category icon column */}
        {!expanded && (
          <div className="flex flex-col items-center gap-1 py-2">
            {categories.map((cat) => {
              const cfg = categoryConfig[cat];
              const IconComp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[cfg.icon] || Icons.Box;
              return (
                <IconButton
                  key={cat}
                  size="sm"
                  className="w-10 h-10"
                  onClick={toggleSidebar}
                  style={{ color: cfg.color }}
                  title={cfg.label}
                >
                  <IconComp size={16} />
                </IconButton>
              );
            })}
          </div>
        )}

        {/* Expanded: full panel */}
        {expanded && (
          <motion.div
            className="flex flex-col flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.15 }}
          >
            <PanelHeader title="Node Library" />
            <SidebarContent
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </motion.div>
        )}
      </motion.div>

      {/* ── Mobile floating toggle button (below md) ── */}
      {/* Positioned bottom-left, above CanvasToolbar which is bottom-right */}
      <button
        onClick={openMobile}
        aria-label="Open node library"
        className="md:hidden fixed bottom-4 left-4 z-30 flex items-center gap-2 h-11 px-3 rounded-[var(--radius-lg)] glass text-primary focus-ring transition-fast active:scale-95"
        style={{
          boxShadow: "0 4px 16px oklch(10% 0.005 260 / 0.35)",
        }}
      >
        <Library size={16} style={{ color: "var(--accent-primary)" }} />
        <span className="text-caption-1 font-medium">Nodes</span>
      </button>

      {/* ── Mobile overlay sidebar (below md) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop — tap to close */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="md:hidden fixed inset-0 z-40"
              style={{
                background: "oklch(8% 0.005 260 / 0.6)",
                backdropFilter: "blur(2px)",
                WebkitBackdropFilter: "blur(2px)",
              }}
              aria-hidden="true"
            />

            {/* Overlay panel sliding in from the left */}
            <motion.div
              key="sidebar-overlay"
              role="dialog"
              aria-label="Node library"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={springTransition}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 flex flex-col glass overflow-hidden"
              style={{
                width: "min(320px, 85vw)",
                borderTopRightRadius: "var(--radius-lg)",
                borderBottomRightRadius: "var(--radius-lg)",
              }}
            >
              {/* Header with close button */}
              <div className="panel-header flex items-center justify-between px-3 py-2 shrink-0">
                <span className="text-footnote font-medium text-primary">
                  Node Library
                </span>
                <IconButton size="sm" onClick={closeMobile} aria-label="Close node library">
                  <X size={14} />
                </IconButton>
              </div>
              <SidebarContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
