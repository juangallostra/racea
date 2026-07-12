import { useMemo, useState } from 'react';
import { ActivitySummary } from './components/ActivitySummary';
import { ActivityUploader } from './components/ActivityUploader';
import { ElevationProfile } from './components/ElevationProfile';
import { MapPreview } from './components/MapPreview';
import { SegmentsPanel, type SegmentWithStats } from './components/SegmentsPanel';
import type { ActivitySource } from './domain/activity';
import type { Segment } from './domain/selection';
import type { TrackPoint } from './domain/trackPoint';
import { calculateDistances, calculateElevationStats } from './services/distanceCalculator';
import { hasEnoughElevationData } from './services/elevationProfile';
import { parseFit } from './services/fitParser';
import { parseGpx } from './services/gpxParser';
import { createSegmentId } from './services/idUtils';
import { computeSegmentStats } from './services/segmentAnalyzer';
import './styles.css';

function clampKm(km: number, totalKm: number): number {
  return Math.min(Math.max(km, 0), totalKm);
}

export default function App() {
  const [fileName, setFileName] = useState<string | undefined>();
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [pendingAKm, setPendingAKm] = useState<number | undefined>();
  const [hoveredKm, setHoveredKm] = useState<number | null>(null);

  const totalKm = points.length > 0 ? points[points.length - 1].distanceFromStart / 1000 : 0;
  const elevationStats = useMemo(() => calculateElevationStats(points), [points]);
  const elevationAvailable = useMemo(() => hasEnoughElevationData(points), [points]);

  const segmentsWithStats = useMemo<SegmentWithStats[]>(() => {
    if (points.length < 2) return [];
    return segments.map((segment) => ({
      segment,
      stats: computeSegmentStats(points, segment.aKm, segment.bKm),
    }));
  }, [points, segments]);

  function resetSegments() {
    setSegments([]);
    setPendingAKm(undefined);
  }

  async function handleFileLoaded(nextFileName: string, source: ActivitySource, data: string | ArrayBuffer) {
    try {
      const parsedPoints = source === 'gpx' ? parseGpx(data as string) : parseFit(data as ArrayBuffer);
      const pointsWithDistances = calculateDistances(parsedPoints);

      if (pointsWithDistances.length < 2) {
        throw new Error('El archivo necesita al menos dos puntos de posición para poder analizarse.');
      }

      setFileName(nextFileName);
      setPoints(pointsWithDistances);
      resetSegments();
      setHoveredKm(null);
      setError(undefined);
    } catch (caughtError) {
      setFileName(undefined);
      setPoints([]);
      resetSegments();
      setError(caughtError instanceof Error ? caughtError.message : 'No se ha podido procesar el archivo.');
    }
  }

  function handleClickKm(km: number) {
    if (pendingAKm === undefined) {
      setPendingAKm(km);
      return;
    }

    if (Math.abs(km - pendingAKm) < 0.001) {
      return;
    }

    const newSegment: Segment = {
      id: createSegmentId(),
      aKm: Math.min(pendingAKm, km),
      bKm: Math.max(pendingAKm, km),
    };

    setSegments((current) => [...current, newSegment]);
    setPendingAKm(undefined);
  }

  function handleAddManualSegment(aKm: number, bKm: number) {
    const clampedA = clampKm(aKm, totalKm);
    const clampedB = clampKm(bKm, totalKm);

    if (Math.abs(clampedA - clampedB) < 0.001) return;

    setSegments((current) => [
      ...current,
      { id: createSegmentId(), aKm: Math.min(clampedA, clampedB), bKm: Math.max(clampedA, clampedB) },
    ]);
  }

  function handleRemoveSegment(id: string) {
    setSegments((current) => current.filter((segment) => segment.id !== id));
  }

  function handleCancelPending() {
    setPendingAKm(undefined);
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">MVP · 100% cliente</p>
          <h1>Racea</h1>
          <p>
            Carga un GPX o FIT, marca puntos A y B sobre el mapa o el perfil y analiza el desnivel, ritmo y pulso de
            cada tramo.
          </p>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="layout-grid">
        <div className="left-column">
          <ActivityUploader onFileLoaded={handleFileLoaded} onError={setError} />
          <ActivitySummary fileName={fileName} points={points} elevationStats={elevationStats} />
          <SegmentsPanel
            items={segmentsWithStats}
            totalKm={totalKm}
            pendingAKm={pendingAKm}
            onAddManual={handleAddManualSegment}
            onRemove={handleRemoveSegment}
            onCancelPending={handleCancelPending}
          />
        </div>

        <div className="right-column">
          <MapPreview
            points={points}
            segments={segments}
            pendingAKm={pendingAKm}
            hoveredKm={hoveredKm}
            onHoverKm={setHoveredKm}
            onClickKm={handleClickKm}
          />

          {points.length > 0 && elevationAvailable && (
            <ElevationProfile
              points={points}
              segments={segments}
              pendingAKm={pendingAKm}
              hoveredKm={hoveredKm}
              onHoverKm={setHoveredKm}
              onClickKm={handleClickKm}
            />
          )}

          {points.length > 0 && !elevationAvailable && (
            <section className="card">
              <h2>Perfil de elevación</h2>
              <p className="muted">
                Este archivo no tiene suficientes datos de elevación para mostrar el perfil. Aún puedes seleccionar
                tramos sobre el mapa.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
