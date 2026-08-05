"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { MonospaceValue } from "@/components/ui/MonospaceValue";
import { HealthPill } from "@/components/HealthPill";
import { GradientButton } from "@/components/ui/GradientButton";
import { presetStrategies } from "@/lib/seed-data";
import { useCanvasStore } from "@/lib/stores/canvasStore";
import { Copy } from "lucide-react";

const complexityColors: Record<string, string> = {
  Beginner: "var(--semantic-profit)",
  Intermediate: "var(--accent-primary)",
  Advanced: "var(--semantic-warning)",
};

const tabs = ["All", "Beginner", "Intermediate", "Advanced"];

export default function PresetsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const router = useRouter();
  const loadPreset = useCanvasStore((s) => s.loadPreset);

  const filtered =
    activeTab === "All"
      ? presetStrategies
      : presetStrategies.filter((s) => s.complexity === activeTab);

  function handleUsePreset(presetId: string) {
    loadPreset(presetId);
    router.push(`/strategy/${presetId}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-title-1 text-primary">Strategy Presets</h1>
            <p className="text-subhead text-secondary mt-1">
              Battle-tested strategies ready to deploy. Clone and customize to fit your style.
            </p>
          </div>
        </div>

        {/* Filter Tabs — min 44px touch targets */}
        <div className="flex items-center gap-1 mb-6 md:mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                "px-4 py-2 rounded-[var(--radius-sm)] text-subhead font-medium min-h-[44px] focus-ring",
                activeTab === tab
                  ? "bg-surface-2 text-primary"
                  : "text-secondary hover:text-primary hover:bg-surface-2",
              ].join(" ")}
              style={{
                transitionProperty: "color, background-color",
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-spring)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Preset Grid — 24px gap on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((preset) => (
            <SurfaceCard key={preset.id} level={2} hoverable className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-subhead font-semibold text-primary">{preset.name}</h3>
                  <p className="text-footnote text-secondary mt-1 line-clamp-2">{preset.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-caption-1 bg-surface-3 px-2 py-0.5 rounded-[var(--radius-sm)] text-primary">
                  {preset.asset}
                </span>
                <span
                  className="text-caption-1 px-2 py-0.5 rounded-[var(--radius-sm)]"
                  style={{
                    color: complexityColors[preset.complexity],
                    background: `color-mix(in oklch, ${complexityColors[preset.complexity]} 12%, transparent)`,
                  }}
                >
                  {preset.complexity}
                </span>
                <HealthPill health={preset.health} size="sm" />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <div className="flex flex-col">
                  <span className="text-caption-1 text-muted uppercase tracking-wider">Win Rate</span>
                  <MonospaceValue
                    value={`${preset.stats.winRate}%`}
                    sentiment="neutral"
                    className="text-subhead font-medium"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-caption-1 text-muted uppercase tracking-wider">Sharpe</span>
                  <MonospaceValue
                    value={preset.stats.sharpe.toFixed(1)}
                    sentiment="neutral"
                    className="text-subhead font-medium"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-caption-1 text-muted uppercase tracking-wider">Return</span>
                  <MonospaceValue
                    value={`${preset.stats.totalReturn > 0 ? "+" : ""}${preset.stats.totalReturn}%`}
                    sentiment={preset.stats.totalReturn >= 0 ? "profit" : "loss"}
                    className="text-subhead font-medium"
                  />
                </div>
              </div>

              <div className="mt-auto pt-2">
                <GradientButton
                  size="sm"
                  className="w-full"
                  onClick={() => handleUsePreset(preset.id)}
                >
                  <Copy size={14} />
                  Use Preset
                </GradientButton>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </main>
    </div>
  );
}
