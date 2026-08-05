"use client";

import { Navbar } from "@/components/Navbar";
import { GradientButton } from "@/components/ui/GradientButton";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { useCanvasStore, BLANK_STRATEGY_ROUTE } from "@/lib/stores/canvasStore";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

// Previews the canvas's real node visual language so first-timers have a
// mental model before they commit. Uses the same --node-* OKLCH tokens the
// live canvas uses — keeps them in sync visually.
function NodeFlowIllustration() {
  const cardFill = "oklch(22% 0.012 260 / 0.8)";
  const cardStroke = "oklch(40% 0.008 260 / 0.45)";

  return (
    <svg
      viewBox="0 0 420 120"
      role="img"
      aria-label="Three connected strategy nodes: Price Data, RSI indicator, and Entry action"
      className="w-full max-w-[420px] mx-auto"
      style={{ height: "auto" }}
    >
      {/* ── Connecting edges (drawn first, behind cards) ── */}
      <path
        d="M 115 60 C 140 60, 140 60, 165 60"
        stroke="var(--node-data)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 4"
        opacity="0.7"
      />
      <path
        d="M 255 60 C 280 60, 280 60, 305 60"
        stroke="var(--node-indicator)"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 4"
        opacity="0.7"
      />

      {/* ── Connection dots on each edge ── */}
      <circle cx="115" cy="60" r="3" fill="var(--node-data)" />
      <circle cx="165" cy="60" r="3" fill="var(--node-data)" />
      <circle cx="255" cy="60" r="3" fill="var(--node-indicator)" />
      <circle cx="305" cy="60" r="3" fill="var(--node-indicator)" />
      <circle cx="395" cy="60" r="3" fill="var(--node-action)" />

      {/* ── Card 1: Price Data (data=cyan) ── */}
      <g>
        <rect
          x="25"
          y="35"
          width="90"
          height="50"
          rx="6"
          fill={cardFill}
          stroke={cardStroke}
          strokeWidth="1"
        />
        <rect
          x="25"
          y="35"
          width="3"
          height="50"
          rx="1.5"
          fill="var(--node-data)"
        />
        <circle cx="40" cy="52" r="4" fill="var(--node-data)" opacity="0.9" />
        <text
          x="50"
          y="55"
          fill="var(--text-primary)"
          fontSize="9"
          fontWeight="600"
          fontFamily="var(--font-inter), sans-serif"
        >
          Price Data
        </text>
        <text
          x="32"
          y="74"
          fill="var(--text-muted)"
          fontSize="7"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          BTC/USDT · 4h
        </text>
      </g>

      {/* ── Card 2: RSI (indicator=amber) ── */}
      <g>
        <rect
          x="165"
          y="35"
          width="90"
          height="50"
          rx="6"
          fill={cardFill}
          stroke={cardStroke}
          strokeWidth="1"
        />
        <rect
          x="165"
          y="35"
          width="3"
          height="50"
          rx="1.5"
          fill="var(--node-indicator)"
        />
        <circle
          cx="180"
          cy="52"
          r="4"
          fill="var(--node-indicator)"
          opacity="0.9"
        />
        <text
          x="190"
          y="55"
          fill="var(--text-primary)"
          fontSize="9"
          fontWeight="600"
          fontFamily="var(--font-inter), sans-serif"
        >
          RSI
        </text>
        <text
          x="172"
          y="74"
          fill="var(--text-muted)"
          fontSize="7"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          period: 14
        </text>
      </g>

      {/* ── Card 3: Entry (action=magenta) ── */}
      <g>
        <rect
          x="305"
          y="35"
          width="90"
          height="50"
          rx="6"
          fill={cardFill}
          stroke={cardStroke}
          strokeWidth="1"
        />
        <rect
          x="305"
          y="35"
          width="3"
          height="50"
          rx="1.5"
          fill="var(--node-action)"
        />
        <circle
          cx="320"
          cy="52"
          r="4"
          fill="var(--node-action)"
          opacity="0.9"
        />
        <text
          x="330"
          y="55"
          fill="var(--text-primary)"
          fontSize="9"
          fontWeight="600"
          fontFamily="var(--font-inter), sans-serif"
        >
          Entry
        </text>
        <text
          x="312"
          y="74"
          fill="var(--text-muted)"
          fontSize="7"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          Long · Market
        </text>
      </g>
    </svg>
  );
}

export default function NewStrategyPage() {
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const router = useRouter();

  const handleStartFromScratch = () => {
    clearCanvas();
    router.push(BLANK_STRATEGY_ROUTE);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <SurfaceCard
          level={2}
          className="max-w-xl w-full text-center p-6 sm:p-10"
        >
          {/* Illustration */}
          <div className="mb-6 sm:mb-8">
            <NodeFlowIllustration />
          </div>

          {/* Headline + subcopy */}
          <h1 className="text-title-2 text-primary mb-2">
            Build your setup visually
          </h1>
          <p className="text-subhead text-secondary mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
            Every node is a signal or a rule. Connect them, hit Backtest, and
            see your edge.
          </p>

          {/* Primary CTA (gradient — only primary gets gradients per design rule) */}
          <div className="flex flex-col items-center gap-3">
            <GradientButton
              size="lg"
              className="w-full sm:w-auto sm:min-w-[240px]"
              onClick={handleStartFromScratch}
            >
              Start from scratch
              <Plus size={16} />
            </GradientButton>

            {/* Secondary link */}
            <button
              onClick={() => router.push("/presets")}
              className="inline-flex items-center gap-1.5 text-footnote text-secondary hover:text-primary transition-fast focus-ring rounded-[var(--radius-sm)] px-2 py-1"
            >
              Or choose a preset
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Brand tagline — single-surface voice cue. Not repeated elsewhere. */}
          <p className="text-caption-1 text-muted italic mt-10">
            Your edge, made visible.
          </p>
        </SurfaceCard>
      </main>
    </div>
  );
}
