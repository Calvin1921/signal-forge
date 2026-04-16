/**
 * SignalForge Indicator Library
 *
 * Pure computation functions for technical indicators.
 * All functions take price arrays and return arrays of the same length,
 * with null for indices where insufficient data exists.
 */

import type { OHLCVCandle } from "./generate-ohlcv";

// Re-export OHLCVCandle so consumers can import from one place if needed
export type { OHLCVCandle };

export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

export interface BollingerResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function computeSMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += closes[j];
    }
    result.push(sum / period);
  }
  return result;
}

export function computeEMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (i === period - 1) {
      // Seed EMA with SMA
      let sum = 0;
      for (let j = 0; j < period; j++) sum += closes[j];
      result.push(sum / period);
      continue;
    }
    const prev = result[i - 1];
    if (prev === null) {
      result.push(null);
      continue;
    }
    result.push(closes[i] * k + prev * (1 - k));
  }
  return result;
}

export function computeRSI(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];

  if (closes.length < period + 1) {
    return closes.map(() => null);
  }

  // Calculate initial average gain/loss
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  // Pad initial values
  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  // First RSI value
  const rs = avgLoss > 0 ? avgGain / avgLoss : 100;
  result.push(100 - 100 / (1 + rs));

  // Subsequent values using smoothed averages
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rsi = avgLoss > 0 ? 100 - 100 / (1 + avgGain / avgLoss) : 100;
    result.push(rsi);
  }

  return result;
}

export function computeMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const emaFast = computeEMA(closes, fastPeriod);
  const emaSlow = computeEMA(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (emaFast[i] !== null && emaSlow[i] !== null) {
      macdLine.push(emaFast[i]! - emaSlow[i]!);
    } else {
      macdLine.push(null);
    }
  }

  // Signal line is EMA of MACD values
  const validMacd = macdLine.filter((v): v is number => v !== null);
  const signalEma = computeEMA(validMacd, signalPeriod);

  // Map signal back to full-length array
  const signal: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  let validIdx = 0;

  for (let i = 0; i < closes.length; i++) {
    if (macdLine[i] === null) {
      signal.push(null);
      histogram.push(null);
    } else {
      if (validIdx < signalEma.length && signalEma[validIdx] !== null) {
        signal.push(signalEma[validIdx]);
        histogram.push(macdLine[i]! - signalEma[validIdx]!);
      } else {
        signal.push(null);
        histogram.push(null);
      }
      validIdx++;
    }
  }

  return { macd: macdLine, signal, histogram };
}

export function computeBollingerBands(
  closes: number[],
  period: number = 20,
  multiplier: number = 2
): BollingerResult {
  const sma = computeSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (sma[i] === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }

    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (closes[j] - sma[i]!) ** 2;
    }
    const stdDev = Math.sqrt(sumSq / period);
    upper.push(sma[i]! + multiplier * stdDev);
    lower.push(sma[i]! - multiplier * stdDev);
  }

  return { upper, middle: sma, lower };
}

// ── New Indicators ──

export function computeATR(candles: OHLCVCandle[], period: number): (number | null)[] {
  const result: (number | null)[] = [null]; // First candle has no TR
  // True Range for each candle
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    result.push(tr);
  }
  // Convert TR array to ATR using Wilder's smoothing
  const atr: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      atr.push(null);
      continue;
    }
    if (i === period) {
      // First ATR is simple average of first `period` TRs
      let sum = 0;
      for (let j = 1; j <= period; j++) sum += result[j] as number;
      atr.push(sum / period);
      continue;
    }
    const prev = atr[i - 1];
    if (prev === null) { atr.push(null); continue; }
    atr.push((prev * (period - 1) + (result[i] as number)) / period);
  }
  return atr;
}

export interface StochasticResult {
  k: (number | null)[];
  d: (number | null)[];
}

export function computeStochastic(
  candles: OHLCVCandle[],
  kPeriod: number,
  dPeriod: number,
  smooth: number,
): StochasticResult {
  const rawK: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) { rawK.push(null); continue; }
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (candles[j].high > highestHigh) highestHigh = candles[j].high;
      if (candles[j].low < lowestLow) lowestLow = candles[j].low;
    }
    const range = highestHigh - lowestLow;
    rawK.push(range > 0 ? ((candles[i].close - lowestLow) / range) * 100 : 50);
  }
  // Smooth %K with SMA
  const k = computeSMA(
    rawK.map((v) => v ?? 0),
    smooth,
  ).map((v, i) => (rawK[i] === null ? null : v));
  // %D is SMA of %K
  const d = computeSMA(
    k.map((v) => v ?? 0),
    dPeriod,
  ).map((v, i) => (k[i] === null ? null : v));
  return { k, d };
}

export function computeADX(candles: OHLCVCandle[], period: number): (number | null)[] {
  if (candles.length < 2) return candles.map(() => null);
  // +DM, -DM
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  // Wilder's smoothing for +DM, -DM, TR
  function wilderSmooth(arr: number[], p: number): number[] {
    const out: number[] = [];
    for (let i = 0; i < arr.length; i++) {
      if (i < p) { out.push(0); continue; }
      if (i === p) {
        let s = 0; for (let j = 1; j <= p; j++) s += arr[j]; out.push(s); continue;
      }
      out.push(out[i - 1] - out[i - 1] / p + arr[i]);
    }
    return out;
  }
  const smoothTR = wilderSmooth(tr, period);
  const smoothPlusDM = wilderSmooth(plusDM, period);
  const smoothMinusDM = wilderSmooth(minusDM, period);
  // +DI, -DI
  const plusDI: number[] = [];
  const minusDI: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (smoothTR[i] === 0) { plusDI.push(0); minusDI.push(0); continue; }
    plusDI.push((smoothPlusDM[i] / smoothTR[i]) * 100);
    minusDI.push((smoothMinusDM[i] / smoothTR[i]) * 100);
  }
  // DX
  const dx: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const sum = plusDI[i] + minusDI[i];
    dx.push(sum > 0 ? (Math.abs(plusDI[i] - minusDI[i]) / sum) * 100 : 0);
  }
  // ADX = Wilder's smoothed DX
  const result: (number | null)[] = [];
  const adxStart = period * 2;
  for (let i = 0; i < candles.length; i++) {
    if (i < adxStart) { result.push(null); continue; }
    if (i === adxStart) {
      let s = 0; for (let j = period; j <= adxStart; j++) s += dx[j]; result.push(s / (period + 1)); continue;
    }
    const prev = result[i - 1];
    if (prev === null) { result.push(null); continue; }
    result.push((prev * (period - 1) + dx[i]) / period);
  }
  return result;
}

export function computeROC(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) { result.push(null); continue; }
    result.push(((closes[i] - closes[i - period]) / closes[i - period]) * 100);
  }
  return result;
}

export function computeVWAP(candles: OHLCVCandle[]): (number | null)[] {
  const result: (number | null)[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  for (let i = 0; i < candles.length; i++) {
    const tp = (candles[i].high + candles[i].low + candles[i].close) / 3;
    cumulativeTPV += tp * candles[i].volume;
    cumulativeVolume += candles[i].volume;
    result.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null);
  }
  return result;
}

export interface DonchianResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function computeDonchian(candles: OHLCVCandle[], period: number): DonchianResult {
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) { upper.push(null); middle.push(null); lower.push(null); continue; }
    let hh = -Infinity, ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > hh) hh = candles[j].high;
      if (candles[j].low < ll) ll = candles[j].low;
    }
    upper.push(hh);
    lower.push(ll);
    middle.push((hh + ll) / 2);
  }
  return { upper, middle, lower };
}

export function computeBBBandwidth(closes: number[], period: number, stdDev: number): (number | null)[] {
  const bb = computeBollingerBands(closes, period, stdDev);
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (bb.upper[i] === null || bb.lower[i] === null || bb.middle[i] === null || bb.middle[i] === 0) {
      result.push(null); continue;
    }
    result.push((bb.upper[i]! - bb.lower[i]!) / bb.middle[i]!);
  }
  return result;
}

export interface PivotPointsResult {
  pp: (number | null)[];
  s1: (number | null)[];
  r1: (number | null)[];
  s2: (number | null)[];
  r2: (number | null)[];
}

export function computePivotPoints(candles: OHLCVCandle[], type: string): PivotPointsResult {
  const pp: (number | null)[] = [null];
  const s1: (number | null)[] = [null];
  const r1: (number | null)[] = [null];
  const s2: (number | null)[] = [null];
  const r2: (number | null)[] = [null];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const pivot = (prev.high + prev.low + prev.close) / 3;
    pp.push(pivot);
    if (type === "Fibonacci") {
      const range = prev.high - prev.low;
      r1.push(pivot + 0.382 * range);
      s1.push(pivot - 0.382 * range);
      r2.push(pivot + 0.618 * range);
      s2.push(pivot - 0.618 * range);
    } else {
      // Standard
      r1.push(2 * pivot - prev.low);
      s1.push(2 * pivot - prev.high);
      r2.push(pivot + (prev.high - prev.low));
      s2.push(pivot - (prev.high - prev.low));
    }
  }
  return { pp, s1, r1, s2, r2 };
}

export interface SwingHLResult {
  swingHigh: (number | null)[];
  swingLow: (number | null)[];
}

export function computeSwingHL(candles: OHLCVCandle[], lookback: number): SwingHLResult {
  const swingHigh: (number | null)[] = [];
  const swingLow: (number | null)[] = [];
  let lastSwingHigh: number | null = null;
  let lastSwingLow: number | null = null;
  for (let i = 0; i < candles.length; i++) {
    if (i < lookback) {
      swingHigh.push(null);
      swingLow.push(null);
      continue;
    }
    // Check if candle at (i - lookback) is a swing point
    const mid = i - Math.floor(lookback / 2);
    if (mid >= lookback) {
      let isHigh = true, isLow = true;
      for (let j = mid - lookback; j <= mid + lookback && j < candles.length; j++) {
        if (j === mid) continue;
        if (j < 0 || j >= candles.length) continue;
        if (candles[j].high >= candles[mid].high) isHigh = false;
        if (candles[j].low <= candles[mid].low) isLow = false;
      }
      if (isHigh) lastSwingHigh = candles[mid].high;
      if (isLow) lastSwingLow = candles[mid].low;
    }
    swingHigh.push(lastSwingHigh);
    swingLow.push(lastSwingLow);
  }
  return { swingHigh, swingLow };
}

export function detectCandlePattern(candles: OHLCVCandle[], pattern: string): (number | null)[] {
  const result: (number | null)[] = [0]; // First candle can't form a pattern
  for (let i = 1; i < candles.length; i++) {
    const curr = candles[i];
    const prev = candles[i - 1];
    const currBody = Math.abs(curr.close - curr.open);
    const prevBody = Math.abs(prev.close - prev.open);
    const currBullish = curr.close > curr.open;
    const prevBullish = prev.close > prev.open;
    const currRange = curr.high - curr.low;

    let signal = 0;
    switch (pattern) {
      case "bullish_engulfing":
        if (currBullish && !prevBullish && curr.open <= prev.close && curr.close >= prev.open && currBody > prevBody) signal = 1;
        break;
      case "bearish_engulfing":
        if (!currBullish && prevBullish && curr.open >= prev.close && curr.close <= prev.open && currBody > prevBody) signal = -1;
        break;
      case "hammer":
        if (currRange > 0) {
          const lowerWick = Math.min(curr.open, curr.close) - curr.low;
          const upperWick = curr.high - Math.max(curr.open, curr.close);
          if (lowerWick > currBody * 2 && upperWick < currBody * 0.5) signal = 1;
        }
        break;
      case "shooting_star":
        if (currRange > 0) {
          const lowerW = Math.min(curr.open, curr.close) - curr.low;
          const upperW = curr.high - Math.max(curr.open, curr.close);
          if (upperW > currBody * 2 && lowerW < currBody * 0.5) signal = -1;
        }
        break;
      case "doji":
        if (currRange > 0 && currBody / currRange < 0.1) signal = 1;
        break;
      case "morning_star":
        if (i >= 2) {
          const twoPrev = candles[i - 2];
          const twoPrevBullish = twoPrev.close > twoPrev.open;
          const twoPrevBody = Math.abs(twoPrev.close - twoPrev.open);
          if (!twoPrevBullish && twoPrevBody > prevBody * 2 && currBullish && curr.close > (twoPrev.open + twoPrev.close) / 2) signal = 1;
        }
        break;
      case "evening_star":
        if (i >= 2) {
          const twoPrev2 = candles[i - 2];
          const twoPrev2Bullish = twoPrev2.close > twoPrev2.open;
          const twoPrev2Body = Math.abs(twoPrev2.close - twoPrev2.open);
          if (twoPrev2Bullish && twoPrev2Body > prevBody * 2 && !currBullish && curr.close < (twoPrev2.open + twoPrev2.close) / 2) signal = -1;
        }
        break;
    }
    result.push(signal);
  }
  return result;
}
