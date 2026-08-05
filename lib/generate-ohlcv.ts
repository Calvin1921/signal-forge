/**
 * Deterministic OHLCV data generator for backtesting.
 * Uses a seeded PRNG so identical inputs always produce identical outputs.
 */

export interface OHLCVCandle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type AssetId = "BTC/USDT" | "ETH/USDT" | "SPY" | "AAPL" | "EUR/USD";

interface AssetConfig {
  startPrice: number;
  dailyVolatility: number;
  drift: number;
  baseSeed: number;
  decimals: number;
}

const ASSET_CONFIGS: Record<AssetId, AssetConfig> = {
  "BTC/USDT": {
    startPrice: 42000,
    dailyVolatility: 0.025,
    drift: 0.0008,
    baseSeed: 314159,
    decimals: 2,
  },
  "ETH/USDT": {
    startPrice: 2200,
    dailyVolatility: 0.03,
    drift: 0.0005,
    baseSeed: 271828,
    decimals: 2,
  },
  SPY: {
    startPrice: 450,
    dailyVolatility: 0.008,
    drift: 0.0003,
    baseSeed: 161803,
    decimals: 2,
  },
  AAPL: {
    startPrice: 175,
    dailyVolatility: 0.012,
    drift: 0.0002,
    baseSeed: 141421,
    decimals: 2,
  },
  "EUR/USD": {
    startPrice: 1.08,
    dailyVolatility: 0.003,
    drift: 0.00005,
    baseSeed: 173205,
    decimals: 5,
  },
};

/**
 * Deterministic PRNG (mulberry32).
 * Same seed always produces the same sequence.
 */
function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash a string into a numeric seed.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Map a timeframe string to seconds-per-candle.
 */
function timeframeToSeconds(tf: string): number {
  const map: Record<string, number> = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "1D": 86400,
    "1W": 604800,
  };
  return map[tf] ?? 86400;
}

export interface GenerateOHLCVOptions {
  asset: AssetId;
  count?: number;
  timeframe?: string;
  /** Extra seed component for deterministic variation (e.g. strategy name) */
  seedExtra?: string;
}

/**
 * Generate deterministic OHLCV candles for the given asset.
 *
 * @returns Array of `count` candles with realistic price action.
 */
export function generateOHLCV({
  asset,
  count = 500,
  timeframe = "1D",
  seedExtra = "",
}: GenerateOHLCVOptions): OHLCVCandle[] {
  const cfg = ASSET_CONFIGS[asset];
  if (!cfg) {
    throw new Error(`Unknown asset: ${asset}`);
  }

  const extraHash = seedExtra ? hashString(seedExtra) : 0;
  const rng = createRng(cfg.baseSeed + extraHash);

  const intervalSec = timeframeToSeconds(timeframe);

  // Scale volatility relative to daily. A 4h candle has ~1/6 of a day.
  const candlesPerDay = 86400 / intervalSec;
  const candleVol = cfg.dailyVolatility / Math.sqrt(candlesPerDay);
  const candleDrift = cfg.drift / candlesPerDay;

  const candles: OHLCVCandle[] = [];
  let price = cfg.startPrice;

  // Start from 2024-01-01 00:00 UTC
  const startTime = Math.floor(new Date("2024-01-01T00:00:00Z").getTime() / 1000);

  for (let i = 0; i < count; i++) {
    // Box-Muller for normally distributed returns
    const u1 = rng();
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) * Math.cos(2 * Math.PI * u2);
    const returnPct = candleDrift + candleVol * z;

    const open = price;
    const close = open * (1 + returnPct);

    // Intracandle wicks
    const wickFactor = candleVol * 0.5;
    const highExtra = Math.abs(rng()) * wickFactor * open;
    const lowExtra = Math.abs(rng()) * wickFactor * open;
    const high = Math.max(open, close) + highExtra;
    const low = Math.min(open, close) - lowExtra;

    // Volume: base volume with random variation
    const baseVolume = asset.includes("BTC")
      ? 2_000_000
      : asset.includes("ETH")
        ? 1_500_000
        : asset.includes("EUR")
          ? 800_000
          : 3_000_000;
    const volume = Math.floor(baseVolume * (0.5 + rng() * 1.5));

    candles.push({
      time: startTime + i * intervalSec,
      open: Number(open.toFixed(cfg.decimals)),
      high: Number(high.toFixed(cfg.decimals)),
      low: Number(low.toFixed(cfg.decimals)),
      close: Number(close.toFixed(cfg.decimals)),
      volume,
    });

    price = close;
  }

  return candles;
}
