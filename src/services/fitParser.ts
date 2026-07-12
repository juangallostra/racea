import { Decoder, Stream } from '@garmin/fitsdk';
import type { TrackPoint } from '../domain/trackPoint';

const SEMICIRCLES_TO_DEGREES = 180 / 2 ** 31;

function toIsoTime(timestamp: unknown): string | undefined {
  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? undefined : timestamp.toISOString();
  }
  return undefined;
}

export function parseFit(buffer: ArrayBuffer): TrackPoint[] {
  const stream = Stream.fromArrayBuffer(buffer);

  if (!Decoder.isFIT(stream)) {
    throw new Error('El archivo no parece ser un FIT válido.');
  }

  const decoder = new Decoder(stream);
  const { messages } = decoder.read();
  const records = messages.recordMesgs ?? [];

  const points = records
    .filter((record) => typeof record.positionLat === 'number' && typeof record.positionLong === 'number')
    .map((record): TrackPoint => {
      const altitude = record.enhancedAltitude ?? record.altitude;

      return {
        lat: (record.positionLat as number) * SEMICIRCLES_TO_DEGREES,
        lon: (record.positionLong as number) * SEMICIRCLES_TO_DEGREES,
        ele: typeof altitude === 'number' && Number.isFinite(altitude) ? altitude : undefined,
        time: toIsoTime(record.timestamp),
        hr: typeof record.heartRate === 'number' ? record.heartRate : undefined,
        cadence: typeof record.cadence === 'number' ? record.cadence : undefined,
        power: typeof record.power === 'number' ? record.power : undefined,
        distanceFromStart: 0,
      };
    });

  if (points.length === 0) {
    throw new Error('El FIT no contiene puntos de posición GPS (mensajes "record").');
  }

  return points;
}
