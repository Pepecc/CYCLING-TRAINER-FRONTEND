export const ZONE_COLORS = ['#444', '#4a7c59', '#2d6a4f', '#e9c46a', '#f4a261', '#e76f51', '#d62828']
export const ZONE_LABELS = ['Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7']

export function computeWperKg(ftp: number, weightKg: number): string {
  return (ftp / weightKg).toFixed(2)
}
