export type ActivitySource = 'gpx' | 'fit';

export interface ActivityMeta {
  fileName: string;
  source: ActivitySource;
}
