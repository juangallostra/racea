import { Fragment, useEffect, useRef } from 'react';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LeafletMouseEvent } from 'leaflet';
import type { Segment } from '../domain/selection';
import type { TrackPoint } from '../domain/trackPoint';
import { segmentColor } from '../services/segmentColors';
import { getClosestPoint, getPointAtDistance, getRangePoints } from '../services/trackUtils';

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [32, 32] });
    }
  }, [map, positions]);

  return null;
}

interface MapPreviewProps {
  points: TrackPoint[];
  segments: Segment[];
  pendingAKm?: number;
  hoveredKm?: number | null;
  onHoverKm?: (km: number | null) => void;
  onClickKm?: (km: number) => void;
}

function positionsFromPoints(points: TrackPoint[]): [number, number][] {
  return points.map((point) => [point.lat, point.lon] as [number, number]);
}

export function MapPreview({ points, segments, pendingAKm, hoveredKm, onHoverKm, onClickKm }: MapPreviewProps) {
  const animationFrameRef = useRef<number | null>(null);

  if (points.length === 0) {
    return (
      <section className="card map-card empty-map">
        <p className="eyebrow">Mapa</p>
        <h2>Mapa</h2>
        <p className="muted">Carga una actividad para visualizar el recorrido.</p>
      </section>
    );
  }

  const positions = positionsFromPoints(points);
  const center = positions[Math.floor(positions.length / 2)];
  const pendingPoint = pendingAKm !== undefined ? getPointAtDistance(points, pendingAKm * 1000) : undefined;
  const hoveredPoint =
    hoveredKm !== null && hoveredKm !== undefined ? getPointAtDistance(points, hoveredKm * 1000) : undefined;

  function updateHoverFromEvent(event: LeafletMouseEvent) {
    if (!onHoverKm) return;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const closest = getClosestPoint(points, { lat: event.latlng.lat, lon: event.latlng.lng });
      onHoverKm(closest ? closest.distanceFromStart / 1000 : null);
    });
  }

  function handleTrackClick(event: LeafletMouseEvent) {
    const closest = getClosestPoint(points, { lat: event.latlng.lat, lon: event.latlng.lng });
    if (closest) {
      onClickKm?.(closest.distanceFromStart / 1000);
    }
  }

  return (
    <section className="card map-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Mapa</p>
          <h2>Mapa</h2>
          <p className="muted">
            Haz clic para marcar el punto A y luego el punto B de un tramo. Repite para añadir más tramos.
          </p>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={positions} />
          <Polyline
            positions={positions}
            pathOptions={{ weight: 4, color: '#334155' }}
            eventHandlers={{
              mousemove: updateHoverFromEvent,
              mouseout: () => onHoverKm?.(null),
              click: handleTrackClick,
            }}
          />

          {segments.map((segment, index) => {
            const rangePositions = positionsFromPoints(getRangePoints(points, segment.aKm, segment.bKm));
            const color = segmentColor(index);
            const startPoint = getPointAtDistance(points, segment.aKm * 1000);
            const endPoint = getPointAtDistance(points, segment.bKm * 1000);

            return (
              <Fragment key={segment.id}>
                <Polyline positions={rangePositions} pathOptions={{ weight: 7, color }} />
                <CircleMarker center={[startPoint.lat, startPoint.lon]} radius={8} pathOptions={{ weight: 3, color, fillOpacity: 0.9 }} />
                <CircleMarker center={[endPoint.lat, endPoint.lon]} radius={8} pathOptions={{ weight: 3, color, fillOpacity: 0.9 }} />
              </Fragment>
            );
          })}

          {pendingPoint && (
            <CircleMarker
              center={[pendingPoint.lat, pendingPoint.lon]}
              radius={8}
              pathOptions={{ weight: 3, color: '#111827', dashArray: '4 3', fillOpacity: 0.4 }}
            />
          )}

          {hoveredPoint && (
            <CircleMarker
              center={[hoveredPoint.lat, hoveredPoint.lon]}
              radius={6}
              pathOptions={{ weight: 2, color: '#111827', fillColor: '#ffffff', fillOpacity: 1 }}
            />
          )}
        </MapContainer>
      </div>
    </section>
  );
}
