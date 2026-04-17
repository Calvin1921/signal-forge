"use client";

import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, Map } from "lucide-react";
import { usePanelStore } from "@/lib/stores/panelStore";
import { IconButton } from "@/components/ui/IconButton";
import { Divider } from "@/components/ui/Divider";

export function CanvasToolbar() {
  const reactFlow = useReactFlow();
  const { minimapVisible, toggleMinimap } = usePanelStore();

  const handleZoomIn = () => {
    reactFlow.zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    reactFlow.zoomOut({ duration: 200 });
  };

  const handleFitView = () => {
    // Mirror the mount-time fit options so pressing the fit button shows the
    // same framing as auto-fit (esp. at 375px where minZoom 0.4 would still
    // clip 8-node presets).
    reactFlow.fitView({ padding: 0.15, maxZoom: 1.2, minZoom: 0.15, duration: 300 });
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-20 flex items-center justify-between h-11 px-2 py-1.5 rounded-[var(--radius-lg)] glass"
      style={{ width: 200 }}
    >
      <IconButton onClick={handleZoomOut} title="Zoom out">
        <ZoomOut size={16} />
      </IconButton>
      <IconButton onClick={handleZoomIn} title="Zoom in">
        <ZoomIn size={16} />
      </IconButton>
      <Divider />
      <IconButton onClick={handleFitView} title="Fit to view">
        <Maximize size={16} />
      </IconButton>
      <IconButton onClick={toggleMinimap} active={minimapVisible} title="Toggle minimap">
        <Map size={16} />
      </IconButton>
    </div>
  );
}
