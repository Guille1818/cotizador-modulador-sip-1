'use client'

import React from 'react'
import type { ObraNuevaState } from '../types'

interface Props {
  state:   ObraNuevaState
  onReset: () => void
}

const FORMA_LABEL: Record<string, string> = {
  rect: 'Rectangular', L: 'Forma L', C: 'Forma C', T: 'Forma T', cruz: 'Cruz',
}
const CIMIENTO_LABEL: Record<string, string> = {
  platea: 'Piso de hormigón', pilotes: 'Casa sobre columnas', elevada: 'Estructura elevada',
}
const TECHO_LABEL: Record<string, string> = {
  plano: 'Plano', '1agua': '1 agua', '2aguas': '2 aguas',
  '2aguas_desf': '2 aguas desfasadas', '4aguas_puntual': '4 aguas puntual',
  '4aguas_cumbrera': '4 aguas cumbrera', desnivel: 'Desnivel',
}

function lbl(map: Record<string, string>, key: string | null) {
  return key ? (map[key] ?? key) : '—'
}

export function Step8Resumen({ state, onReset }: Props) {
  const sup        = (state.largo * state.ancho).toFixed(1)
  const paneles    = Math.round(state.largo * state.ancho * 1.6)
  const vigas      = Math.round((state.largo + state.ancho) * 2 / 1.22)
  const tornillos  = paneles * 24
  const selladores = Math.round(paneles * 0.3)

  const rows: [string, string][] = [
    ['Forma de planta',  lbl(FORMA_LABEL, state.forma)],
    ['Medidas',         `${state.largo}m × ${state.ancho}m × ${state.alto}m`],
    ['Superficie',       `${sup} m²`],
    ['Cimiento',         lbl(CIMIENTO_LABEL, state.cimiento)],
    ['Techo',            lbl(TECHO_LABEL, state.techo)],
    ['Pendiente',        `${state.pendiente}%`],
    ['Panel exterior',   state.opciones.panelExterior.toUpperCase()],
    ['Estructura',       state.opciones.estructura.charAt(0).toUpperCase() + state.opciones.estructura.slice(1)],
  ]

  const materiales: [string, string, string][] = [
    ['Paneles SIP',  String(paneles),   'unidades'],
    ['Vigas',        String(vigas),     'unidades'],
    ['Tornillos',    String(tornillos), 'unidades'],
    ['Selladores',   String(selladores),'unidades'],
  ]

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">Resumen de obra nueva</h2>
      <p className="text-sm text-gray-500 mb-5">
        Todo listo. Revisá antes de generar el presupuesto.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Datos del proyecto */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Proyecto
          </p>
          {rows.map(([k, v]) => (
            <div key={k}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-xs text-gray-500">{k}</span>
              <span className="text-xs font-medium text-gray-900 text-right">{v}</span>
            </div>
          ))}
        </div>

        {/* Estimación de materiales */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Materiales estimados
          </p>
          {materiales.map(([k, v, u]) => (
            <div key={k}
              className="flex items-center justify-between px-3 py-2.5 mb-1.5
                bg-amber-50 border border-amber-100 rounded-lg">
              <span className="text-xs text-amber-800">{k}</span>
              <div className="text-right">
                <span className="text-sm font-semibold text-amber-900">{v}</span>
                <span className="text-xs text-amber-600 ml-1">{u}</span>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-400 mt-2 px-1">
            Estimación preliminar. El presupuesto final incluye el detalle exacto.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
        <p className="text-sm text-amber-800 mb-4">
          Vista 3D y presupuesto detallado disponibles al continuar
        </p>
        <button
          type="button"
          className="w-full max-w-xs mx-auto block py-3 px-6
            bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold
            rounded-xl transition-colors shadow-sm"
        >
          Ver presupuesto →
        </button>
        <button
          type="button"
          onClick={onReset}
          className="mt-3 text-xs text-amber-700 underline underline-offset-2 opacity-70 hover:opacity-100"
        >
          Empezar de nuevo
        </button>
      </div>
    </div>
  )
}
