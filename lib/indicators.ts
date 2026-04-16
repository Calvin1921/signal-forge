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
