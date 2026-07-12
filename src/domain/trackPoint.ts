export interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
  /** Pulsaciones en el punto, en bpm. */
  hr?: number;
  /** Cadencia en el punto, en pasos/pedaladas por minuto. */
  cadence?: number;
  /** Potencia en el punto, en vatios. */
  power?: number;
  /** Distancia acumulada desde el inicio del track, en metros. */
  distanceFromStart: number;
}

export interface ElevationStats {
  positive: number;
  negative: number;
}
