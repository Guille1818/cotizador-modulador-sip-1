'use client'

import React from 'react'
import type { FormaPlanta } from '../types'

interface DimDef {
  key: string
  label: string
  desc: string
  defaultVal: number
  min: number
  max: number
}

interface CotaDef {
  x1: number; y1: number
  x2: number; y2: number
  lx: number; ly: number
  text: string
  vertical?: boolean
}

interface ShapeDef {
  dims: DimDef[]
  area: (v: Record<string, number>) => number
  path: (v: Record<string, number>, ox: number, oy: number, w: number, h: number) => string
  cotas: (v: Record<string, number>, ox: number, oy: number, w: number, h: number) => CotaDef[]
}

const SHAPE_DEFS: Record<string, ShapeDef> = {
  rect: {
    dims: [
      { key: 'A', label: 'A - Largo',  desc: 'Longitud horizontal (m)', defaultVal: 8, min: 1, max: 60 },
      { key: 'B', label: 'B - Ancho',  desc: 'Longitud vertical (m)', defaultVal: 5, min: 1, max: 40 },
    ],
    area: (v) => v.A * v.B,
    path: (_v, ox, oy, w, h) => `M${ox},${oy} L${ox+w},${oy} L${ox+w},${oy+h} L${ox},${oy+h} Z`,
    cotas: (v, ox, oy, w, h) => [
      { x1:ox, y1:oy-12, x2:ox+w, y2:oy-12, lx:ox+w/2, ly:oy-16, text:`A=${v.A}m` },
      { x1:ox+w+12, y1:oy, x2:ox+w+12, y2:oy+h, lx:ox+w+22, ly:oy+h/2, text:`B=${v.B}m`, vertical:true },
    ],
  },
  L: {
    dims: [
      { key: 'A', label: 'A - Largo total',  desc: 'Longitud horizontal (m)',       defaultVal: 8, min: 1, max: 60 },
      { key: 'B', label: 'B - Ancho total',  desc: 'Longitud vertical (m)',       defaultVal: 6, min: 1, max: 40 },
      { key: 'C', label: 'C - Largo receso', desc: 'Longitud horizontal del receso (m)', defaultVal: 4, min: 0.5, max: 30 },
      { key: 'D', label: 'D - Ancho receso', desc: 'Longitud vertical del receso (m)', defaultVal: 3, min: 0.5, max: 20 },
    ],
    area: (v) => v.A * v.B - v.C * v.D,
    path: (v, ox, oy, w, h) => {
      const cx = v.C / v.A
      const cy = v.D / v.B
      return `M${ox},${oy} L${ox+w},${oy} L${ox+w},${oy+h*cy} L${ox+w*(1-cx)},${oy+h*cy} L${ox+w*(1-cx)},${oy+h} L${ox},${oy+h} Z`
    },
    cotas: (v, ox, oy, w, h) => {
      const cx = v.C / v.A
      const cy = v.D / v.B
      return [
        { x1:ox, y1:oy-12, x2:ox+w, y2:oy-12, lx:ox+w/2, ly:oy-16, text:`A=${v.A}m` },
        { x1:ox-12, y1:oy, x2:ox-12, y2:oy+h, lx:ox-22, ly:oy+h/2, text:`B=${v.B}m`, vertical:true },
        { x1:ox+w*(1-cx), y1:oy+h+12, x2:ox+w, y2:oy+h+12, lx:ox+w*(1-cx/2), ly:oy+h+20, text:`C=${v.C}m` },
        { x1:ox+w+12, y1:oy, x2:ox+w+12, y2:oy+h*cy, lx:ox+w+22, ly:oy+h*cy/2, text:`D=${v.D}m`, vertical:true },
      ]
    },
  },
  C: {
    dims: [
      { key: 'A', label: 'A - Largo total',  desc: 'Longitud horizontal (m)',        defaultVal: 8, min: 1, max: 60 },
      { key: 'B', label: 'B - Ancho total',  desc: 'Longitud vertical (m)',        defaultVal: 6, min: 1, max: 40 },
      { key: 'C', label: 'C - Prof. muesca', desc: 'Longitud horizontal muesca (m)', defaultVal: 3, min: 0.5, max: 20 },
      { key: 'D', label: 'D - Alto muesca',  desc: 'Longitud vertical muesca (m)', defaultVal: 2, min: 0.5, max: 15 },
    ],
    area: (v) => v.A * v.B - v.C * v.D,
    path: (v, ox, oy, w, h) => {
      const cx = v.C / v.A
      const dy0 = (v.B - v.D) / 2 / v.B
      const dy1 = (v.B + v.D) / 2 / v.B
      return `M${ox},${oy} L${ox+w},${oy} L${ox+w},${oy+h*dy0} L${ox+w*(1-cx)},${oy+h*dy0} L${ox+w*(1-cx)},${oy+h*dy1} L${ox+w},${oy+h*dy1} L${ox+w},${oy+h} L${ox},${oy+h} Z`
    },
    cotas: (v, ox, oy, w, h) => {
      const cx = v.C / v.A
      const dy0 = (v.B - v.D) / 2 / v.B
      const dy1 = (v.B + v.D) / 2 / v.B
      return [
        { x1:ox, y1:oy-12, x2:ox+w, y2:oy-12, lx:ox+w/2, ly:oy-16, text:`A=${v.A}m` },
        { x1:ox-12, y1:oy, x2:ox-12, y2:oy+h, lx:ox-22, ly:oy+h/2, text:`B=${v.B}m`, vertical:true },
        { x1:ox+w*(1-cx), y1:oy+h/2, x2:ox+w, y2:oy+h/2, lx:ox+w*(1-cx/2), ly:oy+h/2-8, text:`C=${v.C}m` },
        { x1:ox+w+12, y1:oy+h*dy0, x2:ox+w+12, y2:oy+h*dy1, lx:ox+w+22, ly:oy+h*(dy0+dy1)/2, text:`D=${v.D}m`, vertical:true },
      ]
    },
  },
  T: {
    dims: [
      { key: 'A', label: 'A - Largo barra', desc: 'Longitud horizontal barra (m)', defaultVal: 8, min: 1, max: 60 },
      { key: 'B', label: 'B - Alto barra',  desc: 'Longitud vertical barra (m)',  defaultVal: 2, min: 0.5, max: 10 },
      { key: 'C', label: 'C - Ancho tallo', desc: 'Ancho del tallo (m)',      defaultVal: 2, min: 0.5, max: 10 },
      { key: 'D', label: 'D - Alto tallo',  desc: 'Alto del tallo (m)',       defaultVal: 4, min: 0.5, max: 30 },
    ],
    area: (v) => v.A * v.B + v.C * v.D,
    path: (v, ox, oy, w, h) => {
      const totalH = v.B + v.D
      const bh = v.B / totalH
      const cx0 = (v.A - v.C) / 2 / v.A
      const cx1 = (v.A + v.C) / 2 / v.A
      return `M${ox},${oy} L${ox+w},${oy} L${ox+w},${oy+h*bh} L${ox+w*cx1},${oy+h*bh} L${ox+w*cx1},${oy+h} L${ox+w*cx0},${oy+h} L${ox+w*cx0},${oy+h*bh} L${ox},${oy+h*bh} Z`
    },
    cotas: (v, ox, oy, w, h) => {
      const totalH = v.B + v.D
      const bh = v.B / totalH
      const cx0 = (v.A - v.C) / 2 / v.A
      const cx1 = (v.A + v.C) / 2 / v.A
      return [
        { x1:ox, y1:oy-12, x2:ox+w, y2:oy-12, lx:ox+w/2, ly:oy-16, text:`A=${v.A}m` },
        { x1:ox+w+12, y1:oy, x2:ox+w+12, y2:oy+h*bh, lx:ox+w+22, ly:oy+h*bh/2, text:`B=${v.B}m`, vertical:true },
        { x1:ox+w*cx0, y1:oy+h+12, x2:ox+w*cx1, y2:oy+h+12, lx:ox+w/2, ly:oy+h+20, text:`C=${v.C}m` },
        { x1:ox-12, y1:oy+h*bh, x2:ox-12, y2:oy+h, lx:ox-22, ly:oy+h*(bh+1)/2, text:`D=${v.D}m`, vertical:true },
      ]
    },
  },
  cruz: {
    dims: [
      { key: 'A', label: 'A - Largo total',   desc: 'Longitud horizontal (m)',          defaultVal: 8, min: 1, max: 60 },
      { key: 'B', label: 'B - Ancho total',   desc: 'Longitud vertical (m)',          defaultVal: 8, min: 1, max: 40 },
      { key: 'C', label: 'C - Alto barra H',  desc: 'Alto barra horizontal (m)', defaultVal: 2.5, min: 0.5, max: 15 },
      { key: 'D', label: 'D - Ancho barra V', desc: 'Ancho barra vertical (m)',  defaultVal: 2.5, min: 0.5, max: 15 },
    ],
    area: (v) => v.A * v.C + v.D * (v.B - v.C),
    path: (v, ox, oy, w, h) => {
      const cy0 = (v.B - v.C) / 2 / v.B
      const cy1 = (v.B + v.C) / 2 / v.B
      const dx0 = (v.A - v.D) / 2 / v.A
      const dx1 = (v.A + v.D) / 2 / v.A
      return `M${ox+w*dx0},${oy} L${ox+w*dx1},${oy} L${ox+w*dx1},${oy+h*cy0} L${ox+w},${oy+h*cy0} L${ox+w},${oy+h*cy1} L${ox+w*dx1},${oy+h*cy1} L${ox+w*dx1},${oy+h} L${ox+w*dx0},${oy+h} L${ox+w*dx0},${oy+h*cy1} L${ox},${oy+h*cy1} L${ox},${oy+h*cy0} L${ox+w*dx0},${oy+h*cy0} Z`
    },
    cotas: (v, ox, oy, w, h) => {
      const cy0 = (v.B - v.C) / 2 / v.B
      const dx0 = (v.A - v.D) / 2 / v.A
      const dx1 = (v.A + v.D) / 2 / v.A
      return [
        { x1:ox, y1:oy-12, x2:ox+w, y2:oy-12, lx:ox+w/2, ly:oy-16, text:`A=${v.A}m` },
        { x1:ox+w+12, y1:oy, x2:ox+w+12, y2:oy+h, lx:ox+w+22, ly:oy+h/2, text:`B=${v.B}m`, vertical:true },
        { x1:ox, y1:oy+h*cy0-10, x2:ox+w, y2:oy+h*cy0-10, lx:ox+w/2, ly:oy+h*cy0-14, text:`C=${v.C}m` },
        { x1:ox+w*dx0, y1:oy+h+12, x2:ox+w*dx1, y2:oy+h+12, lx:ox+w/2, ly:oy+h+20, text:`D=${v.D}m` },
      ]
    },
  },
  libre: {
    dims: [
      { key: 'A', label: 'A - Largo aprox.', desc: 'Largo aproximado (m)', defaultVal: 8, min: 1, max: 60 },
      { key: 'B', label: 'B - Ancho aprox.', desc: 'Ancho aproximado (m)', defaultVal: 5, min: 1, max: 40 },
    ],
    area: (v) => v.A * v.B * 0.85,
    path: (_v, ox, oy, w, h) => `M${ox},${oy} L${ox+w},${oy} L${ox+w},${oy+h} L${ox},${oy+h} Z`,
    cotas: (v, ox, oy, w, h) => [
      { x1:ox, y1:oy-12, x2:ox+w, y2:oy-12, lx:ox+w/2, ly:oy-16, text:`A~${v.A}m` },
      { x1:ox+w+12, y1:oy, x2:ox+w+12, y2:oy+h, lx:ox+w+22, ly:oy+h/2, text:`B~${v.B}m`, vertical:true },
    ],
  },
}

interface Props {
  forma:       FormaPlanta | null
  rotacion:    number
  largo:       number
  ancho:       number
  alto:        number
  dimExtras:   Record<string, number>
  onLargo:     (v: number) => void
  onAncho:     (v: number) => void
  onAlto:      (v: number) => void
  onDimExtra:  (key: string, v: number) => void
}

export function Step2Medidas({ forma, rotacion, largo, ancho, alto, dimExtras, onLargo, onAncho, onAlto, onDimExtra }: Props) {
  const def = SHAPE_DEFS[forma ?? 'rect']
  const vals: Record<string, number> = {}
  for (const d of def.dims) {
    if (d.key === 'A') vals.A = largo
    else if (d.key === 'B') vals.B = ancho
    else vals[d.key] = dimExtras[d.key] ?? d.defaultVal
  }
  const area = def.area(vals)

  function handleChange(key: string, raw: string) {
    const v = parseFloat(raw) || 0
    if (key === 'A') onLargo(v)
    else if (key === 'B') onAncho(v)
    else onDimExtra(key, v)
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">Cuanto mide la casa?</h2>
      <p className="text-sm text-gray-500 mb-5">Todo en metros. Podes ajustar despues en el dibujo.</p>
      <div className="grid grid-cols-2 gap-5 items-start">
        <div className="space-y-3">
          {def.dims.map((d) => (
            <label key={d.key} className="block">
              <span className="block text-xs font-semibold text-amber-700 mb-0.5">{d.label}</span>
              <span className="block text-xs text-gray-400 mb-1">{d.desc}</span>
              <input type="number" value={vals[d.key]} step="0.1" min={d.min} max={d.max}
                onChange={(e) => handleChange(d.key, e.target.value)}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-gray-900"/>
            </label>
          ))}
          <label className="block pt-1 border-t border-gray-100">
            <span className="block text-xs font-medium text-gray-500 mb-1">Altura de muros (m)</span>
            <input type="number" value={alto} step="0.1" min="1" max="5"
              onChange={(e) => onAlto(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-gray-900"/>
          </label>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">Superficie: <span className="font-semibold text-sm">{area.toFixed(1)} m2</span>
              {forma !== 'rect' && forma !== null && forma !== 'libre' && <span className="block text-amber-600 mt-0.5">(area real descontando recesos)</span>}
              {forma === 'libre' && <span className="block text-amber-600">Estimacion aprox.</span>}
            </p>
          </div>
        </div>
        {forma === 'libre' ? (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 text-center" style={{minHeight:200}}>
            <p className="text-xs text-amber-800 font-medium">Forma libre</p>
            <p className="text-xs text-amber-600 mt-1">La forma exacta se define en el paso de dibujo.</p>
          </div>
        ) : (
          <ShapePreview forma={forma} rotacion={rotacion} vals={vals} def={def} />
        )}
      </div>
    </div>
  )
}

function ShapePreview({ forma, rotacion, vals, def }: { forma: FormaPlanta | null; rotacion: number; vals: Record<string, number>; def: ShapeDef }) {
  const margin = { top: 28, right: 36, bottom: 28, left: 36 }
  const svgW = 220; const svgH = 180
  const canvasW = svgW - margin.left - margin.right
  const canvasH = svgH - margin.top - margin.bottom
  const swapped = rotacion % 180 !== 0
const A = Math.max(swapped ? (vals.B ?? 1) : (vals.A ?? 1), 0.1)
const B = Math.max(swapped ? (vals.A ?? 1) : (vals.B ?? 1), 0.1)
  const sc = Math.min(canvasW / A, canvasH / B)
  const w = A * sc; const h = B * sc
  const ox = margin.left + (canvasW - w) / 2
  const oy = margin.top + (canvasH - h) / 2
  const shapePath = def.path(vals, ox, oy, w, h)
  const cotas = def.cotas(vals, ox, oy, w, h)
  const cx = ox + w / 2; const cy = oy + h / 2

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full rounded-xl border border-gray-200 bg-gray-50" aria-label="Vista de planta con cotas">
      {Array.from({ length: 12 }, (_, i) => <line key={`v${i}`} x1={i*20} y1={0} x2={i*20} y2={svgH} stroke="#E5E7EB" strokeWidth="0.5"/>)}
      {Array.from({ length: 10 }, (_, i) => <line key={`h${i}`} x1={0} y1={i*20} x2={svgW} y2={i*20} stroke="#E5E7EB" strokeWidth="0.5"/>)}
      <g style={{ transformOrigin:`${cx}px ${cy}px`, transform:`rotate(${rotacion}deg)`, transition:'transform 0.35s ease' }}>
        <path d={shapePath} fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round"/>
      </g>
      {rotacion % 360 === 0 && cotas.map((c, i) => (
        <g key={i}>
          <line x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke="#D97706" strokeWidth="0.8"/>
          {c.vertical ? (
            <><line x1={c.x1-3} y1={c.y1} x2={c.x1+3} y2={c.y1} stroke="#D97706" strokeWidth="0.8"/><line x1={c.x2-3} y1={c.y2} x2={c.x2+3} y2={c.y2} stroke="#D97706" strokeWidth="0.8"/></>
          ) : (
            <><line x1={c.x1} y1={c.y1-3} x2={c.x1} y2={c.y1+3} stroke="#D97706" strokeWidth="0.8"/><line x1={c.x2} y1={c.y2-3} x2={c.x2} y2={c.y2+3} stroke="#D97706" strokeWidth="0.8"/></>
          )}
          <text x={c.lx} y={c.ly} textAnchor="middle" fontSize="8" fontWeight="600" fill="#92400E"
            transform={c.vertical ? `rotate(-90,${c.lx},${c.ly})` : undefined}>{c.text}</text>
        </g>
      ))}
      <text x={cx} y={cy+4} textAnchor="middle" fontSize="9" fill="#6B7280">{def.area(vals).toFixed(1)} m2</text>
    </svg>
  )
}



