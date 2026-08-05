"use client";

import { use, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  presetStrategies,
  presetNodeGraphs,
  type StrategyPreset,
  type PresetNodeGraph,
} from "@/lib/seed-data";
import { useCanvasStore } from "@/lib/stores/canvasStore";

// ── Pre-authored thesis copy (preset → plain-English summary). Lives with the
// page, not seed-data, because it's editorial voice — not backtest truth. ──

const presetTheses: Record<string, string> = {
  "btc-mean-rev":
    "Dip-buys BTC on the 4-hour chart when the RSI falls below 30, holding until the momentum snaps back above 70 or a 2% stop takes it out.",
  "macd-div-swing":
    "Waits for bullish MACD divergences on the daily chart — the kind that mark capitulations — then rides the swing with a 3-to-1 reward ratio.",
  "boll-squeeze":
    "Watches EUR/USD for Bollinger Band compression, then enters the breakout when the squeeze releases in either direction.",
  "golden-cross":
    "Rides the 50/200 moving-average crossover on Ethereum daily. Enters on the golden cross, exits on the death cross. Slow, but the classic has teeth.",
  "vol-breakout":
    "Apple hourly: flags price breakouts confirmed by above-average volume, entering with tight stops and letting winners run.",
  "triple-ema":
    "Reads the 8/21/55 EMA alignment as a trend signature, then enters pullbacks to the 21 — the middle of the ribbon.",
  "rsi-macd-combo":
    "Requires both RSI oversold and a MACD bull cross before entry — an AND-gate that trades less but wins more.",
  "ema-ribbon":
    "Enters long only when EMA(8) crosses above EMA(21) while still above EMA(55). A trend-alignment filter that refuses chop.",
  "bb-squeeze-breakout":
    "ETH hourly: detects Bollinger bandwidth contraction, then enters on the breakout above the upper band with an ATR-sized stop.",
  "momentum-adx":
    "Goes long when price momentum (ROC) is positive and ADX confirms the trend has strength — not just direction.",
};

// ── Health rating → editorial verdict phrase (no "Strong Edge" pill shouting) ──

const healthVerdict: Record<string, string> = {
  "strong-edge": "Notable edge across the sample window.",
  "solid-edge": "Edge is real, but modest. Worth holding.",
  marginal: "Close to coin-flip. Treat as experimental.",
  "no-edge": "No measurable edge in this sample.",
  "too-good": "Result looks too clean — suspect overfit.",
};

// ── Deterministic seeded equity curve derived from totalReturn + maxDD ──
// We don't run a live backtest on this page — that'd be wasted compute for a
// share-link first paint. Instead we synthesize a plausible curve from the
// preset's baked stats that happens to pass through the right endpoints and
// touch the right drawdown. Same input → same output (stable for SSR).

function synthesizeEquity(
  totalReturn: number,
  maxDrawdown: number,
  seed: number,
  points = 96,
): number[] {
  const rand = (() => {
    let s = seed;
    return () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  })();

  const curve: number[] = [100];
  const drift = totalReturn / points;
  const ddPointIdx = Math.floor(points * (0.35 + rand() * 0.3));
  const ddBeforeSlope =
    ddPointIdx > 0 ? maxDrawdown / ddPointIdx : maxDrawdown;

  for (let i = 1; i <= points; i++) {
    const prev = curve[i - 1];
    const noise = (rand() - 0.5) * Math.abs(totalReturn) * 0.04;
    let step = drift + noise;
    // Bias the curve to touch maxDrawdown around ddPointIdx
    if (i <= ddPointIdx) {
      step += ddBeforeSlope * 0.18;
    } else {
      step += ((totalReturn - maxDrawdown) / (points - ddPointIdx)) * 0.18;
    }
    curve.push(prev + step);
  }
  // Anchor final point to exact totalReturn
  curve[curve.length - 1] = 100 + totalReturn;
  return curve;
}

// ── Format helpers ──

const fmtPct = (n: number, opts: { sign?: boolean } = {}) => {
  const sign = opts.sign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
};
const fmtNum = (n: number, digits = 2) => n.toFixed(digits);

function formatAbsoluteWindow(days = 720): { start: string; end: string } {
  const end = new Date("2026-04-15");
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const m = (d: Date) =>
    d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  return { start: m(start), end: m(end) };
}

// ── Sparkline (editorial restraint: one amber line, faint fill, dotted baseline) ──

function EquitySparkline({ data }: { data: number[] }) {
  const { start, end } = formatAbsoluteWindow();
  const w = 100;
  const h = 100;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = Math.max(1, max - min);
  const stepX = w / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = h - ((v - min) / span) * h;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");
  const fillPath = `${linePath} L${w},${h} L0,${h} Z`;
  const baseline = h - ((100 - min) / span) * h;

  const endValue = data[data.length - 1];
  const delta = endValue - 100;

  return (
    <div>
      <svg
        className="ed-spark"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
      >
        <path className="fill" d={fillPath} />
        <line className="base" x1={0} y1={baseline} x2={w} y2={baseline} />
        <path className="line" d={linePath} />
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 10,
          gap: 16,
        }}
      >
        <div>
          <div
            className="ed-small-caps"
            style={{ color: "var(--ink-faint)", fontSize: 10 }}
          >
            Opening
          </div>
          <div className="num" style={{ color: "var(--ink-dim)", fontSize: 13, marginTop: 2 }}>
            {start} · 100.0
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            className="ed-small-caps"
            style={{ color: "var(--ink-faint)", fontSize: 10 }}
          >
            Closing
          </div>
          <div
            className="num"
            style={{
              color: delta >= 0 ? "var(--amber)" : "var(--crimson)",
              fontSize: 13,
              marginTop: 2,
            }}
          >
            {end} · {fmtNum(endValue, 1)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Schematic (numbered, architectural — not React Flow) ──
// Laid out horizontally with row-packing, monospace labels, italicised amber
// indices, hairline edges with small end-dots (not arrows). Reads as a textbook
// diagram more than an app view.

interface SchematicNode {
  id: string;
  idx: number;
  label: string;
  category: string;
  keyParam: string;
  col: number;
  row: number;
}

function buildSchematicLayout(graph: PresetNodeGraph): {
  nodes: SchematicNode[];
  edges: { from: string; to: string }[];
} {
  // Normalise preset positions into column/row grid.
  const xs = Array.from(new Set(graph.nodes.map((n) => n.position.x))).sort((a, b) => a - b);
  const ys = Array.from(new Set(graph.nodes.map((n) => n.position.y))).sort((a, b) => a - b);
  const colOf = (x: number) => xs.indexOf(x);
  const rowOf = (y: number) => ys.indexOf(y);

  const nodes: SchematicNode[] = graph.nodes.map((n, i) => ({
    id: n.id,
    idx: i + 1,
    label: n.data.label,
    category: n.data.category,
    keyParam: summariseParams(n.data.params, n.data.nodeType),
    col: colOf(n.position.x),
    row: rowOf(n.position.y),
  }));

  return { nodes, edges: graph.edges.map((e) => ({ from: e.source, to: e.target })) };
}

function summariseParams(
  params: Record<string, unknown>,
  nodeType: string,
): string {
  if (nodeType === "price-data") {
    return `${params.asset ?? ""} · ${params.timeframe ?? ""}`;
  }
  if (nodeType === "rsi") return `period ${params.period}`;
  if (nodeType === "macd")
    return `${params.fast}/${params.slow}/${params.signal}`;
  if (nodeType === "ema") return `period ${params.period}`;
  if (nodeType === "bollinger") return `${params.period}, ${params.stdDev}σ`;
  if (nodeType === "less-than" || nodeType === "greater-than")
    return `${params.operator} ${params.value}`;
  if (nodeType === "crosses-above" || nodeType === "crosses-below")
    return String(params.operator ?? "crosses");
  if (nodeType === "market-entry") return String(params.side ?? "");
  if (nodeType === "stop-loss" || nodeType === "take-profit") {
    const p = params.percent as number;
    return `${p > 0 ? "+" : ""}${p}%`;
  }
  const firstKey = Object.keys(params)[0];
  if (firstKey) return `${firstKey}: ${String(params[firstKey])}`;
  return "";
}

const categoryTag: Record<string, string> = {
  data: "DATA",
  indicator: "INDICATOR",
  condition: "CONDITION",
  action: "ACTION",
  risk: "RISK",
};

function NodeSchematic({ graph }: { graph: PresetNodeGraph }) {
  const { nodes, edges } = useMemo(() => buildSchematicLayout(graph), [graph]);

  // Grid sizing
  const colCount = Math.max(...nodes.map((n) => n.col)) + 1;
  const rowCount = Math.max(...nodes.map((n) => n.row)) + 1;
  const boxW = 148;
  const boxH = 66;
  const gapX = 56;
  const gapY = 28;
  const padX = 12;
  const padY = 12;

  const width = colCount * boxW + (colCount - 1) * gapX + padX * 2;
  const height = rowCount * boxH + (rowCount - 1) * gapY + padY * 2;

  const posOf = (n: SchematicNode) => ({
    x: padX + n.col * (boxW + gapX),
    y: padY + n.row * (boxH + gapY),
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      className="ed-schematic"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Strategy node schematic"
    >
      {/* Edges first (behind nodes) */}
      {edges.map((e, i) => {
        const s = byId.get(e.from);
        const t = byId.get(e.to);
        if (!s || !t) return null;
        const sp = posOf(s);
        const tp = posOf(t);
        const x1 = sp.x + boxW;
        const y1 = sp.y + boxH / 2;
        const x2 = tp.x;
        const y2 = tp.y + boxH / 2;
        const midX = (x1 + x2) / 2;
        // Stepped hairline: horizontal out, vertical, horizontal in
        const d = `M${x1},${y1} L${midX},${y1} L${midX},${y2} L${x2},${y2}`;
        return (
          <g key={i}>
            <path className="edge" d={d} />
            <circle className="edge-dot" cx={x1} cy={y1} r={1.5} />
            <circle className="edge-dot" cx={x2} cy={y2} r={1.5} />
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => {
        const { x, y } = posOf(n);
        return (
          <g key={n.id}>
            <rect
              className="node-stroke"
              x={x}
              y={y}
              width={boxW}
              height={boxH}
              rx={2}
            />
            {/* Category tag top-left */}
            <text
              x={x + 12}
              y={y + 16}
              className="node-param"
              style={{ letterSpacing: "0.18em", fontSize: 9 }}
            >
              {categoryTag[n.category] ?? ""}
            </text>
            {/* Index top-right */}
            <text
              x={x + boxW - 12}
              y={y + 18}
              textAnchor="end"
              className="node-idx"
            >
              {n.idx}
            </text>
            {/* Label */}
            <text x={x + 12} y={y + 38} className="node-label">
              {n.label}
            </text>
            {/* Key param */}
            <text x={x + 12} y={y + 54} className="node-param">
              {n.keyParam}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Human-prose annotations generated from the node graph ──

function annotateNode(
  nodeType: string,
  params: Record<string, unknown>,
  label: string,
): React.ReactNode {
  const P = ({ children }: { children: React.ReactNode }) => (
    <span className="param">{children}</span>
  );
  const T = ({ children }: { children: React.ReactNode }) => (
    <span className="term">{children}</span>
  );
  switch (nodeType) {
    case "price-data":
      return (
        <>
          Source feed — <T>{String(params.asset)}</T> at{" "}
          <T>{String(params.timeframe)}</T> candles. Determines everything
          downstream.
        </>
      );
    case "rsi":
      return (
        <>
          Relative Strength Index, <P>period {String(params.period)}</P> on{" "}
          <P>{String(params.source ?? "close")}</P>. Measures momentum; values
          below 30 read as oversold, above 70 as overbought.
        </>
      );
    case "macd":
      return (
        <>
          MACD — <P>fast {String(params.fast)}</P>,{" "}
          <P>slow {String(params.slow)}</P>,{" "}
          <P>signal {String(params.signal)}</P>. A trend-following indicator
          derived from two EMAs; crossovers mark regime changes.
        </>
      );
    case "ema":
      return (
        <>
          Exponential moving average, <P>period {String(params.period)}</P>.
          Smooths price with a bias toward recent data.
        </>
      );
    case "bollinger":
      return (
        <>
          Bollinger Bands, <P>{String(params.period)} period</P>,{" "}
          <P>{String(params.stdDev)}σ</P> width. The band compression precedes
          breakouts.
        </>
      );
    case "less-than":
    case "greater-than":
      return (
        <>
          Condition gate — fires when the upstream value{" "}
          <T>
            {String(params.operator)} {String(params.value)}
          </T>
          .
        </>
      );
    case "crosses-above":
    case "crosses-below":
      return (
        <>
          Crossover trigger — fires on the bar where the upstream line{" "}
          <T>{String(params.operator ?? "crosses")}</T> the reference line.
        </>
      );
    case "market-entry":
      return (
        <>
          Entry — opens a <T>{String(params.side ?? "Long")}</T> position at
          market on the next bar when upstream fires.
        </>
      );
    case "stop-loss": {
      const pct = params.percent as number;
      return (
        <>
          Stop loss — exits at <P>{pct}%</P> from entry, capping the loss on
          any single trade.
        </>
      );
    }
    case "take-profit": {
      const pct = params.percent as number;
      return (
        <>
          Take profit — exits at <P>+{pct}%</P> from entry, locking in the
          winner before mean reversion eats it.
        </>
      );
    }
    default:
      return <>{label}.</>;
  }
}

// ── Share pills ──

// location.href never changes for the lifetime of this page, so the share-URL
// store has nothing to subscribe to.
const emptySubscribe = () => () => {};

function SharePills({ href, name }: { href: string; name: string }) {
  const shareText = `Check this strategy on SignalForge — ${name}`;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <a
        className="ed-share"
        target="_blank"
        rel="noreferrer noopener"
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(href)}&text=${encodeURIComponent(shareText)}`}
      >
        <span className="ed-small-caps">Post on X</span>
      </a>
      <a
        className="ed-share"
        target="_blank"
        rel="noreferrer noopener"
        href={`https://www.reddit.com/submit?url=${encodeURIComponent(href)}&title=${encodeURIComponent(name)}`}
      >
        <span className="ed-small-caps">Submit to Reddit</span>
      </a>
      <button
        className="ed-share"
        type="button"
        onClick={() => {
          if (typeof navigator !== "undefined") {
            navigator.clipboard?.writeText(href).catch(() => {});
          }
        }}
      >
        <span className="ed-small-caps">Copy link</span>
      </button>
    </div>
  );
}

// ── Page ──

export default function SharedStrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const loadPreset = useCanvasStore((s) => s.loadPreset);

  const preset = presetStrategies.find((p) => p.id === id);
  const graph = presetNodeGraphs[id];

  const equity = useMemo(
    () =>
      preset
        ? synthesizeEquity(preset.stats.totalReturn, preset.stats.maxDrawdown, hashSeed(id))
        : [],
    [id, preset],
  );
  const issueNumber = useMemo(() => {
    const n = Array.from(id).reduce((a, c) => a + c.charCodeAt(0), 0);
    return String(n % 99).padStart(2, "0");
  }, [id]);

  // Server snapshot renders the canonical URL, client snapshot the real
  // address — useSyncExternalStore reconciles the two without a hydration
  // mismatch on the share links.
  const currentUrl = useSyncExternalStore(
    emptySubscribe,
    () => globalThis.location.href,
    () => `https://signalforge.app/s/${id}`,
  );

  if (!preset || !graph) {
    return <NotFound id={id} />;
  }

  const thesis =
    presetTheses[id] ?? preset.description ?? "A strategy on SignalForge.";
  const sampleWindow = formatAbsoluteWindow();
  const rewardToRisk = Math.abs(preset.stats.totalReturn / preset.stats.maxDrawdown);
  const sharpeShown =
    preset.stats.totalTrades >= 10 ? preset.stats.sharpe : null;
  const verdict = healthVerdict[preset.health] ?? "";

  const onFork = () => {
    loadPreset(id);
    router.push(`/strategy/${id}`);
  };

  return (
    <main className="ed-page">
      {/* ── Small back nav ── */}
      <nav
        className="ed-fade"
        data-delay="1"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 48,
        }}
      >
        <Link href="/" className="ed-backlink">
          SignalForge — Issue {issueNumber}
        </Link>
        <span
          className="ed-dateline"
          style={{ color: "var(--ink-ghost)" }}
        >
          Shared Strategy
        </span>
      </nav>

      {/* ── Masthead ── */}
      <header className="ed-masthead ed-fade" data-delay="2">
        <div className="ed-kicker" style={{ marginBottom: 18 }}>
          Strategy №{issueNumber} · {preset.asset} · {preset.timeframe}
        </div>
        <h1 className="ed-headline">{prettifyName(preset.name)}</h1>
        <p className="ed-deck" style={{ marginTop: 22 }}>
          {thesis}
        </p>
        <div
          className="ed-dateline"
          style={{ marginTop: 28, display: "flex", alignItems: "center", flexWrap: "wrap" }}
        >
          <span>Simulated backtest</span>
          <span className="dot" />
          <span className="num">
            {sampleWindow.start} – {sampleWindow.end}
          </span>
          <span className="dot" />
          <span>{preset.stats.totalTrades} trades</span>
          <span className="dot" />
          <span>{preset.complexity}</span>
        </div>
      </header>

      <hr className="ed-rule" />

      {/* ── Spread: thesis left, stats right ── */}
      <section className="ed-spread ed-fade" data-delay="3">
        <div>
          <div className="ed-kicker" style={{ marginBottom: 16 }}>
            Thesis
          </div>
          <blockquote className="ed-pullquote">
            {pullquoteFor(preset)}
          </blockquote>

          <div className="ed-body" style={{ marginTop: 28, maxWidth: "46ch" }}>
            <p style={{ margin: "0 0 14px" }}>
              {verdict} Over {preset.stats.totalTrades} trades in the sample
              window, the strategy returned{" "}
              <span className="num" style={{ color: "var(--ink)" }}>
                {fmtPct(preset.stats.totalReturn, { sign: true })}
              </span>{" "}
              with a peak-to-trough drawdown of{" "}
              <span className="num" style={{ color: "var(--ink)" }}>
                {fmtPct(preset.stats.maxDrawdown)}
              </span>
              .
            </p>
            <p style={{ margin: 0 }}>
              Reward-to-risk ratio —{" "}
              <span className="num" style={{ color: "var(--ink)" }}>
                {fmtNum(rewardToRisk, 2)}×
              </span>
              . Returns divided by drawdown. Pure past, not forecast.
            </p>
          </div>
        </div>

        <aside>
          <div className="ed-kicker" style={{ marginBottom: 16 }}>
            Results at a glance
          </div>

          <div className="ed-stats">
            <Stat
              label="Return"
              value={fmtPct(preset.stats.totalReturn, { sign: true })}
              tone={preset.stats.totalReturn >= 0 ? "positive" : "negative"}
            />
            <Stat
              label="Sharpe"
              value={sharpeShown === null ? "—" : fmtNum(sharpeShown, 2)}
              tone={sharpeShown === null ? "dash" : "neutral"}
              note={sharpeShown === null ? "Below 10-trade threshold" : undefined}
            />
            <Stat
              label="Win rate"
              value={fmtPct(preset.stats.winRate)}
              tone="neutral"
            />
            <Stat
              label="Max drawdown"
              value={fmtPct(preset.stats.maxDrawdown)}
              tone="negative"
            />
            <Stat
              label="Trades"
              value={String(preset.stats.totalTrades)}
              tone="neutral"
            />
            <Stat
              label="Verdict"
              value={prettifyHealth(preset.health)}
              tone={
                preset.health === "strong-edge" || preset.health === "solid-edge"
                  ? "positive"
                  : preset.health === "too-good" || preset.health === "marginal"
                    ? "neutral"
                    : "negative"
              }
            />
          </div>

          <div style={{ marginTop: 28 }}>
            <div className="ed-kicker" style={{ marginBottom: 12 }}>
              Equity, indexed to 100
            </div>
            <EquitySparkline data={equity} />
          </div>
        </aside>
      </section>

      {/* ── Decorative divider ── */}
      <div className="ed-rule-diamond" aria-hidden>
        <span>◆</span>
      </div>

      {/* ── Schematic ── */}
      <section className="ed-fade" data-delay="4">
        <div className="ed-kicker" style={{ marginBottom: 18 }}>
          The strategy, rendered
        </div>
        <NodeSchematic graph={graph} />

        {/* Numbered footnotes */}
        <div className="ed-annot">
          {graph.nodes.map((n, i) => (
            <div
              key={n.id}
              className="idx"
              style={{ gridColumn: 1 }}
              aria-hidden
            >
              {i + 1}
            </div>
          )).flatMap((idxEl, i) => [
            idxEl,
            <div key={`${graph.nodes[i].id}-prose`} className="prose" style={{ gridColumn: 2 }}>
              {annotateNode(
                graph.nodes[i].data.nodeType,
                graph.nodes[i].data.params,
                graph.nodes[i].data.label,
              )}
            </div>,
          ])}
        </div>
      </section>

      <div className="ed-rule-diamond" aria-hidden>
        <span>◆</span>
      </div>

      {/* ── Fork CTA ── */}
      <section
        className="ed-fade"
        data-delay="5"
        style={{ textAlign: "center", paddingTop: 16, paddingBottom: 24 }}
      >
        <div
          className="ed-kicker"
          style={{ marginBottom: 18, color: "var(--ink-faint)" }}
        >
          Take it from here
        </div>
        <button type="button" className="ed-fork" onClick={onFork}>
          <span>Fork this strategy</span>
          <span className="arrow" aria-hidden>
            →
          </span>
        </button>
        <div className="ed-fork-caption">
          Clones to your canvas. Editable in under a minute.
        </div>

        <div style={{ marginTop: 40 }}>
          <div
            className="ed-kicker"
            style={{ marginBottom: 12, color: "var(--ink-faint)" }}
          >
            Or share it
          </div>
          <SharePills href={currentUrl} name={preset.name} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          marginTop: 72,
          paddingTop: 32,
          borderTop: "1px solid var(--rule)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div
          className="ed-body"
          style={{ fontSize: 11.5, color: "var(--ink-ghost)", letterSpacing: "0.04em", maxWidth: "58ch" }}
        >
          Results are from simulated market data (deterministic seeded
          candles), not live historical prices — see the README. Past
          performance isn&apos;t predictive. Backtests have sample bias,
          survivorship bias, and lookahead bias unless stated otherwise. A
          strategy that worked for 720 simulated days can stop working
          tomorrow. Read the logic before you run it with capital.
        </div>
        <div
          className="ed-kicker"
          style={{ color: "var(--ink-ghost)" }}
        >
          SignalForge — <em style={{ fontStyle: "italic", fontFamily: "var(--font-fraunces)", letterSpacing: 0 }}>Your edge, made visible.</em>
        </div>
      </footer>
    </main>
  );
}

// ── Little UI atoms ──

function Stat({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone: "positive" | "negative" | "neutral" | "dash";
  note?: string;
}) {
  const valueClass =
    tone === "positive"
      ? "num value positive"
      : tone === "negative"
        ? "num value negative"
        : tone === "dash"
          ? "value dash"
          : "num value";
  return (
    <div className="cell">
      <span className="label">{label}</span>
      <span className={valueClass}>{value}</span>
      {note && <span className="note">{note}</span>}
    </div>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <main className="ed-page" style={{ paddingTop: 120 }}>
      <div className="ed-kicker" style={{ marginBottom: 18 }}>
        404 · Strategy not found
      </div>
      <h1 className="ed-headline">
        Nothing <em>here</em>.
      </h1>
      <p className="ed-deck" style={{ marginTop: 22 }}>
        No strategy was found at{" "}
        <span className="num" style={{ color: "var(--ink)" }}>
          /s/{id}
        </span>
        . The link may have been mistyped, or the strategy was deleted.
      </p>
      <div style={{ marginTop: 36, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link
          href="/presets"
          className="ed-fork"
          style={{ textDecoration: "none" }}
        >
          <span>Browse presets</span>
          <span className="arrow" aria-hidden>
            →
          </span>
        </Link>
        <Link href="/" className="ed-share" style={{ textDecoration: "none" }}>
          <span className="ed-small-caps">Dashboard</span>
        </Link>
      </div>
    </main>
  );
}

// ── Helpers ──

function prettifyName(name: string): string {
  return name;
}

function prettifyHealth(h: string): string {
  switch (h) {
    case "strong-edge":
      return "Strong";
    case "solid-edge":
      return "Solid";
    case "marginal":
      return "Marginal";
    case "no-edge":
      return "None";
    case "too-good":
      return "Suspect";
    default:
      return h;
  }
}

function pullquoteFor(preset: StrategyPreset): string {
  // Editorial pull-quote — sharpened, quotable restatement of the thesis.
  const presetTitle = preset.name.toLowerCase();
  if (presetTitle.includes("mean rev"))
    return "Buy fear, sell mean reversion. Let the RSI tell you when the market has overshot.";
  if (presetTitle.includes("macd"))
    return "Divergence is the market confessing something it hasn't priced yet. Listen for it.";
  if (presetTitle.includes("squeeze"))
    return "Volatility compresses before it expands. The squeeze is the loaded spring.";
  if (presetTitle.includes("golden"))
    return "Slow crossovers. Wide stops. Big trends. The oldest idea in the book still pays.";
  if (presetTitle.includes("breakout"))
    return "A price breakout without volume is a head fake. Require both, or sit out.";
  if (presetTitle.includes("triple ema"))
    return "The ribbon tells you the trend. The pullback gives you price. Wait for both.";
  if (presetTitle.includes("combo"))
    return "Two signals agreeing beats one signal shouting. Trade less, win more.";
  if (presetTitle.includes("ribbon"))
    return "Ribbons are a shape-recognition trade. The shape says trend. Enter on the test.";
  if (presetTitle.includes("momentum"))
    return "Direction without strength is drift. ADX tells you the trend has conviction.";
  return `The edge is visible in the nodes below. Audit it before you capitalise it.`;
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}
