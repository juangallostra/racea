import type { HalfSplitComparison } from '../services/raceAnalysis';
import {
  formatDistanceMeters,
  formatHeartRate,
  formatPace,
  formatPercent,
  formatSignedPace,
} from '../services/formatters';

interface SplitComparisonCardProps {
  comparison: HalfSplitComparison;
}

const SPLIT_LABEL: Record<HalfSplitComparison['splitType'], string> = {
  negative: 'Negative split',
  positive: 'Positive split',
  even: 'Split equilibrado',
};

const SPLIT_BADGE_CLASS: Record<HalfSplitComparison['splitType'], string> = {
  negative: 'split-badge split-badge--negative',
  positive: 'split-badge split-badge--positive',
  even: 'split-badge split-badge--even',
};

export function SplitComparisonCard({ comparison }: SplitComparisonCardProps) {
  const { firstHalf, secondHalf, paceDiffSecPerKm, paceDiffPercent, splitType } = comparison;

  return (
    <section className="card">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Reparto del esfuerzo</p>
          <h2>Negative / positive split</h2>
          <p className="muted">Comparativa del ritmo entre la primera y la segunda mitad del recorrido.</p>
        </div>
      </div>

      <p className={SPLIT_BADGE_CLASS[splitType]}>
        {SPLIT_LABEL[splitType]}: {formatSignedPace(paceDiffSecPerKm)} ({formatPercent(paceDiffPercent)}) en la segunda mitad
      </p>

      <div className="split-halves-grid">
        <div className="summary-grid">
          <div>
            <span>1ª mitad</span>
            <strong>{formatDistanceMeters(firstHalf.distanceMeters)}</strong>
          </div>
          <div>
            <span>Ritmo</span>
            <strong>{firstHalf.avgPaceSecPerKm !== undefined ? formatPace(firstHalf.avgPaceSecPerKm) : '—'}</strong>
          </div>
          {firstHalf.avgHeartRate !== undefined && (
            <div>
              <span>Pulso medio</span>
              <strong>{formatHeartRate(firstHalf.avgHeartRate)}</strong>
            </div>
          )}
        </div>

        <div className="summary-grid">
          <div>
            <span>2ª mitad</span>
            <strong>{formatDistanceMeters(secondHalf.distanceMeters)}</strong>
          </div>
          <div>
            <span>Ritmo</span>
            <strong>{secondHalf.avgPaceSecPerKm !== undefined ? formatPace(secondHalf.avgPaceSecPerKm) : '—'}</strong>
          </div>
          {secondHalf.avgHeartRate !== undefined && (
            <div>
              <span>Pulso medio</span>
              <strong>{formatHeartRate(secondHalf.avgHeartRate)}</strong>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
