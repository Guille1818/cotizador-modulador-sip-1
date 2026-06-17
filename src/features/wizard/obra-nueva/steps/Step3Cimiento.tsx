'use client'

import React from 'react'
import { OptionCard } from '../../shared/OptionCard'
import type { TipoCimiento } from '../types'

interface Props {
  value:    TipoCimiento | null
  onChange: (v: TipoCimiento) => void
}

const CIMIENOS: {
  id: TipoCimiento
  name: string
  desc: string
  detail: string
  Icon: React.FC<{ active: boolean }>
}[] = [
  {
    id: 'platea',
    name: 'Platea de hormigón armado',
    desc: 'La losa se vierte directamente sobre el suelo preparado.',
    detail: 'Pegada al piso — opción más habitual para terrenos planos',
    Icon: IconPlatea,
  },
  {
    id: 'elevada',
    name: 'Estructura elevada',
    desc: 'La casa queda elevada del nivel del piso sobre columnas de metal o madera.',
    detail: 'Ideal para terrenos con desnivel, inundables o con pendiente',
    Icon: IconElevada,
  },
]

export function Step3Cimiento({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        ¿Sobre qué apoya la casa?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        La base que sostiene toda la construcción
      </p>

      <div className="flex flex-col gap-3">
        {CIMIENOS.map((c) => {
          const active = value === c.id
          return (
            <OptionCard
              key={c.id}
              selected={active}
              onClick={() => onChange(c.id)}
              selectedClass="border-amber-500 bg-amber-50"
            >
              <div className={`flex-shrink-0 ${active ? 'text-amber-600' : 'text-gray-400'}`}>
                <c.Icon active={active} />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${active ? 'text-amber-900' : 'text-gray-900'}`}>
                  {c.name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{c.desc}</p>
                <p className={`text-xs mt-1 ${active ? 'text-amber-700' : 'text-gray-400'}`}>
                  {c.detail}
                </p>
              </div>
            </OptionCard>
          )
        })}
      </div>
    </div>
  )
}

function IconPlatea({ active }: { active: boolean }) {
  const c = active ? '#D97706' : '#9CA3AF'
  return (
    <svg viewBox="0 0 52 52" width="44" height="44" fill="none" aria-hidden>
      {/* Casa */}
      <rect x="8" y="8" width="36" height="22" rx="2" stroke={c} strokeWidth="2"/>
      {/* Losa sólida pegada */}
      <rect x="6" y="30" width="40" height="9" rx="1.5"
        fill={c} fillOpacity="0.2" stroke={c} strokeWidth="2"/>
      {/* Suelo */}
      <line x1="4" y1="44" x2="48" y2="44" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
      {/* Indicador "pegado al suelo" */}
      <line x1="26" y1="39" x2="26" y2="43" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function IconElevada({ active }: { active: boolean }) {
  const c = active ? '#D97706' : '#9CA3AF'
  return (
    <svg viewBox="0 0 52 52" width="44" height="44" fill="none" aria-hidden>
      {/* Casa */}
      <rect x="8" y="6" width="36" height="22" rx="2" stroke={c} strokeWidth="2"/>
      {/* Columnas */}
      <rect x="11" y="28" width="6" height="14" rx="1" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.5"/>
      <rect x="23" y="28" width="6" height="14" rx="1" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.5"/>
      <rect x="35" y="28" width="6" height="14" rx="1" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.5"/>
      {/* Suelo (más abajo que la base de las columnas) */}
      <line x1="4" y1="46" x2="48" y2="46" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
      {/* Espacio de aire entre casa y suelo */}
      <line x1="8"  y1="34" x2="8"  y2="46" stroke={c} strokeWidth="0.5" strokeDasharray="2 2"/>
      <line x1="44" y1="34" x2="44" y2="46" stroke={c} strokeWidth="0.5" strokeDasharray="2 2"/>
    </svg>
  )
}
