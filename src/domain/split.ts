import type { SegmentStats } from './selection';

export type TerrainType = 'flat' | 'climb' | 'descent';

/** Un tramo automático de ~1km entre dos puntos kilométricos enteros. */
export interface KmSplit {
  index: number;
  startKm: number;
  endKm: number;
  /** true si es el último tramo y la distancia total no es múltiplo exacto de 1km. */
  isPartial: boolean;
  stats: SegmentStats;
}
