import { useState, type FormEvent } from 'react';
import type { Segment, SegmentStats } from '../domain/selection';
import {
  formatDistanceMeters,
  formatDuration,
  formatElevation,
  formatHeartRate,
  formatKm,
  formatPace,
  formatSpeed,
} from '../services/formatters';
import { segmentColor } from '../services/segmentColors';

export interface SegmentWithStats {
  segment: Segment;
  stats: SegmentStats;
}

interface SegmentsPanelProps {
  items: SegmentWithStats[];
  totalKm: number;
  pendingAKm?: number;
  onAddManual: (aKm: number, bKm: number) => void;
  onRemove: (id: string) => void;
  onCancelPending: () => void;
}

function parseKmInput(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function SegmentsPanel({ items, totalKm, pendingAKm, onAddManual, onRemove, onCancelPending }: SegmentsPanelProps) {
  const [manualA, setManualA] = useState('');
  const [manualB, setManualB] = useState('');
  const [formError, setFormError] = useState<string | undefined>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const a = parseKmInput(manualA);
    const b = parseKmInput(manualB);

    if (a === undefined || b === undefined) {
      setFormError('Introduce un kilometraje válido para A y B.');
      return;
    }

    if (a < 0 || b < 0 || a > totalKm || b > totalKm) {
      setFormError(`El kilometraje debe estar entre 0 y ${formatKm(totalKm)}.`);
      return;
    }

    if (Math.abs(a - b) < 0.001) {
      setFormError('Los puntos A y B deben ser distintos.');
      return;
    }

    onAddManual(a, b);
    setManualA('');
    setManualB('');
    setFormError(undefined);
  }

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Paso 2</p>
          <h2>Tramos</h2>
          <p className="muted">
            Marca los puntos A y B en el mapa o el perfil, o añade un tramo introduciendo el kilometraje.
          </p>
        </div>
      </div>

      {pendingAKm !== undefined && (
        <div className="pending-banner">
          Punto A marcado en km {formatKm(pendingAKm)}. Haz clic en el mapa o el perfil para fijar el punto B.
          <button type="button" className="button-link" onClick={onCancelPending}>
            Cancelar
          </button>
        </div>
      )}

      <form className="split-config-grid" onSubmit={handleSubmit}>
        <label className="inline-label">
          Punto A (km)
          <input
            type="number"
            min={0}
            max={totalKm}
            step={0.01}
            value={manualA}
            onChange={(event) => setManualA(event.target.value)}
            placeholder="0.00"
          />
        </label>
        <label className="inline-label">
          Punto B (km)
          <input
            type="number"
            min={0}
            max={totalKm}
            step={0.01}
            value={manualB}
            onChange={(event) => setManualB(event.target.value)}
            placeholder="0.00"
          />
        </label>
        <button type="submit" disabled={totalKm === 0}>
          Añadir tramo
        </button>
      </form>

      {formError && <p className="inline-error">{formError}</p>}

      {items.length === 0 && <p className="muted small-text">Aún no has añadido ningún tramo.</p>}

      {items.length > 0 && (
        <ul className="segment-list">
          {items.map(({ segment, stats }, index) => (
            <li key={segment.id} className="segment-row">
              <div className="segment-row__header">
                <span className="segment-swatch" style={{ background: segmentColor(index) }} />
                <div className="segment-row__main">
                  <strong>Tramo {index + 1}</strong>
                  <span>
                    Km {formatKm(Math.min(segment.aKm, segment.bKm))} → {formatKm(Math.max(segment.aKm, segment.bKm))}
                  </span>
                </div>
                <button type="button" className="button-secondary" onClick={() => onRemove(segment.id)}>
                  Eliminar
                </button>
              </div>

              <div className="summary-grid">
                <div>
                  <span>Distancia</span>
                  <strong>{formatDistanceMeters(stats.distanceMeters)}</strong>
                </div>
                <div>
                  <span>Desnivel +</span>
                  <strong>{formatElevation(stats.elevationGainMeters)}</strong>
                </div>
                <div>
                  <span>Desnivel −</span>
                  <strong>{formatElevation(stats.elevationLossMeters)}</strong>
                </div>
                <div>
                  <span>Duración</span>
                  <strong>{stats.durationSeconds !== undefined ? formatDuration(stats.durationSeconds) : '—'}</strong>
                </div>
                <div>
                  <span>Ritmo medio</span>
                  <strong>{stats.avgPaceSecPerKm !== undefined ? formatPace(stats.avgPaceSecPerKm) : '—'}</strong>
                </div>
                <div>
                  <span>Velocidad media</span>
                  <strong>{stats.avgSpeedKmh !== undefined ? formatSpeed(stats.avgSpeedKmh) : '—'}</strong>
                </div>
                {stats.avgHeartRate !== undefined && (
                  <div>
                    <span>Pulso medio</span>
                    <strong>{formatHeartRate(stats.avgHeartRate)}</strong>
                  </div>
                )}
                {stats.maxHeartRate !== undefined && (
                  <div>
                    <span>Pulso máximo</span>
                    <strong>{formatHeartRate(stats.maxHeartRate)}</strong>
                  </div>
                )}
                {stats.minElevation !== undefined && stats.maxElevation !== undefined && (
                  <div>
                    <span>Elevación (min–max)</span>
                    <strong>
                      {formatElevation(stats.minElevation)} – {formatElevation(stats.maxElevation)}
                    </strong>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
