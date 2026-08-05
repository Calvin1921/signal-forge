"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { MonospaceValue } from "@/components/ui/MonospaceValue";
import { HealthPill } from "@/components/HealthPill";
import { EquityChart } from "@/components/EquityChart";
import { DashboardTradeTable } from "@/components/dashboard/DashboardTradeTable";
import {
  dashboardStats,
  activeStrategies,
  generateSparkline,
} from "@/lib/seed-data";
import { useCanvasStore } from "@/lib/stores/canvasStore";
import { TrendingUp, Bell } from "lucide-react";

function Sparkline({ data, color = "oklch(75% 0.15 200)", width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const sparklineData = generateSparkline(20);

// Per-strategy sparkline data, seeded per strategy for deterministic rendering
const strategySparklines: Record<string, number[]> = Object.fromEntries(
  activeStrategies.map((s, i) => [s.id, generateSparkline(16, 700 + i)])
);

export default function DashboardPage() {
  const router = useRouter();
  const loadPreset = useCanvasStore((s) => s.loadPreset);

  function handleStrategyClick(strategyId: string) {
    loadPreset(strategyId);
    router.push(`/strategy/${strategyId}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 px-6 md:px-8 py-6 md:py-8 max-w-[1440px] mx-auto w-full flex flex-col gap-6 md:gap-8">
        {/* Stat Cards — 16px padding, 24px gap */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Portfolio P&L Today */}
          <SurfaceCard level={2}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-footnote text-secondary">Portfolio P&L Today</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <MonospaceValue
                    value={`+$${dashboardStats.portfolioPnlToday.toFixed(2)}`}
                    sentiment="profit"
                    className="text-title-2"
                  />
                  <MonospaceValue
                    value={`+${dashboardStats.portfolioPnlPercent}%`}
                    sentiment="profit"
                    className="text-footnote"
                  />
                </div>
              </div>
              <Sparkline data={sparklineData} />
            </div>
          </SurfaceCard>

          {/* Win Rate */}
          <SurfaceCard level={2}>
            <span className="text-footnote text-secondary">Win Rate (30d)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <MonospaceValue
                value={`${dashboardStats.winRate30d}%`}
                sentiment="neutral"
                className="text-title-2"
              />
              <span className="flex items-center gap-1 text-caption-1" style={{ color: "var(--semantic-profit)" }}>
                <TrendingUp size={12} />
                was {dashboardStats.winRatePrev}%
              </span>
            </div>
          </SurfaceCard>

          {/* Active Strategies */}
          <SurfaceCard level={2}>
            <span className="text-footnote text-secondary">Active Strategies</span>
            <div className="flex items-baseline gap-2 mt-1">
              <MonospaceValue
                value={dashboardStats.activeStrategies.toString()}
                sentiment="neutral"
                className="text-title-2"
              />
            </div>
            <span className="text-caption-1 text-muted mt-1 block">{dashboardStats.healthDistribution}</span>
          </SurfaceCard>

          {/* Overnight Signals */}
          <SurfaceCard level={2}>
            <span className="text-footnote text-secondary">Overnight Signals</span>
            <div className="flex items-baseline gap-2 mt-1">
              <MonospaceValue
                value={`${dashboardStats.overnightSignals} new`}
                sentiment="neutral"
                className="text-title-2"
              />
              <Bell size={14} style={{ color: "var(--accent-primary)" }} />
            </div>
            <span className="text-caption-1 text-muted mt-1 block">{dashboardStats.overnightDetail}</span>
          </SurfaceCard>
        </div>

        {/* Equity Chart */}
        <EquityChart height={280} />

        {/* Two-column: Strategies + Recent Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Active Strategies */}
          <div>
            <h2 className="text-headline text-secondary mb-4">Active Strategies</h2>
            <div className="flex flex-col gap-3">
              {activeStrategies.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleStrategyClick(s.id)}
                  className="cursor-pointer"
                >
                  <SurfaceCard level={2} hoverable>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-subhead font-semibold text-primary">{s.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-caption-1 bg-surface-3 px-2 py-0.5 rounded-[var(--radius-sm)]">
                            {s.asset}
                          </span>
                          <span className="text-caption-1 text-muted">{s.timeframe}</span>
                          <span className="text-caption-1 text-muted">Last signal: {s.lastSignal}</span>
                        </div>
                      </div>
                      <HealthPill health={s.health} size="sm" />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-4">
                        <MonospaceValue
                          value={`${s.pnl > 0 ? "+" : ""}$${s.pnl.toLocaleString()}`}
                          sentiment={s.pnl >= 0 ? "profit" : "loss"}
                          className="text-subhead font-medium"
                        />
                        <MonospaceValue
                          value={`${s.pnlPercent > 0 ? "+" : ""}${s.pnlPercent}%`}
                          sentiment={s.pnlPercent >= 0 ? "profit" : "loss"}
                          className="text-caption-1"
                        />
                      </div>
                      <Sparkline
                        data={strategySparklines[s.id] || sparklineData}
                        color={s.pnl >= 0 ? "var(--semantic-profit)" : "var(--semantic-loss)"}
                        width={80}
                        height={24}
                      />
                    </div>
                  </SurfaceCard>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades */}
          <div>
            <h2 className="text-headline text-secondary mb-4">Recent Trades</h2>
            <SurfaceCard level={2} className="p-0 overflow-hidden">
              <DashboardTradeTable />
            </SurfaceCard>
          </div>
        </div>
      </main>
    </div>
  );
}
