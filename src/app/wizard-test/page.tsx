'use client'

import React, { useState } from 'react'
import { ObraNuevaWizard } from '@/features/wizard/obra-nueva'

/**
 * Página de prueba temporal — accedé en http://localhost:3000/wizard-test
 * Borrar cuando el wizard esté integrado a la pantalla principal.
 */
export default function WizardTestPage() {
  const [rama, setRama] = useState<'obra-nueva' | null>(null)

  if (rama === 'obra-nueva') {
    return <ObraNuevaWizard />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Wizard — prueba</h1>
        <p className="text-sm text-gray-500 mb-6">Elegí la rama a testear</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setRama('obra-nueva')}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white
              font-medium rounded-xl transition-colors text-sm"
          >
            🏠 Obra Nueva
          </button>

          {/* Las otras dos ramas se agregan acá cuando estén listas */}
          <button disabled className="w-full py-3 px-4 bg-gray-100 text-gray-400 font-medium rounded-xl text-sm cursor-not-allowed">
            🔧 Refacción (próximamente)
          </button>
          <button disabled className="w-full py-3 px-4 bg-gray-100 text-gray-400 font-medium rounded-xl text-sm cursor-not-allowed">
            ➕ Ampliación (próximamente)
          </button>
        </div>
      </div>
    </div>
  )
}
