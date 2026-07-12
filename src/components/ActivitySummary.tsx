import type { TrackPoint } from '../domain/trackPoint';
import type { ElevationStats } from '../domain/trackPoint';
import {
  calculateAverageHeartRate,
  calculateDurationSeconds,
  calculateMaxHeartRate,
} from '../services/distanceCalculator';
import { formatDistanceMeters, formatDuration, formatElevation, formatHeartRate, formatPace } from '../services/formatters';

interface ActivitySummaryProps {
  fileName?: string;
  points: TrackPoint[];
  elevationStats: ElevationStats;
}

export function ActivitySummary({ fileName, points, elevationStats }: ActivitySummaryProps) {
  if (points.length === 0) {
    return (
      <section className="card">
        <p className="eyebrow">Resumen</p>
        <h2>Resumen de la actividad</h2>
        <p className="muted">Carga un archivo para ver el resumen.</p>
      </section>
    );
  }

  const totalMeters = points[points.length - 1].distanceFromStart;
  const durationSeconds = calculateDurationSeconds(points);
  const distanceKm = totalMeters / 1000;
  const avgPaceSecPerKm = durationSeconds !== undefined && distanceKm > 0 ? durationSeconds / distanceKm : undefined;
  const avgHr = calculateAverageHeartRate(points);
  const maxHr = calculateMaxHeartRate(points);

  return (
    <section className="card">
      <p className="eyebrow">Resumen</p>
      <h2>Resumen de la actividad</h2>
      <div className="summary-grid">
        <div>
          <span>Archivo</span>
          <strong title={fileName}>{fileName ?? '—'}</strong>
        </div>
        <div>
          <span>Distancia total</span>
          <strong>{formatDistanceMeters(totalMeters)}</strong>
        </div>
        <div>
          <span>Duración</span>
          <strong>{durationSeconds !== undefined ? formatDuration(durationSeconds) : '—'}</strong>
        </div>
        <div>
          <span>Ritmo medio</span>
          <strong>{avgPaceSecPerKm !== undefined ? formatPace(avgPaceSecPerKm) : '—'}</strong>
        </div>
        <div>
          <span>Desnivel +</span>
          <strong>{formatElevation(elevationStats.positive)}</strong>
        </div>
        <div>
          <span>Desnivel −</span>
          <strong>{formatElevation(elevationStats.negative)}</strong>
        </div>
        {avgHr !== undefined && (
          <div>
            <span>Pulso medio</span>
            <strong>{formatHeartRate(avgHr)}</strong>
          </div>
        )}
        {maxHr !== undefined && (
          <div>
            <span>Pulso máximo</span>
            <strong>{formatHeartRate(maxHr)}</strong>
          </div>
        )}
      </div>
    </section>
  );
}
