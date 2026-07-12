import type { KmSplit, TerrainType } from '../domain/split';
import type { TrackPoint } from '../domain/trackPoint';
import { computeSegmentStats } from './segmentAnalyzer';

/** Pendiente media, en %, por debajo de la cual un tramo se considera llano. */
const FLAT_GRADIENT_THRESHOLD_PERCENT = 2;

/** Distancia mínima, en km, para que un tramo entre en el ranking de mejor/peor. */
const MIN_RANKABLE_KM = 0.5;

export function buildKmSplits(points: TrackPoint[]): KmSplit[] {
  if (points.length < 2) return [];

  const totalKm = points[points.length - 1].distanceFromStart / 1000;
  const fullSplitsCount = Math.floor(totalKm);
  const splits: KmSplit[] = [];

  for (let index = 0; index < fullSplitsCount; index += 1) {
    splits.push({
      index,
      startKm: index,
      endKm: index + 1,
      isPartial: false,
      stats: computeSegmentStats(points, index, index + 1),
    });
  }

  const remainderKm = totalKm - fullSplitsCount;
  if (remainderKm > 0.01) {
    splits.push({
      index: fullSplitsCount,
      startKm: fullSplitsCount,
      endKm: totalKm,
      isPartial: true,
      stats: computeSegmentStats(points, fullSplitsCount, totalKm),
    });
  }

  return splits;
}

export function classifyTerrain(split: KmSplit): TerrainType {
  const gradient = split.stats.avgGradientPercent;
  if (gradient === undefined) return 'flat';
  if (gradient > FLAT_GRADIENT_THRESHOLD_PERCENT) return 'climb';
  if (gradient < -FLAT_GRADIENT_THRESHOLD_PERCENT) return 'descent';
  return 'flat';
}

function rankableSplits(splits: KmSplit[]): KmSplit[] {
  return splits.filter(
    (split) => split.stats.avgPaceSecPerKm !== undefined && split.endKm - split.startKm >= MIN_RANKABLE_KM,
  );
}

export interface SplitHighlights {
  bestKm?: KmSplit;
  worstKm?: KmSplit;
  bestFlat?: KmSplit;
  bestClimb?: KmSplit;
}

export function findSplitHighlights(splits: KmSplit[]): SplitHighlights {
  const rankable = rankableSplits(splits);
  if (rankable.length === 0) return {};

  const byPace = [...rankable].sort((a, b) => a.stats.avgPaceSecPerKm! - b.stats.avgPaceSecPerKm!);
  const bestKm = byPace[0];
  const worstKm = byPace[byPace.length - 1];

  const flats = rankable.filter((split) => classifyTerrain(split) === 'flat');
  const climbs = rankable.filter((split) => classifyTerrain(split) === 'climb');

  const bestFlat = flats.length > 0 ? [...flats].sort((a, b) => a.stats.avgPaceSecPerKm! - b.stats.avgPaceSecPerKm!)[0] : undefined;
  const bestClimb =
    climbs.length > 0 ? [...climbs].sort((a, b) => a.stats.avgPaceSecPerKm! - b.stats.avgPaceSecPerKm!)[0] : undefined;

  return { bestKm, worstKm, bestFlat, bestClimb };
}
