export function formatKm(km: number): string {
  return km.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDistanceMeters(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${formatKm(meters / 1000)} km`;
}

export function formatElevation(meters: number): string {
  return `${Math.round(meters)} m`;
}

export function formatDuration(seconds: number): string {
  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function formatPace(secPerKm: number): string {
  if (!Number.isFinite(secPerKm) || secPerKm <= 0) return '—';
  const minutes = Math.floor(secPerKm / 60);
  const seconds = Math.round(secPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
}

export function formatSpeed(kmh: number): string {
  return `${kmh.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km/h`;
}

export function formatHeartRate(bpm: number): string {
  return `${Math.round(bpm)} ppm`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

export function formatGradient(percent: number): string {
  return formatPercent(percent);
}

export function formatSignedPace(secPerKm: number): string {
  if (!Number.isFinite(secPerKm)) return '—';
  const sign = secPerKm > 0 ? '+' : secPerKm < 0 ? '−' : '';
  const abs = Math.abs(secPerKm);
  const minutes = Math.floor(abs / 60);
  const seconds = Math.round(abs % 60);
  return `${sign}${minutes}:${String(seconds).padStart(2, '0')} /km`;
}

export function formatSignedDuration(seconds: number): string {
  const sign = seconds > 0 ? '+' : seconds < 0 ? '−' : '';
  return `${sign}${formatDuration(Math.abs(seconds))}`;
}
