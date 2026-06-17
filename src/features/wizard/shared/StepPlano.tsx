'use client'

import React, { useRef, useState } from 'react'

interface StepPlanoProps {
  /**
   * 'ampliacion' | 'refaccion'
   * Cambia el texto de ayuda según el contexto.
   */
  context: 'ampliacion' | 'refaccion'
  plano: File | null
  onPlano: (file: File | null) => void
}

const COPY = {
  ampliacion: {
    title: 'Plano de la obra existente',
    subtitle: 'Subí el plano de lo que ya está construido. Lo verás translúcido debajo del dibujo para que puedas trazar la ampliación encima.',
    badge: 'Recomendado',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  refaccion: {
    title: 'Plano del espacio existente',
    subtitle: 'Subí el plano del sector que vas a refaccionar. Te va a ayudar a ubicar los muros y aberturas con precisión.',
    badge: 'Recomendado',
    badgeColor: 'bg-teal-100 text-teal-800',
  },
}

const ACCENT = {
  ampliacion: {
    border: 'border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: '#3B82F6',
    skipText: 'text-blue-600',
  },
  refaccion: {
    border: 'border-teal-400',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    icon: '#0F6E56',
    skipText: 'text-teal-600',
  },
}

export function StepPlano({ context, plano, onPlano }: StepPlanoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const copy = COPY[context]
  const accent = ACCENT[context]

  function handleFile(file: File | undefined) {
    if (!file) return
    const valid = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (valid) onPlano(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0])
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-2xl font-semibold text-gray-900">{copy.title}</h2>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${copy.badgeColor}`}>
          {copy.badge}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">{copy.subtitle}</p>

      {/* Zona de carga */}
      {!plano ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all
            ${dragOver ? `${accent.border} ${accent.bg}` : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}
        >
          <svg viewBox="0 0 64 64" width="52" height="52" fill="none" aria-hidden>
            <rect x="10" y="8" width="44" height="48" rx="4"
              stroke={dragOver ? accent.icon : '#9CA3AF'} strokeWidth="2"/>
            {/* Líneas de plano */}
            <line x1="18" y1="22" x2="46" y2="22" stroke={dragOver ? accent.icon : '#9CA3AF'} strokeWidth="1.5"/>
            <line x1="18" y1="30" x2="46" y2="30" stroke={dragOver ? accent.icon : '#9CA3AF'} strokeWidth="1.5"/>
            <line x1="18" y1="38" x2="34" y2="38" stroke={dragOver ? accent.icon : '#9CA3AF'} strokeWidth="1.5"/>
            <line x1="34" y1="22" x2="34" y2="38"  stroke={dragOver ? accent.icon : '#9CA3AF'} strokeWidth="1.5"/>
            {/* Flecha de subida */}
            <circle cx="46" cy="46" r="10" fill={dragOver ? accent.icon : '#E5E7EB'}/>
            <line x1="46" y1="50" x2="46" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M43 45l3-3 3 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>

          <div className="text-center">
            <p className={`text-sm font-medium ${dragOver ? accent.text : 'text-gray-700'}`}>
              {dragOver ? 'Soltá el archivo acá' : 'Subir plano'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF o imagen — arrastrá o hacé clic</p>
          </div>
        </div>
      ) : (
        /* Vista previa del archivo cargado */
        <div className={`p-4 rounded-2xl border-2 ${accent.border} ${accent.bg}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
              {plano.type === 'application/pdf' ? (
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
                  <rect x="4" y="2" width="18" height="28" rx="2" stroke={accent.icon} strokeWidth="1.5"/>
                  <line x1="8" y1="10" x2="18" y2="10" stroke={accent.icon} strokeWidth="1.5"/>
                  <line x1="8" y1="15" x2="18" y2="15" stroke={accent.icon} strokeWidth="1.5"/>
                  <line x1="8" y1="20" x2="14" y2="20" stroke={accent.icon} strokeWidth="1.5"/>
                  <path d="M18 22l6 6" stroke={accent.icon} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-hidden>
                  <rect x="2" y="4" width="28" height="24" rx="3" stroke={accent.icon} strokeWidth="1.5"/>
                  <circle cx="10" cy="13" r="3" stroke={accent.icon} strokeWidth="1.5"/>
                  <path d="M2 22l8-6 6 5 5-4 9 7" stroke={accent.icon} strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${accent.text}`}>{plano.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(plano.size / 1024).toFixed(0)} KB ·{' '}
                {plano.type === 'application/pdf' ? 'PDF' : 'Imagen'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPlano(null)}
              className="p-1.5 rounded-lg hover:bg-white transition-colors flex-shrink-0"
              aria-label="Quitar plano"
            >
              <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden>
                <path d="M6 6l8 8M14 6l-8 8" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-white/60 flex items-center gap-2">
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
              <circle cx="8" cy="8" r="7" stroke={accent.icon} strokeWidth="1.2"/>
              <path d="M8 5v4M8 11v.5" stroke={accent.icon} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className={`text-xs ${accent.text}`}>
              En el paso siguiente vas a ver este plano translúcido debajo del dibujo.
            </p>
          </div>
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleChange}
      />

      {/* Opción de saltar */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => onPlano(null)}
          className={`text-xs underline underline-offset-2 ${accent.skipText} opacity-70 hover:opacity-100 transition-opacity`}
        >
          Continuar sin plano — voy a dibujar desde cero
        </button>
      </div>
    </div>
  )
}
