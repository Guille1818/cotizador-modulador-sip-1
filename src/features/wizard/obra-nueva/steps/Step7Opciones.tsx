'use client'

import React, { useState } from 'react'
import type { OpcionesTecnicas } from '../types'

interface Props {
  opciones:   OpcionesTecnicas
  onChange:   (patch: Partial<OpcionesTecnicas>) => void
}

type SelectOption = { value: string; label: string }

const PANEL_EXT: SelectOption[] = [
  { value: 'osb',     label: 'OSB' },
  { value: 'cemento', label: 'Cemento' },
  { value: 'yeso',    label: 'Yeso' },
]
const PANEL_INT: SelectOption[] = [
  { value: 'osb',     label: 'OSB' },
  { value: 'yeso',    label: 'Yeso' },
  { value: 'cemento', label: 'Cemento' },
]
const SISTEMA_TECHO: SelectOption[] = [
  { value: 'sip_osb',  label: 'SIP OSB' },
  { value: 'sandwich', label: 'Sándwich' },
]
const ESTRUCTURA: SelectOption[] = [
  { value: 'madera', label: 'Madera' },
  { value: 'metal',  label: 'Metal' },
]

function Field({
  label, value, options, onChange,
}: {
  label: string
  value: string
  options: SelectOption[]
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white
          text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

export function Step7Opciones({ opciones, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">Opciones técnicas</h2>
      <p className="text-sm text-gray-500 mb-5">
        Los valores predeterminados funcionan para la mayoría de los proyectos.
      </p>

      {/* Banner de confirmación */}
      <div className="flex items-start gap-2 p-3 mb-4 bg-green-50 border border-green-200 rounded-xl">
        <svg viewBox="0 0 20 20" width="16" height="16" className="flex-shrink-0 mt-0.5" fill="none" aria-hidden>
          <circle cx="10" cy="10" r="9" stroke="#16A34A" strokeWidth="1.2"/>
          <path d="M6 10l3 3 5-6" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-xs text-green-800">
          Todo configurado con los valores recomendados. Podés continuar sin tocar nada.
        </p>
      </div>

      {/* Accordeon de opciones avanzadas */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5
          border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="text-left">
          <p className="text-sm font-medium text-gray-900">Opciones avanzadas</p>
          <p className="text-xs text-gray-500 mt-0.5">Material, estructura, sistema de techo</p>
        </div>
        <svg
          viewBox="0 0 20 20" width="18" height="18" fill="none"
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
          <Field
            label="Panel exterior"
            value={opciones.panelExterior}
            options={PANEL_EXT}
            onChange={(v) => onChange({ panelExterior: v as OpcionesTecnicas['panelExterior'] })}
          />
          <Field
            label="Panel interior"
            value={opciones.panelInterior}
            options={PANEL_INT}
            onChange={(v) => onChange({ panelInterior: v as OpcionesTecnicas['panelInterior'] })}
          />
          <Field
            label="Sistema de techo"
            value={opciones.sistemaTecho}
            options={SISTEMA_TECHO}
            onChange={(v) => onChange({ sistemaTecho: v as OpcionesTecnicas['sistemaTecho'] })}
          />
          <Field
            label="Estructura"
            value={opciones.estructura}
            options={ESTRUCTURA}
            onChange={(v) => onChange({ estructura: v as OpcionesTecnicas['estructura'] })}
          />
        </div>
      )}
    </div>
  )
}
