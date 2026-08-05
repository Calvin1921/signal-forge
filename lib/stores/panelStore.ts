import { create } from "zustand";

interface PanelState {
  sidebarExpanded: boolean;
  backtestPanelOpen: boolean;
  minimapVisible: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleBacktestPanel: () => void;
  openBacktestPanel: () => void;
  closeBacktestPanel: () => void;
  toggleMinimap: () => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  sidebarExpanded: false,
  backtestPanelOpen: false,
  minimapVisible: true,
  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  toggleBacktestPanel: () => set((s) => ({ backtestPanelOpen: !s.backtestPanelOpen })),
  openBacktestPanel: () => set({ backtestPanelOpen: true }),
  closeBacktestPanel: () => set({ backtestPanelOpen: false }),
  toggleMinimap: () => set((s) => ({ minimapVisible: !s.minimapVisible })),
}));
