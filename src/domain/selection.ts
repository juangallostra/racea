/** Un tramo delimitado por dos puntos kilométricos del track. */
export interface Segment {
  id: string;
  aKm: number;
  bKm: number;
}

export interface SegmentStats {
  distanceMeters: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  durationSeconds?: number;
  avgPaceSecPerKm?: number;
  avgSpeedKmh?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  minElevation?: number;
  maxElevation?: number;
  avgGradientPercent?: number;
}
