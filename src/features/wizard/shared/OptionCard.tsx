'use client'

import React from 'react'

interface OptionCardProps {
  selected: boolean
  onClick: () => void
  /** Color del borde/fondo cuando está seleccionado — clases Tailwind */
  selectedClass?: string
  children: React.ReactNode
  /** Layout: 'row' para ícono + texto, 'center' para tarjeta centrada */
  layout?: 'row' | 'center'
}

/** Tarjeta seleccionable genérica. Se usa en todos los pasos de los 3 wizards. */
export function OptionCard({
  selected,
  onClick,
  selectedClass = 'border-blue-500 bg-blue-50',
  children,
  layout = 'row',
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all duration-150 active:scale-[0.98]
        ${layout === 'row' ? 'flex items-center gap-4 p-4' : 'flex flex-col items-center p-5'}
        ${selected ? `${selectedClass} border-2` : 'border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
    >
      {children}
      {selected && layout === 'row' && (
        <CheckIcon className="ml-auto flex-shrink-0 text-current w-5 h-5" />
      )}
    </button>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
      <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
