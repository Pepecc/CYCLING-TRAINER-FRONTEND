import type { ReadinessLevel, RecommendationLevel, TestedField, TestProtocol } from '../../types/progress'

// Lo mínimo de cada protocolo para la interfaz (el detalle completo viene de GET /api/tests)
export const PROTOCOL: Record<TestProtocol, { title: string; unit: 'W' | 'ppm'; input: string; field: TestedField; schedulable: boolean }> = {
  ftp_20min: { title: 'FTP 20 min', unit: 'W', field: 'ftp', schedulable: true, input: 'Potencia media de los 20 min' },
  ftp_8min: { title: 'FTP 2 × 8 min', unit: 'W', field: 'ftp', schedulable: true, input: 'Media de las dos series de 8 min' },
  ramp: { title: 'Rampa', unit: 'W', field: 'ftp', schedulable: true, input: 'Potencia del mejor minuto' },
  max_hr: { title: 'FC máxima', unit: 'ppm', field: 'maxHr', schedulable: true, input: 'FC más alta del test' },
  resting_hr: { title: 'FC en reposo', unit: 'ppm', field: 'restingHr', schedulable: false, input: 'FC en reposo (vacío = media de los check-ins)' },
}
export const PROTOCOL_IDS = Object.keys(PROTOCOL) as TestProtocol[]

export const READINESS_LABEL: Record<ReadinessLevel, string> = {
  good: 'buena', normal: 'normal', caution: 'precaución', rest: 'descanso',
}

export const READINESS_HINT: Record<ReadinessLevel, string> = {
  good: 'Buen día para la sesión de calidad.',
  normal: 'Sin señales de alarma: entrena según el plan.',
  caution: 'Señales de fatiga: menos volumen o intensidad, o cambia la calidad por resistencia suave.',
  rest: 'Varias señales de fatiga: mejor descanso o rodaje muy suave.',
}

export const RECOMMENDATION_LABEL: Record<RecommendationLevel, string> = {
  progress: 'subir carga', maintain: 'mantener', reduce: 'bajar un poco', recover: 'descarga',
}

export const FIELD_LABEL: Record<TestedField, string> = { ftp: 'FTP', maxHr: 'FC máxima', restingHr: 'FC en reposo' }
export const FIELD_UNIT: Record<TestedField, string> = { ftp: 'W', maxHr: 'ppm', restingHr: 'ppm' }

// Escalas del check-in: el número alto es siempre "más"
export const SCALES = [
  { key: 'fatigue', label: 'Cansancio', low: 'fresco', high: 'agotado', inverse: true },
  { key: 'sleepQuality', label: 'Calidad del sueño', low: 'muy mala', high: 'muy buena', inverse: false },
  { key: 'feeling', label: 'Sensaciones', low: 'muy malas', high: 'muy buenas', inverse: false },
  { key: 'soreness', label: 'Dolor muscular', low: 'nada', high: 'mucho', inverse: true },
] as const
