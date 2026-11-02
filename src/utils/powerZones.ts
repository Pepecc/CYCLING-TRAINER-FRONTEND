export const ZONE_COLORS = ['#444', '#4a7c59', '#2d6a4f', '#e9c46a', '#f4a261', '#e76f51', '#d62828']
export const ZONE_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7']

export function computeWperKg(ftp: number, weightKg: number): string {
  return (ftp / weightKg).toFixed(2)
}

// Coggan 7-zone model — same thresholds as CyclistProfile.powerZones in the backend
const ZONE_RANGES: Array<[number, number | null]> = [
  [0, 0.55], [0.56, 0.75], [0.76, 0.90], [0.91, 1.05], [1.06, 1.20], [1.21, 1.50], [1.51, null],
]

export function computeZones(ftp: number): Array<{ label: string; color: string; min: number; max: number | null }> {
  return ZONE_RANGES.map(([lo, hi], i) => ({
    label: ZONE_LABELS[i],
    color: ZONE_COLORS[i],
    min: Math.round(ftp * lo),
    max: hi === null ? null : Math.round(ftp * hi),
  }))
}
