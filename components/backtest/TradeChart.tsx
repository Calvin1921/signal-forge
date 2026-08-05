"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type Time,
  ColorType,
  LineStyle,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
} from "lightweight-charts";
import type { OHLCVCandle } from "@/lib/generate-ohlcv";
import { chartColors } from "@/lib/chart-colors";
import { useBacktestStore } from "@/lib/stores/backtestStore";

interface TradeChartProps {
  height?: number;
  candles: OHLCVCandle[];
}

export function TradeChart({ height = 400, candles }: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const trades = useBacktestStore((s) => s.trades);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: chartColors["surface-0"] },
        textColor: chartColors["text-secondary"],
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: chartColors["grid"] },
        horzLines: { color: chartColors["grid"] },
      },
      crosshair: {
        vertLine: {
          color: chartColors["text-secondary-30"],
          labelBackgroundColor: chartColors["surface-2"],
        },
        horzLine: {
          color: chartColors["text-secondary-30"],
          labelBackgroundColor: chartColors["surface-2"],
        },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartColors["semantic-profit"],
      downColor: chartColors["semantic-loss"],
      borderUpColor: chartColors["semantic-profit"],
      borderDownColor: chartColors["semantic-loss"],
      wickUpColor: chartColors["semantic-profit-60"],
      wickDownColor: chartColors["semantic-loss-60"],
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as unknown as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // Build markers from actual trades
    const candleTimeMap = new Map<number, number>();
    candles.forEach((c, idx) => candleTimeMap.set(c.time, idx));

    type MarkerShape = "arrowUp" | "arrowDown" | "circle";
    type MarkerPosition = "belowBar" | "aboveBar";

    const markers: {
      time: Time;
      position: MarkerPosition;
      color: string;
      shape: MarkerShape;
      text: string;
    }[] = [];

    for (const trade of trades) {
      // Entry marker
      markers.push({
        time: trade.entryTime as unknown as Time,
        position: "belowBar",
        color: chartColors["accent-primary"],
        shape: trade.side === "Long" ? "arrowUp" : "arrowDown",
        text: trade.side,
      });

      // Exit marker
      const isProfit = trade.pnl > 0;
      markers.push({
        time: trade.exitTime as unknown as Time,
        position: "aboveBar",
        color: isProfit
          ? chartColors["semantic-profit"]
          : chartColors["semantic-loss"],
        shape: "circle",
        text: `${isProfit ? "+" : ""}${trade.pnlPercent.toFixed(1)}%`,
      });
    }

    // Sort markers by time (required by lightweight-charts)
    markers.sort((a, b) => (a.time as number) - (b.time as number));

    const seriesMarkers = createSeriesMarkers(candleSeries, markers);

    chart.timeScale().fitContent();

    const observer = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    observer.observe(containerRef.current);

    return () => {
      seriesMarkers.detach();
      observer.disconnect();
      chart.remove();
    };
  }, [height, candles, trades]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-[var(--radius-md)] overflow-hidden"
    />
  );
}

// RSI sub-chart
interface RSIChartProps {
  height?: number;
  rsiData: (number | null)[];
  candles: OHLCVCandle[];
}

export function RSIChart({ height = 150, rsiData, candles }: RSIChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: chartColors["surface-1-half"],
        },
        textColor: chartColors["text-secondary"],
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: chartColors["grid"] },
        horzLines: { color: chartColors["grid"] },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: { borderVisible: false, visible: false },
      crosshair: {
        vertLine: { visible: false },
        horzLine: {
          color: chartColors["text-secondary-30"],
          labelBackgroundColor: chartColors["surface-2"],
        },
      },
    });

    const rsiSeries = chart.addSeries(LineSeries, {
      color: chartColors["accent-primary"],
      lineWidth: 2,
      priceLineVisible: false,
    });

    const rsiChartData = candles
      .map((c, i) => ({
        time: c.time as unknown as Time,
        value: rsiData[i],
      }))
      .filter((d): d is { time: Time; value: number } => d.value !== null);

    rsiSeries.setData(rsiChartData);

    // Overbought/oversold bands
    const timeRange = candles
      .filter((_, i) => rsiData[i] !== null)
      .map((c) => ({ time: c.time as unknown as Time }));

    const ob = chart.addSeries(LineSeries, {
      color: chartColors["semantic-loss-40"],
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
    });
    ob.setData(timeRange.map((t) => ({ ...t, value: 70 })));

    const os = chart.addSeries(LineSeries, {
      color: chartColors["semantic-profit-40"],
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
    });
    os.setData(timeRange.map((t) => ({ ...t, value: 30 })));

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
  }, [height, rsiData, candles]);

  return (
    <div>
      <div className="text-xs text-secondary px-2 py-1">RSI (14)</div>
      <div
        ref={containerRef}
        className="w-full rounded-[var(--radius-md)] overflow-hidden"
      />
    </div>
  );
}
