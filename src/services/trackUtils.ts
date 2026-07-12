import type { TrackPoint } from '../domain/trackPoint';

function clonePointWithDistance(point: TrackPoint, distanceFromStart: number): TrackPoint {
  return {
    ...point,
    distanceFromStart,
  };
}

function interpolateIsoTime(timeA: string, timeB: string, ratio: number): string | undefined {
  const timestampA = Date.parse(timeA);
  const timestampB = Date.parse(timeB);

  if (!Number.isFinite(timestampA) || !Number.isFinite(timestampB)) {
    return undefined;
  }

  const interpolatedTimestamp = timestampA + (timestampB - timestampA) * ratio;
  return new Date(interpolatedTimestamp).toISOString();
}

export class TrackUtilsError extends Error {}

export function interpolatePoint(pointA: TrackPoint, pointB: TrackPoint, targetDistance: number): TrackPoint {
  const segmentDistance = pointB.distanceFromStart - pointA.distanceFromStart;

  if (segmentDistance <= 0) {
    return clonePointWithDistance(pointA, targetDistance);
  }

  const ratio = (targetDistance - pointA.distanceFromStart) / segmentDistance;
  const hasElevation = pointA.ele !== undefined && pointB.ele !== undefined;
  const hasTime = pointA.time !== undefined && pointB.time !== undefined;
  const hasHr = pointA.hr !== undefined && pointB.hr !== undefined;

  return {
    lat: pointA.lat + (pointB.lat - pointA.lat) * ratio,
    lon: pointA.lon + (pointB.lon - pointA.lon) * ratio,
    ele: hasElevation ? pointA.ele! + (pointB.ele! - pointA.ele!) * ratio : undefined,
    time: hasTime ? interpolateIsoTime(pointA.time!, pointB.time!, ratio) : undefined,
    hr: hasHr ? pointA.hr! + (pointB.hr! - pointA.hr!) * ratio : undefined,
    distanceFromStart: targetDistance,
  };
}

export function getPointAtDistance(points: TrackPoint[], targetDistance: number): TrackPoint {
  if (points.length === 0) {
    throw new TrackUtilsError('No hay puntos de track para interpolar.');
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  if (targetDistance <= firstPoint.distanceFromStart) {
    return clonePointWithDistance(firstPoint, targetDistance);
  }

  if (targetDistance >= lastPoint.distanceFromStart) {
    return clonePointWithDistance(lastPoint, targetDistance);
  }

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1];
    const currentPoint = points[index];

    if (Math.abs(previousPoint.distanceFromStart - targetDistance) < 0.0001) {
      return clonePointWithDistance(previousPoint, targetDistance);
    }

    if (Math.abs(currentPoint.distanceFromStart - targetDistance) < 0.0001) {
      return clonePointWithDistance(currentPoint, targetDistance);
    }

    if (previousPoint.distanceFromStart < targetDistance && currentPoint.distanceFromStart > targetDistance) {
      return interpolatePoint(previousPoint, currentPoint, targetDistance);
    }
  }

  return clonePointWithDistance(lastPoint, targetDistance);
}

export function getClosestPoint(points: TrackPoint[], target: { lat: number; lon: number }): TrackPoint | undefined {
  if (points.length === 0) return undefined;

  let best = points[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const point of points) {
    const latDelta = point.lat - target.lat;
    const lonDelta = point.lon - target.lon;
    const score = latDelta * latDelta + lonDelta * lonDelta;

    if (score < bestScore) {
      bestScore = score;
      best = point;
    }
  }

  return best;
}

/** Extrae los puntos del track entre dos kilómetros, incluyendo los extremos interpolados. */
export function getRangePoints(points: TrackPoint[], startKm: number, endKm: number): TrackPoint[] {
  if (points.length < 2) {
    throw new TrackUtilsError('El track necesita al menos dos puntos.');
  }

  const startMeters = Math.min(startKm, endKm) * 1000;
  const endMeters = Math.max(startKm, endKm) * 1000;

  const startPoint = getPointAtDistance(points, startMeters);
  const endPoint = getPointAtDistance(points, endMeters);
  const innerPoints = points.filter(
    (point) => point.distanceFromStart > startMeters && point.distanceFromStart < endMeters,
  );

  return [startPoint, ...innerPoints, endPoint];
}
