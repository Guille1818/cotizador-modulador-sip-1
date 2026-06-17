'use client'

import React from 'react'
import type { TipoTecho, OrientacionAgua } from '../types'

interface Props {
  value:              TipoTecho | null
  orientacionAgua:    OrientacionAgua
  pendiente:          number
  alturaCumbrera:     number
  pendienteNegativa:  boolean
  onChange:           (v: TipoTecho) => void
  onOrientacion:      (v: OrientacionAgua) => void
  onPendiente:        (v: number) => void
  onAlturaCumbrera:   (v: number) => void
  onPendienteNegativa:(v: boolean) => void
}

const TECHOS: { id: TipoTecho; name: string; d: string }[] = [
  { id: 'plano',           name: 'Plano',            d: 'M10,40 L70,40' },
  { id: '1agua',           name: '1 agua',           d: 'M10,50 L70,50 L70,24 L10,44 Z' },
  { id: '2aguas',          name: '2 aguas',          d: 'M10,50 L70,50 L40,20 Z' },
  { id: '2aguas_desf',     name: '2 aguas desf.',    d: 'M10,50 L55,50 L55,26 L70,50 M10,50 L10,40 L55,26' },
  { id: '4aguas_puntual',  name: '4 aguas puntual',  d: 'M10,50 L70,50 L40,18 Z M10,50 L40,18 M70,50 L40,18' },
  { id: '4aguas_cumbrera', name: '4 aguas cumbrera', d: 'M10,50 L10,34 L24,22 L56,22 L70,34 L70,50 Z M24,22 L10,34 M56,22 L70,34' },
  { id: 'desnivel',        name: 'Desnivel',         d: 'M10,42 L38,28 M38,28 L38,52 M38,28 L38,14 M38,52 L70,40 M70,52 L70,40 M10,52 L10,42' },
]

const ORIENTACIONES: OrientacionAgua[] = ['N', 'S', 'E', 'O']

// Techos que usan orientación de agua
const NEEDS_ORIENTACION: TipoTecho[] = ['1agua', '2aguas_desf', 'desnivel']
// Techos que usan altura de cumbrera
const NEEDS_CUMBRERA: TipoTecho[] = ['2aguas', '2aguas_desf', '4aguas_puntual', '4aguas_cumbrera', 'desnivel']

export function Step6Techo({
  value, orientacionAgua, pendiente, alturaCumbrera, pendienteNegativa,
  onChange, onOrientacion, onPendiente, onAlturaCumbrera, onPendienteNegativa,
}: Props) {
  const pendienteError = pendiente < 2
    ? 'La pendiente mínima recomendada es 2%'
    : null

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">¿Cómo va el techo?</h2>
      <p className="text-sm text-gray-500 mb-4">Elegí la forma que más te gusta</p>

      {/* Grid de tipos */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {TECHOS.map((t) => {
          const active = value === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`flex flex-col items-center p-2.5 rounded-xl border transition-all active:scale-95
                ${active
                  ? 'border-2 border-amber-500 bg-amber-50'
                  : 'border border-gray-200 bg-white hover:border-gray-300'}`}
            >
              <svg viewBox="0 0 80 70" width="58" height="50" aria-hidden>
                <path
                  d={t.d}
                  fill={active ? '#FEF3C7' : 'none'}
                  stroke={active ? '#D97706' : '#9CA3AF'}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
              <p className={`text-xs font-medium leading-tight text-center mt-1
                ${active ? 'text-amber-900' : 'text-gray-700'}`}>
                {t.name}
              </p>
            </button>
          )
        })}
      </div>

      {/* Controles — solo si hay tipo elegido */}
      {value && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">

          {/* Pendiente */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-gray-600">Pendiente</span>
              <span className={`text-sm font-semibold ${pendienteError ? 'text-red-600' : 'text-amber-700'}`}>
                {pendiente}%
              </span>
            </div>
            <input
              type="range" min={0} max={60} step={1} value={pendiente}
              onChange={(e) => onPendiente(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            {pendienteError && (
              <p className="text-xs text-red-500 mt-1">{pendienteError}</p>
            )}
          </div>

          {/* Altura de cumbrera */}
          {NEEDS_CUMBRERA.includes(value) && (
            <label className="block">
              <span className="text-xs font-medium text-gray-600 block mb-1">
                Altura de cumbrera (m)
              </span>
              <input
                type="number"
                value={alturaCumbrera}
                step="0.1"
                min="0.2"
                max="5"
                onChange={(e) => onAlturaCumbrera(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-amber-400
                  bg-white text-gray-900"
              />
            </label>
          )}

          {/* Orientación del agua */}
          {NEEDS_ORIENTACION.includes(value) && (
            <div>
              <span className="text-xs font-medium text-gray-600 block mb-2">
                Orientación — hacia dónde cae el agua
              </span>
              <div className="grid grid-cols-4 gap-2">
                {ORIENTACIONES.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onOrientacion(o)}
                    className={`py-1.5 rounded-lg text-sm font-medium border transition-all
                      ${orientacionAgua === o
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggle pendiente negativa */}
          <label className="flex items-center justify-between cursor-pointer select-none">
            <div>
              <p className="text-sm font-medium text-gray-800">Pendiente negativa</p>
              <p className="text-xs text-gray-500">Canaleta interior en vez de alero exterior</p>
            </div>
            <div className={`relative w-10 h-6 rounded-full transition-colors ${pendienteNegativa ? 'bg-amber-500' : 'bg-gray-300'}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={pendienteNegativa}
                onChange={(e) => onPendienteNegativa(e.target.checked)}
              />
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                ${pendienteNegativa ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </div>
          </label>

        </div>
      )}
    </div>
  )
}
