import type { ElevationStats, TrackPoint } from '../domain/trackPoint';

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateDistanceMeters(pointA: TrackPoint, pointB: TrackPoint): number {
  const lat1 = toRadians(pointA.lat);
  const lat2 = toRadians(pointB.lat);
  const deltaLat = toRadians(pointB.lat - pointA.lat);
  const deltaLon = toRadians(pointB.lon - pointA.lon);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

export function calculateDistances(points: TrackPoint[]): TrackPoint[] {
  if (points.length === 0) {
    return [];
  }

  let accumulatedDistance = 0;

  return points.map((point, index) => {
    if (index > 0) {
      accumulatedDistance += calculateDistanceMeters(points[index - 1], point);
    }

    return {
      ...point,
      distanceFromStart: accumulatedDistance,
    };
  });
}

export function calculateElevationStats(points: TrackPoint[]): ElevationStats {
  return points.reduce<ElevationStats>(
    (stats, currentPoint, index) => {
      if (index === 0) {
        return stats;
      }

      const previousPoint = points[index - 1];
      if (previousPoint.ele === undefined || currentPoint.ele === undefined) {
        return stats;
      }

      const delta = currentPoint.ele - previousPoint.ele;
      if (delta > 0) {
        stats.positive += delta;
      } else if (delta < 0) {
        stats.negative += Math.abs(delta);
      }

      return stats;
    },
    { positive: 0, negative: 0 },
  );
}

export function calculateDurationSeconds(points: TrackPoint[]): number | undefined {
  if (points.length < 2) return undefined;

  const first = points[0];
  const last = points[points.length - 1];

  if (!first.time || !last.time) return undefined;

  const startMs = Date.parse(first.time);
  const endMs = Date.parse(last.time);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return undefined;

  return Math.max(0, (endMs - startMs) / 1000);
}

export function calculateAverageHeartRate(points: TrackPoint[]): number | undefined {
  const withHr = points.filter((point) => typeof point.hr === 'number');
  if (withHr.length === 0) return undefined;

  const sum = withHr.reduce((total, point) => total + (point.hr ?? 0), 0);
  return sum / withHr.length;
}

export function calculateMaxHeartRate(points: TrackPoint[]): number | undefined {
  const withHr = points.filter((point) => typeof point.hr === 'number');
  if (withHr.length === 0) return undefined;

  return Math.max(...withHr.map((point) => point.hr ?? 0));
}
