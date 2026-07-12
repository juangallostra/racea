import type { KmSplit } from '../domain/split';
import type { SegmentStats } from '../domain/selection';
import type { TrackPoint } from '../domain/trackPoint';
import { computeSegmentStats } from './segmentAnalyzer';
import { classifyTerrain } from './splitsAnalyzer';

/** Diferencia de ritmo entre mitades, en %, por debajo de la cual se considera un split equilibrado. */
const EVEN_SPLIT_THRESHOLD_PERCENT = 1;

/** Distancia mínima, en km, para que tenga sentido comparar dos mitades. */
const MIN_TOTAL_KM_FOR_HALVES = 0.4;

export type SplitType = 'negative' | 'positive' | 'even';

export interface HalfSplitComparison {
  firstHalf: SegmentStats;
  secondHalf: SegmentStats;
  paceDiffSecPerKm: number;
  paceDiffPercent: number;
  splitType: SplitType;
}

function getTotalKm(points: TrackPoint[]): number {
  return points.length > 0 ? points[points.length - 1].distanceFromStart / 1000 : 0;
}

export function computeHalfSplitComparison(points: TrackPoint[]): HalfSplitComparison | undefined {
  const totalKm = getTotalKm(points);
  if (totalKm < MIN_TOTAL_KM_FOR_HALVES) return undefined;

  const halfKm = totalKm / 2;
  const firstHalf = computeSegmentStats(points, 0, halfKm);
  const secondHalf = computeSegmentStats(points, halfKm, totalKm);

  if (firstHalf.avgPaceSecPerKm === undefined || secondHalf.avgPaceSecPerKm === undefined) {
    return undefined;
  }

  const paceDiffSecPerKm = secondHalf.avgPaceSecPerKm - firstHalf.avgPaceSecPerKm;
  const paceDiffPercent = (paceDiffSecPerKm / firstHalf.avgPaceSecPerKm) * 100;
  const splitType: SplitType =
    Math.abs(paceDiffPercent) < EVEN_SPLIT_THRESHOLD_PERCENT ? 'even' : paceDiffPercent < 0 ? 'negative' : 'positive';

  return { firstHalf, secondHalf, paceDiffSecPerKm, paceDiffPercent, splitType };
}

export interface DecouplingResult {
  decouplingPercent: number;
  firstHalfEfficiency: number;
  secondHalfEfficiency: number;
}

export function computeAerobicDecoupling(points: TrackPoint[]): DecouplingResult | undefined {
  const totalKm = getTotalKm(points);
  if (totalKm < MIN_TOTAL_KM_FOR_HALVES) return undefined;

  const halfKm = totalKm / 2;
  const firstHalf = computeSegmentStats(points, 0, halfKm);
  const secondHalf = computeSegmentStats(points, halfKm, totalKm);

  if (
    !firstHalf.avgSpeedKmh ||
    !firstHalf.avgHeartRate ||
    !secondHalf.avgSpeedKmh ||
    !secondHalf.avgHeartRate
  ) {
    return undefined;
  }

  const firstHalfEfficiency = firstHalf.avgSpeedKmh / firstHalf.avgHeartRate;
  const secondHalfEfficiency = secondHalf.avgSpeedKmh / secondHalf.avgHeartRate;
  const decouplingPercent = ((firstHalfEfficiency - secondHalfEfficiency) / firstHalfEfficiency) * 100;

  return { decouplingPercent, firstHalfEfficiency, secondHalfEfficiency };
}

export interface GradientTimeLoss {
  split: KmSplit;
  extraSeconds: number;
}

export function findGradientTimeLoss(splits: KmSplit[], topN = 3): GradientTimeLoss[] {
  const flatSplits = splits.filter(
    (split) => classifyTerrain(split) === 'flat' && split.stats.avgPaceSecPerKm !== undefined,
  );
  if (flatSplits.length === 0) return [];

  const baselinePaceSecPerKm =
    flatSplits.reduce((sum, split) => sum + split.stats.avgPaceSecPerKm!, 0) / flatSplits.length;

  const climbSplits = splits.filter(
    (split) => classifyTerrain(split) === 'climb' && split.stats.durationSeconds !== undefined,
  );

  return climbSplits
    .map((split) => {
      const distanceKm = split.stats.distanceMeters / 1000;
      const expectedSeconds = baselinePaceSecPerKm * distanceKm;
      const extraSeconds = split.stats.durationSeconds! - expectedSeconds;
      return { split, extraSeconds };
    })
    .filter((result) => result.extraSeconds > 0)
    .sort((a, b) => b.extraSeconds - a.extraSeconds)
    .slice(0, topN);
}
