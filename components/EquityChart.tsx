"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, type IChartApi, type Time, AreaSeries } from "lightweight-charts";
import { generateEquityCurve } from "@/lib/seed-data";
import { chartColors } from "@/lib/chart-colors";

export function EquityChart({ height = 300 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: chartColors["surface-1-half"] },
        textColor: chartColors["text-secondary"],
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: chartColors["grid"] },
        horzLines: { color: chartColors["grid"] },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
      },
      crosshair: {
        vertLine: { color: chartColors["text-secondary-30"], labelBackgroundColor: chartColors["surface-2"] },
        horzLine: { color: chartColors["text-secondary-30"], labelBackgroundColor: chartColors["surface-2"] },
      },
    });

    chartRef.current = chart;

    const data = generateEquityCurve(90);

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: chartColors["accent-primary"],
      topColor: chartColors["accent-primary-30"],
      bottomColor: chartColors["accent-primary-02"],
      lineWidth: 2,
      priceLineVisible: false,
    });

    areaSeries.setData(
      data.map((d) => ({
        time: d.time as Time,
        value: d.value,
      }))
    );

    chart.timeScale().fitContent();

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
    };
  }, [height]);

  return (
    <div className="rounded-[var(--radius-lg)] overflow-hidden glass">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-headline text-secondary">Portfolio Equity</span>
        <span className="text-caption-1 text-muted">90 days</span>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
