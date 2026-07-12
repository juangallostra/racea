import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { KmSplit, TerrainType } from '../domain/split';
import type { GradientTimeLoss } from '../services/raceAnalysis';
import { classifyTerrain } from '../services/splitsAnalyzer';
import { formatGradient, formatKm, formatPace, formatSignedDuration } from '../services/formatters';

interface GradientPaceChartProps {
  splits: KmSplit[];
  timeLosses: GradientTimeLoss[];
}

const TERRAIN_LABEL: Record<TerrainType, string> = {
  flat: 'Llano',
  climb: 'Subida',
  descent: 'Bajada',
};

const TERRAIN_COLOR: Record<TerrainType, string> = {
  flat: '#64748b',
  climb: '#f97316',
  descent: '#0ea5e9',
};

interface ScatterPoint {
  gradient: number;
  pace: number;
  km: string;
}

function scatterData(splits: KmSplit[], terrain: TerrainType): ScatterPoint[] {
  return splits
    .filter((split) => classifyTerrain(split) === terrain)
    .filter((split) => split.stats.avgGradientPercent !== undefined && split.stats.avgPaceSecPerKm !== undefined)
    .map((split) => ({
      gradient: split.stats.avgGradientPercent!,
      pace: split.stats.avgPaceSecPerKm!,
      km: `${formatKm(split.startKm)}–${formatKm(split.endKm)}`,
    }));
}

export function GradientPaceChart({ splits, timeLosses }: GradientPaceChartProps) {
  const terrains: TerrainType[] = ['flat', 'climb', 'descent'];
  const series = terrains.map((terrain) => ({ terrain, data: scatterData(splits, terrain) }));
  const hasData = series.some((entry) => entry.data.length > 0);

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Terreno</p>
          <h2>Correlación ritmo-pendiente</h2>
          <p className="muted">Cada punto es un kilómetro: pendiente media frente a ritmo medio.</p>
        </div>
      </div>

      {!hasData && <p className="muted small-text">No hay suficientes datos de elevación y ritmo para esta actividad.</p>}

      {hasData && (
        <>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gradient" type="number" name="Pendiente" tickFormatter={(v) => `${Number(v).toFixed(0)}%`} unit=" %" />
                <YAxis
                  dataKey="pace"
                  type="number"
                  name="Ritmo"
                  reversed
                  tickFormatter={(v) => formatPace(Number(v))}
                  domain={['dataMin - 5%', 'dataMax + 5%']}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => (name === 'Pendiente' ? formatGradient(Number(value)) : formatPace(Number(value)))}
                />
                {series.map(
                  ({ terrain, data }) =>
                    data.length > 0 && <Scatter key={terrain} name={TERRAIN_LABEL[terrain]} data={data} fill={TERRAIN_COLOR[terrain]} />,
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="profile-legend">
            {terrains.map((terrain) => (
              <span key={terrain}>
                <i className="legend" style={{ background: TERRAIN_COLOR[terrain] }} /> {TERRAIN_LABEL[terrain]}
              </span>
            ))}
          </div>
        </>
      )}

      <h3 className="time-loss-title">Dónde perdiste más tiempo por el desnivel</h3>
      {timeLosses.length === 0 && (
        <p className="muted small-text">No hay suficientes tramos llanos de referencia para estimarlo en esta actividad.</p>
      )}
      {timeLosses.length > 0 && (
        <ul className="segment-list">
          {timeLosses.map(({ split, extraSeconds }) => (
            <li key={split.index} className="segment-row">
              <div className="segment-row__main">
                <strong>
                  Km {formatKm(split.startKm)}–{formatKm(split.endKm)}
                </strong>
                <span>
                  {formatSignedDuration(extraSeconds)} respecto a tu ritmo llano
                  {split.stats.avgGradientPercent !== undefined ? ` · pendiente ${formatGradient(split.stats.avgGradientPercent)}` : ''}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
