const PALETTE = ['#f97316', '#0ea5e9', '#8b5cf6', '#22c55e', '#ec4899', '#eab308', '#14b8a6', '#ef4444'];

export function segmentColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
