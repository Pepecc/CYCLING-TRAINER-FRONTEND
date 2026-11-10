import { useEffect, useMemo, useRef, useState } from 'react'
import type { FitnessPoint, RaceCheckpoint } from '../../types/plan'
import { formatShort, formatLong, daysBetween } from '../../utils/dates'

// CTL/ATL en un panel y TSB en otro debajo, con el mismo eje de tiempo (mismas unidades, distinta escala:
// no se mezclan en un eje doble). Lo real va en línea continua y lo previsto, discontinua.

const ORIGIN_LABEL = { actual: 'real (Wahoo)', planned: 'plan detallado', season: 'estimado por temporada' } as const

interface Props {
  points: FitnessPoint[]
  today: string
  races: RaceCheckpoint[]
}

const M = { left: 36, right: 44, top: 22, bottom: 22 }
const TOP_H = 200
const GAP = 26
const TSB_H = 110

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(entries => setWidth(Math.max(280, entries[0].contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

function niceStep(span: number, ticks: number): number {
  const raw = span / ticks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag
}

function ticksFor(min: number, max: number, count: number): number[] {
  const step = niceStep(Math.max(1, max - min), count)
  const out: number[] = []
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v))
  return out
}

function path(pts: Array<[number, number]>): string {
  return pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')
}

export function FormChart({ points, today, races }: Props) {
  const [wrapRef, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const geo = useMemo(() => {
    const n = points.length
    const innerW = width - M.left - M.right
    const x = (i: number) => M.left + (n <= 1 ? 0 : (i / (n - 1)) * innerW)

    const loadMax = Math.max(10, ...points.map(p => Math.max(p.ctl, p.atl))) * 1.08
    const yTop = (v: number) => M.top + TOP_H - (v / loadMax) * TOP_H

    const tsbMin = Math.min(-10, ...points.map(p => p.tsb)) - 3
    const tsbMax = Math.max(10, ...points.map(p => p.tsb)) + 3
    const tsbTop = M.top + TOP_H + GAP
    const yTsb = (v: number) => tsbTop + TSB_H - ((v - tsbMin) / (tsbMax - tsbMin)) * TSB_H

    const todayIdx = points.findIndex(p => p.date >= today)
    const split = todayIdx < 0 ? n - 1 : todayIdx   // el punto de hoy une las dos partes

    return { n, innerW, x, yTop, yTsb, loadMax, tsbMin, tsbMax, tsbTop, split, todayIdx }
  }, [points, width, today])

  if (points.length < 2) return <div className="muted">No hay datos suficientes para el gráfico.</div>

  const { x, yTop, yTsb, loadMax, tsbMin, tsbMax, tsbTop, split, todayIdx } = geo
  const height = tsbTop + TSB_H + M.bottom

  const line = (key: 'ctl' | 'atl' | 'tsb', y: (v: number) => number) => {
    const pts = points.map((p, i) => [x(i), y(p[key])] as [number, number])
    return { real: path(pts.slice(0, split + 1)), planned: path(pts.slice(split)) }
  }
  const ctl = line('ctl', yTop)
  const atl = line('atl', yTop)
  const tsb = line('tsb', yTsb)

  // Etiquetas de fecha: una por semana o por mes según el rango
  const dayStep = points.length > 120 ? 28 : points.length > 50 ? 14 : 7
  const dateTicks = points.map((p, i) => ({ p, i })).filter(({ i }) => (i - Math.max(0, todayIdx)) % dayStep === 0)

  const raceMarks = races
    .map(r => ({ r, i: points.findIndex(p => p.date === r.date) }))
    .filter(m => m.i >= 0)

  const last = points[points.length - 1]
  const hp = hover != null ? points[hover] : null

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = Math.round(((px - M.left) / geo.innerW) * (geo.n - 1))
    setHover(Math.max(0, Math.min(geo.n - 1, i)))
  }

  const tipLeft = hover != null ? x(hover) : 0
  const tipOnLeft = tipLeft > width * 0.6

  return (
    <div className="form-chart" ref={wrapRef}>
      <div className="chart-legend">
        <span><i className="swatch s-ctl" /> CTL · forma</span>
        <span><i className="swatch s-atl" /> ATL · fatiga</span>
        <span><i className="swatch s-tsb" /> TSB · frescura</span>
        <span className="muted"><i className="swatch-line" /> real <i className="swatch-line dashed" /> previsto</span>
      </div>

      <svg width={width} height={height} role="img" aria-label="Evolución de CTL, ATL y TSB, real y proyectada">
        {/* rejilla y ejes */}
        {ticksFor(0, loadMax, 4).map(v => (
          <g key={`l${v}`}>
            <line className="grid" x1={M.left} x2={width - M.right} y1={yTop(v)} y2={yTop(v)} />
            <text className="axis" x={M.left - 6} y={yTop(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        {ticksFor(tsbMin, tsbMax, 3).map(v => (
          <g key={`t${v}`}>
            <line className={v === 0 ? 'zero' : 'grid'} x1={M.left} x2={width - M.right} y1={yTsb(v)} y2={yTsb(v)} />
            <text className="axis" x={M.left - 6} y={yTsb(v) + 3} textAnchor="end">{v > 0 ? `+${v}` : v}</text>
          </g>
        ))}
        <text className="panel-label" x={M.left} y={M.top - 8}>CTL y ATL</text>
        <text className="panel-label" x={M.left} y={tsbTop - 8}>TSB</text>

        {dateTicks.map(({ p, i }) => (
          <text key={p.date} className="axis" x={x(i)} y={height - 6} textAnchor="middle">{formatShort(p.date)}</text>
        ))}

        {/* hoy */}
        {todayIdx >= 0 && (
          <g>
            <line className="today-line" x1={x(todayIdx)} x2={x(todayIdx)} y1={M.top} y2={tsbTop + TSB_H} />
            <text className="axis strong" x={x(todayIdx) + 4} y={M.top + 10}>hoy</text>
          </g>
        )}

        {/* carreras */}
        {raceMarks.map(({ r, i }) => (
          <g key={r.raceId}>
            {r.targetTsb && (
              <rect className="tsb-band" x={x(Math.max(0, i - 1)) - 3} width={6}
                y={yTsb(Math.min(r.targetTsb[1], tsbMax))} height={Math.max(2, yTsb(Math.max(r.targetTsb[0], tsbMin)) - yTsb(Math.min(r.targetTsb[1], tsbMax)))} />
            )}
            <line className={`race-line prio-${r.priority}`} x1={x(i)} x2={x(i)} y1={M.top} y2={tsbTop + TSB_H} />
            <text className="race-label" x={x(i)} y={M.top - 8} textAnchor={x(i) > width - 80 ? 'end' : 'middle'}>⚑ {r.priority} {r.name.slice(0, 18)}</text>
          </g>
        ))}

        {/* series */}
        <path className="ln ln-atl" d={atl.real} />
        <path className="ln ln-atl dashed" d={atl.planned} />
        <path className="ln ln-ctl" d={ctl.real} />
        <path className="ln ln-ctl dashed" d={ctl.planned} />
        <path className="ln ln-tsb" d={tsb.real} />
        <path className="ln ln-tsb dashed" d={tsb.planned} />

        {/* etiquetas directas al final */}
        <text className="end-label" x={width - M.right + 4} y={yTop(last.ctl) + 3}>CTL {Math.round(last.ctl)}</text>
        <text className="end-label" x={width - M.right + 4} y={yTop(last.atl) + (Math.abs(yTop(last.atl) - yTop(last.ctl)) < 12 ? (last.atl > last.ctl ? -9 : 15) : 3)}>ATL {Math.round(last.atl)}</text>
        <text className="end-label" x={width - M.right + 4} y={yTsb(last.tsb) + 3}>{last.tsb > 0 ? '+' : ''}{Math.round(last.tsb)}</text>

        {/* hover */}
        {hp && hover != null && (
          <g className="hover">
            <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={M.top} y2={tsbTop + TSB_H} />
            <circle className="dot dot-ctl" cx={x(hover)} cy={yTop(hp.ctl)} r={4} />
            <circle className="dot dot-atl" cx={x(hover)} cy={yTop(hp.atl)} r={4} />
            <circle className="dot dot-tsb" cx={x(hover)} cy={yTsb(hp.tsb)} r={4} />
          </g>
        )}
        <rect
          x={M.left} y={M.top} width={geo.innerW} height={tsbTop + TSB_H - M.top}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>

      {hp && hover != null && (
        <div className="chart-tip" style={{ left: tipOnLeft ? undefined : tipLeft + 12, right: tipOnLeft ? width - tipLeft + 12 : undefined }}>
          <div className="chart-tip-date">{formatLong(hp.date)}{hp.date === today ? ' (hoy)' : ''}</div>
          <div><i className="swatch s-ctl" /> CTL <strong>{hp.ctl.toFixed(1)}</strong></div>
          <div><i className="swatch s-atl" /> ATL <strong>{hp.atl.toFixed(1)}</strong></div>
          <div><i className="swatch s-tsb" /> TSB <strong>{hp.tsb > 0 ? '+' : ''}{hp.tsb.toFixed(1)}</strong></div>
          <div className="muted">TSS {Math.round(hp.tss)} · {ORIGIN_LABEL[hp.origin]}</div>
          {raceMarks.filter(m => m.r.date === hp.date).map(m => (
            <div key={m.r.raceId}>⚑ {m.r.name}</div>
          ))}
          {hp.date > today && <div className="muted">dentro de {daysBetween(today, hp.date)} días</div>}
        </div>
      )}
    </div>
  )
}
