'use client'

/**
 * StepDibujo — Paso 5 de Obra Nueva / Paso 5 de Ampliación / Paso 5 de Refacción
 * ---------------------------------------------------------------------------------
 * Envuelve el FloorPlan ORIGINAL del cotizador.
 * El editor se muestra completo, igual que en la pantalla de ingeniería actual,
 * con tres ajustes mínimos vía props nuevas:
 *
 *   wizardMode    → oculta el panel lateral de dimensiones (ya las ingresó el usuario)
 *   overlayFile   → muestra el plano subido translúcido debajo de la grilla
 *   onWallsChange → notifica cuando hay/no hay muros (para habilitar "Continuar")
 *
 * Ver abajo la sección "MODIFICACIONES EN floor-plan.tsx" con el diff exacto.
 */

import React from 'react'
import dynamic from 'next/dynamic'

const FloorPlan = dynamic(
  () =>
    import('@/features/engineering/components/floor-plan').then(
      (m) => m.default
    ),
  {
    ssr: false,
    loading: () => <SkeletonEditor />,
  }
)

interface StepDibujoProps {
  planoFile:    File | null
  largo:        number
  ancho:        number
  context:      'obra_nueva' | 'ampliacion' | 'refaccion'
  onHasWalls:   (has: boolean) => void
}

const HINTS: Record<StepDibujoProps['context'], string> = {
  obra_nueva:  'Dibujá los muros, tabiques, puertas y ventanas de tu casa.',
  ampliacion:  'Dibujá la parte nueva que se va a agregar.',
  refaccion:   'Marcá los muros y aberturas de la zona que vas a refaccionar.',
}

export function StepDibujo({ planoFile, largo, ancho, context, onHasWalls }: StepDibujoProps) {
  const hint = HINTS[context]
  const hasPlano = planoFile !== null

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">
        Diseñá tu planta
      </h2>
      <p className="text-sm text-gray-500 mb-3">{hint}</p>

      {hasPlano && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2
          bg-amber-50 border border-amber-200 rounded-xl">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="7" stroke="#D97706" strokeWidth="1.2"/>
            <path d="M8 5v4M8 11v.5" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-xs text-amber-800">
            <strong>{planoFile!.name}</strong> visible como guía translúcida en la grilla.
          </p>
        </div>
      )}

      {/*
        FloorPlan con las 3 props nuevas.
        El editor aparece completo — mismas herramientas que en la pantalla de ingeniería.
      */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm -mx-1">
        <FloorPlan
          initialDimensions={largo > 0 ? { largo, ancho } : undefined}
          overlayFile={planoFile ?? undefined}
          wizardMode
          onWallsChange={(walls: unknown[]) => onHasWalls(walls.length > 0)}
        />
      </div>
    </div>
  )
}

function SkeletonEditor() {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-gray-50 animate-pulse"
      style={{ height: 500 }}
    >
      <div className="h-11 bg-gray-100 rounded-t-2xl border-b border-gray-200 flex items-center px-4 gap-3">
        {[80, 60, 60, 60, 60].map((w, i) => (
          <div key={i} className="bg-gray-200 rounded" style={{ width: w, height: 24 }} />
        ))}
      </div>
      <div className="flex h-[calc(100%-44px)]">
        <div className="w-10 bg-gray-100 border-r border-gray-200" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Cargando editor…</p>
        </div>
      </div>
    </div>
  )
}
