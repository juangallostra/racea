import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { Segment } from '../domain/selection';
import type { TrackPoint } from '../domain/trackPoint';
import {
  buildElevationProfile,
  hasCadenceData,
  hasHeartRateData,
  hasPaceData,
  hasPowerData,
  type ElevationProfilePoint,
} from '../services/elevationProfile';
import { segmentColor } from '../services/segmentColors';

type MetricKey = 'hr' | 'pace' | 'power' | 'cadence';

interface MetricConfig {
  label: string;
  color: string;
  dataKey: keyof ElevationProfilePoint;
}

const METRIC_CONFIG: Record<MetricKey, MetricConfig> = {
  hr: { label: 'Pulso', color: '#dc2626', dataKey: 'hr' },
  pace: { label: 'Ritmo', color: '#0ea5e9', dataKey: 'paceSecPerKm' },
  power: { label: 'Potencia', color: '#8b5cf6', dataKey: 'power' },
  cadence: { label: 'Cadencia', color: '#14b8a6', dataKey: 'cadence' },
};

const METRIC_AVAILABILITY: Record<MetricKey, (points: TrackPoint[]) => boolean> = {
  hr: hasHeartRateData,
  pace: hasPaceData,
  power: hasPowerData,
  cadence: hasCadenceData,
};

interface ElevationProfileProps {
  points: TrackPoint[];
  segments: Segment[];
  pendingAKm?: number;
  hoveredKm?: number | null;
  height?: number;
  onHoverKm?: (km: number | null) => void;
  onClickKm?: (km: number) => void;
}

function readActiveKm(chartState: unknown): number | null {
  const state = chartState as { activeLabel?: string | number; activePayload?: Array<{ payload?: { km?: number } }> };

  if (state?.activeLabel !== undefined) {
    const value = Number(state.activeLabel);
    return Number.isFinite(value) ? value : null;
  }

  const payloadKm = state?.activePayload?.[0]?.payload?.km;
  return typeof payloadKm === 'number' ? payloadKm : null;
}

function findNearestEle(data: ElevationProfilePoint[], km: number): number | undefined {
  let closest: ElevationProfilePoint | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const point of data) {
    const delta = Math.abs(point.km - km);
    if (delta < bestDelta) {
      bestDelta = delta;
      closest = point;
    }
  }

  return closest?.ele;
}

export function ElevationProfile({
  points,
  segments,
  pendingAKm,
  hoveredKm,
  height = 260,
  onHoverKm,
  onClickKm,
}: ElevationProfileProps) {
  const data = buildElevationProfile(points);

  const availableMetrics = useMemo(
    () => (Object.keys(METRIC_CONFIG) as MetricKey[]).filter((key) => METRIC_AVAILABILITY[key](points)),
    [points],
  );

  const [visibleMetrics, setVisibleMetrics] = useState<Set<MetricKey>>(() => new Set(availableMetrics));

  useEffect(() => {
    setVisibleMetrics(new Set(availableMetrics));
  }, [points]);

  function toggleMetric(key: MetricKey) {
    setVisibleMetrics((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  if (data.length === 0) {
    return (
      <section className="card profile-card">
        <p className="eyebrow">Perfil</p>
        <h2>Perfil de elevación</h2>
        <p className="muted">Esta actividad no tiene suficientes datos de elevación para mostrar un perfil.</p>
      </section>
    );
  }

  const hoveredEle = hoveredKm !== null && hoveredKm !== undefined ? findNearestEle(data, hoveredKm) : undefined;

  return (
    <section className="card profile-card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Perfil</p>
          <h2>Perfil de elevación</h2>
          <p className="muted">Haz clic para marcar el punto A y luego el punto B de un tramo.</p>
        </div>
      </div>

      {availableMetrics.length > 0 && (
        <div className="metric-toggle-row">
          {availableMetrics.map((key) => {
            const config = METRIC_CONFIG[key];
            const active = visibleMetrics.has(key);
            return (
              <button
                key={key}
                type="button"
                className={active ? 'metric-toggle metric-toggle--active' : 'metric-toggle'}
                style={active ? { borderColor: config.color, color: config.color } : undefined}
                onClick={() => toggleMetric(key)}
                aria-pressed={active}
              >
                <i className="legend" style={{ background: config.color, opacity: active ? 1 : 0.35 }} />
                {config.label}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ width: '100%', height }} onMouseLeave={() => onHoverKm?.(null)}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 12, right: 18, left: 0, bottom: 8 }}
            onMouseMove={(state) => onHoverKm?.(readActiveKm(state))}
            onClick={(state) => {
              const km = readActiveKm(state);
              if (km !== null) onClickKm?.(km);
            }}
          >
            <defs>
              <linearGradient id="elevationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
                <stop offset="100%" stopColor="currentColor" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="km" type="number" domain={[data[0].km, data[data.length - 1].km]} tickFormatter={(v) => Number(v).toFixed(1)} unit=" km" />
            <YAxis yAxisId="ele" tickFormatter={(v) => `${Math.round(Number(v))}`} unit=" m" domain={['dataMin - 20', 'dataMax + 20']} />

            {availableMetrics.map((key) => (
              <YAxis key={key} yAxisId={key} domain={['dataMin - 5%', 'dataMax + 5%']} hide />
            ))}

            {segments.map((segment, index) => (
              <ReferenceArea
                key={segment.id}
                yAxisId="ele"
                x1={Math.min(segment.aKm, segment.bKm)}
                x2={Math.max(segment.aKm, segment.bKm)}
                fill={segmentColor(index)}
                fillOpacity={0.22}
                stroke={segmentColor(index)}
                strokeOpacity={0.6}
              />
            ))}

            {pendingAKm !== undefined && (
              <ReferenceLine yAxisId="ele" x={pendingAKm} stroke="#111827" strokeDasharray="4 4" label={{ value: 'A', position: 'top' }} />
            )}

            {hoveredKm !== null && hoveredKm !== undefined && (
              <ReferenceLine yAxisId="ele" x={hoveredKm} stroke="#94a3b8" strokeDasharray="2 3" />
            )}

            <Area
              yAxisId="ele"
              type="monotone"
              dataKey="ele"
              stroke="currentColor"
              fill="url(#elevationFill)"
              strokeWidth={2}
              isAnimationActive={false}
              activeDot={false}
            />

            {availableMetrics.map((key) => {
              if (!visibleMetrics.has(key)) return null;
              const config = METRIC_CONFIG[key];
              return (
                <Line
                  key={key}
                  yAxisId={key}
                  type="monotone"
                  dataKey={config.dataKey}
                  stroke={config.color}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                  activeDot={false}
                  connectNulls
                />
              );
            })}

            {hoveredKm !== null && hoveredKm !== undefined && hoveredEle !== undefined && (
              <ReferenceDot yAxisId="ele" x={hoveredKm} y={hoveredEle} r={6} fill="#111827" stroke="white" strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {segments.length > 0 && (
        <div className="profile-legend">
          {segments.map((segment, index) => (
            <span key={segment.id}>
              <i className="legend" style={{ background: segmentColor(index) }} /> Tramo {index + 1}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
