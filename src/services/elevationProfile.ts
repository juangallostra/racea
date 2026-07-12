import type { TrackPoint } from '../domain/trackPoint';

export interface ElevationProfilePoint {
  km: number;
  ele: number;
  hr?: number;
  cadence?: number;
  power?: number;
  paceSecPerKm?: number;
  lat: number;
  lon: number;
}

const PACE_WINDOW_METERS = 150;

function findIndexAtOrAfter(points: TrackPoint[], distance: number): number {
  let lo = 0;
  let hi = points.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].distanceFromStart < distance) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return lo;
}

/** Ritmo local (seg/km) alrededor de una distancia dada, suavizado con una ventana. */
export function computeLocalPaceSecPerKm(
  points: TrackPoint[],
  centerDistanceMeters: number,
  windowMeters = PACE_WINDOW_METERS,
): number | undefined {
  if (points.length < 2) return undefined;

  const halfWindow = windowMeters / 2;
  const fromIndex = findIndexAtOrAfter(points, centerDistanceMeters - halfWindow);
  const toIndex = Math.min(points.length - 1, findIndexAtOrAfter(points, centerDistanceMeters + halfWindow));
  const startPoint = points[fromIndex];
  const endPoint = points[toIndex];

  if (!startPoint.time || !endPoint.time) return undefined;

  const distanceMeters = endPoint.distanceFromStart - startPoint.distanceFromStart;
  if (distanceMeters < 10) return undefined;

  const durationSeconds = (Date.parse(endPoint.time) - Date.parse(startPoint.time)) / 1000;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return undefined;

  return durationSeconds / (distanceMeters / 1000);
}

export function buildElevationProfile(points: TrackPoint[], maxPoints = 500): ElevationProfilePoint[] {
  const withElevation = points.filter((point) => point.ele !== undefined);

  if (withElevation.length < 2) {
    return [];
  }

  const step = Math.max(1, Math.ceil(withElevation.length / maxPoints));
  const sampled = withElevation.filter((_, index) => index % step === 0);
  const last = withElevation[withElevation.length - 1];

  if (sampled[sampled.length - 1] !== last) {
    sampled.push(last);
  }

  return sampled.map((point) => ({
    km: point.distanceFromStart / 1000,
    ele: point.ele!,
    hr: point.hr,
    cadence: point.cadence,
    power: point.power,
    paceSecPerKm: computeLocalPaceSecPerKm(points, point.distanceFromStart),
    lat: point.lat,
    lon: point.lon,
  }));
}

export function findProfilePointByKm(points: TrackPoint[], km: number): TrackPoint | undefined {
  const targetMeters = km * 1000;
  let closest = points[0];
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const point of points) {
    const delta = Math.abs(point.distanceFromStart - targetMeters);
    if (delta < closestDistance) {
      closest = point;
      closestDistance = delta;
    }
  }

  return closest;
}

export function hasEnoughElevationData(points: TrackPoint[]): boolean {
  return points.filter((point) => point.ele !== undefined).length >= 2;
}

export function hasHeartRateData(points: TrackPoint[]): boolean {
  return points.some((point) => point.hr !== undefined);
}

export function hasCadenceData(points: TrackPoint[]): boolean {
  return points.some((point) => point.cadence !== undefined);
}

export function hasPowerData(points: TrackPoint[]): boolean {
  return points.some((point) => point.power !== undefined);
}

export function hasPaceData(points: TrackPoint[]): boolean {
  return points.filter((point) => point.time !== undefined).length >= 2;
}
