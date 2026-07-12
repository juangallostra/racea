import type { KmSplit } from '../domain/split';
import type { SplitHighlights } from '../services/splitsAnalyzer';
import { formatElevation, formatGradient, formatHeartRate, formatKm, formatPace } from '../services/formatters';
import { BEST_SPLIT_COLOR, WORST_SPLIT_COLOR } from '../services/segmentColors';

interface SplitsTableProps {
  splits: KmSplit[];
  highlights: SplitHighlights;
}

function highlightRowClass(split: KmSplit, highlights: SplitHighlights): string {
  if (split.index === highlights.bestKm?.index) return 'split-row split-row--best';
  if (split.index === highlights.worstKm?.index) return 'split-row split-row--worst';
  return 'split-row';
}

export function SplitsTable({ splits, highlights }: SplitsTableProps) {
  if (splits.length === 0) {
    return (
      <section className="card">
        <p className="eyebrow">Splits</p>
        <h2>Splits por kilómetro</h2>
        <p className="muted">Carga una actividad para ver los splits por kilómetro.</p>
      </section>
    );
  }

  const highlightCards = [
    highlights.bestKm && { label: 'Mejor km', split: highlights.bestKm, color: BEST_SPLIT_COLOR },
    highlights.worstKm && { label: 'Peor km', split: highlights.worstKm, color: WORST_SPLIT_COLOR },
    highlights.bestFlat && { label: 'Mejor tramo llano', split: highlights.bestFlat },
    highlights.bestClimb && { label: 'Mejor tramo de subida', split: highlights.bestClimb },
  ].filter((card): card is { label: string; split: KmSplit; color?: string } => Boolean(card));

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Splits</p>
          <h2>Splits por kilómetro</h2>
          <p className="muted">Ritmo, pulso y desnivel de cada kilómetro del recorrido.</p>
        </div>
      </div>

      {highlightCards.length > 0 && (
        <div className="summary-grid">
          {highlightCards.map(({ label, split, color }) => (
            <div key={label}>
              <span>{label}</span>
              <strong style={color ? { color } : undefined}>
                Km {formatKm(split.startKm)}–{formatKm(split.endKm)}
                {split.stats.avgPaceSecPerKm !== undefined ? ` · ${formatPace(split.stats.avgPaceSecPerKm)}` : ''}
              </strong>
            </div>
          ))}
        </div>
      )}

      <div className="splits-table-wrapper">
        <table className="splits-table">
          <thead>
            <tr>
              <th>Km</th>
              <th>Ritmo</th>
              <th>Pulso</th>
              <th>Desnivel +/−</th>
              <th>Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {splits.map((split) => (
              <tr key={split.index} className={highlightRowClass(split, highlights)}>
                <td>
                  {formatKm(split.startKm)}–{formatKm(split.endKm)}
                  {split.isPartial ? ' *' : ''}
                </td>
                <td>{split.stats.avgPaceSecPerKm !== undefined ? formatPace(split.stats.avgPaceSecPerKm) : '—'}</td>
                <td>{split.stats.avgHeartRate !== undefined ? formatHeartRate(split.stats.avgHeartRate) : '—'}</td>
                <td>
                  {formatElevation(split.stats.elevationGainMeters)} / {formatElevation(split.stats.elevationLossMeters)}
                </td>
                <td>{split.stats.avgGradientPercent !== undefined ? formatGradient(split.stats.avgGradientPercent) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {splits.some((split) => split.isPartial) && (
        <p className="muted small-text">* Tramo final parcial (menos de 1 km).</p>
      )}
    </section>
  );
}
