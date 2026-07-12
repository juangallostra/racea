import { Line, LineChart, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { KmSplit } from '../domain/split';
import type { DecouplingResult } from '../services/raceAnalysis';
import { formatPercent } from '../services/formatters';

interface DecouplingChartProps {
  splits: KmSplit[];
  decoupling: DecouplingResult;
}

type DecouplingTier = 'low' | 'moderate' | 'high';

const TIER_LABEL: Record<DecouplingTier, string> = {
  low: 'Bajo',
  moderate: 'Moderado',
  high: 'Alto',
};

const TIER_CLASS: Record<DecouplingTier, string> = {
  low: 'split-badge split-badge--negative',
  moderate: 'split-badge split-badge--even',
  high: 'split-badge split-badge--positive',
};

function decouplingTier(percent: number): DecouplingTier {
  if (percent < 5) return 'low';
  if (percent < 10) return 'moderate';
  return 'high';
}

export function DecouplingChart({ splits, decoupling }: DecouplingChartProps) {
  if (splits.length === 0) return null;

  const data = splits.map((split) => ({
    km: (split.startKm + split.endKm) / 2,
    paceSecPerKm: split.stats.avgPaceSecPerKm,
    hr: split.stats.avgHeartRate,
  }));

  const totalKm = splits[splits.length - 1].endKm;
  const halfKm = totalKm / 2;
  const tier = decouplingTier(decoupling.decouplingPercent);

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Gestión del esfuerzo</p>
          <h2>Desacoplamiento ritmo / pulso</h2>
          <p className="muted">
            Compara la eficiencia (velocidad respecto al pulso) entre la primera y la segunda mitad. Un valor alto
            indica deriva cardíaca (fatiga).
          </p>
        </div>
      </div>

      <p className={TIER_CLASS[tier]}>
        Desacoplamiento: {formatPercent(decoupling.decouplingPercent)} · {TIER_LABEL[tier]}
      </p>

      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 8 }}>
            <XAxis dataKey="km" type="number" domain={[data[0].km, data[data.length - 1].km]} tickFormatter={(v) => Number(v).toFixed(1)} unit=" km" />
            <YAxis yAxisId="pace" hide domain={['dataMin - 5%', 'dataMax + 5%']} reversed />
            <YAxis yAxisId="hr" hide domain={['dataMin - 5%', 'dataMax + 5%']} />
            <ReferenceLine x={halfKm} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Mitad', position: 'top' }} />
            <Line
              yAxisId="pace"
              type="monotone"
              dataKey="paceSecPerKm"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
            <Line
              yAxisId="hr"
              type="monotone"
              dataKey="hr"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="profile-legend">
        <span>
          <i className="legend" style={{ background: '#0ea5e9' }} /> Ritmo
        </span>
        <span>
          <i className="legend" style={{ background: '#dc2626' }} /> Pulso
        </span>
      </div>
    </section>
  );
}
