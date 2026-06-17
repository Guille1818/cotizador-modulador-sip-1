'use client'

import React from 'react'

interface WizardShellProps {
  /** Número del paso actual (base 1) */
  currentStep: number
  /** Total de pasos */
  totalSteps: number
  /** Etiquetas cortas de cada paso */
  stepLabels: string[]
  /** Nombre de la rama (ej. "Ampliación") */
  branchName: string
  /** Color de acento — clase Tailwind completa, ej. "bg-blue-600" */
  accentColor: string
  /** Texto del botón siguiente (por defecto "Continuar") */
  nextLabel?: string
  /** Se llama al presionar Continuar — debe retornar false para bloquear avance */
  onNext: () => boolean
  onBack: () => void
  /** Mensaje de error opcional */
  errorMessage?: string
  children: React.ReactNode
}

export function WizardShell({
  currentStep,
  totalSteps,
  stepLabels,
  branchName,
  accentColor,
  nextLabel = 'Continuar',
  onNext,
  onBack,
  errorMessage,
  children,
}: WizardShellProps) {
  const progressPct = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-800">
                Paso {currentStep} de {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {stepLabels[currentStep - 1]}
              </span>
            </div>
            <span className="text-xs text-gray-400 border border-gray-200 rounded-full px-2.5 py-1">
              {branchName}
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${accentColor}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Dots */}
          <div className="flex gap-1 mt-1.5">
            {stepLabels.map((_, i) => {
              const idx = i + 1
              const isActive = idx === currentStep
              const isDone = idx < currentStep
              return (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? `w-5 ${accentColor}`
                      : isDone
                      ? `w-1.5 ${accentColor} opacity-60`
                      : 'w-1.5 bg-gray-200'
                  }`}
                />
              )
            })}
          </div>
        </div>
      </header>

      {/* Contenido del paso */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">{children}</div>
      </main>

      {/* Footer de navegación */}
      <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            className={`px-4 py-2 text-sm font-medium text-gray-600 rounded-lg border border-gray-200
              hover:bg-gray-50 active:scale-95 transition-all
              ${currentStep === 1 ? 'invisible' : ''}`}
          >
            ← Volver
          </button>

          <span className="text-xs text-red-600 flex-1 text-center min-h-[1rem]">
            {errorMessage}
          </span>

          <button
            onClick={() => onNext()}
            className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg
              active:scale-95 transition-all shadow-sm
              ${accentColor} hover:opacity-90`}
          >
            {currentStep === totalSteps ? 'Ver presupuesto' : nextLabel} →
          </button>
        </div>
      </footer>
    </div>
  )
}
