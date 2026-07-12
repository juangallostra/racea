import type { TrackPoint } from '../domain/trackPoint';
import type { SegmentStats } from '../domain/selection';
import {
  calculateAverageHeartRate,
  calculateDurationSeconds,
  calculateElevationStats,
  calculateMaxHeartRate,
} from './distanceCalculator';
import { getRangePoints } from './trackUtils';

export function computeSegmentStats(points: TrackPoint[], startKm: number, endKm: number): SegmentStats {
  const rangePoints = getRangePoints(points, startKm, endKm);
  const distanceMeters = rangePoints[rangePoints.length - 1].distanceFromStart - rangePoints[0].distanceFromStart;
  const elevationStats = calculateElevationStats(rangePoints);
  const durationSeconds = calculateDurationSeconds(rangePoints);

  const distanceKm = distanceMeters / 1000;
  const avgPaceSecPerKm =
    durationSeconds !== undefined && distanceKm > 0 ? durationSeconds / distanceKm : undefined;
  const avgSpeedKmh =
    durationSeconds !== undefined && durationSeconds > 0 ? distanceKm / (durationSeconds / 3600) : undefined;

  const elevations = rangePoints.map((point) => point.ele).filter((ele): ele is number => ele !== undefined);

  return {
    distanceMeters,
    elevationGainMeters: elevationStats.positive,
    elevationLossMeters: elevationStats.negative,
    durationSeconds,
    avgPaceSecPerKm,
    avgSpeedKmh,
    avgHeartRate: calculateAverageHeartRate(rangePoints),
    maxHeartRate: calculateMaxHeartRate(rangePoints),
    minElevation: elevations.length > 0 ? Math.min(...elevations) : undefined,
    maxElevation: elevations.length > 0 ? Math.max(...elevations) : undefined,
  };
}
