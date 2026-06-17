'use client'
import React from 'react'
import type { FormaPlanta } from '../types'
interface Props {
  value: FormaPlanta | null
  rotacion: number
  onChange: (v: FormaPlanta) => void
  onRotar: () => void
}
const SHAPES = [
  { id: 'rect',  name: 'Rectangular', desc: 'La mas comun',       path: 'M10,12 L70,12 L70,58 L10,58 Z' },
  { id: 'L',     name: 'Forma L',     desc: 'Un brazo recortado', path: 'M10,12 L70,12 L70,35 L42,35 L42,58 L10,58 Z' },
  { id: 'C',     name: 'Forma C',     desc: 'Muesca central',     path: 'M10,12 L70,12 L70,26 L34,26 L34,44 L70,44 L70,58 L10,58 Z' },
  { id: 'T',     name: 'Forma T',     desc: 'Tallo central',      path: 'M10,12 L70,12 L70,30 L46,30 L46,58 L34,58 L34,30 L10,30 Z' },
  { id: 'cruz',  name: 'Cruz',        desc: 'Cuatro brazos',      path: 'M28,12 L52,12 L52,28 L66,28 L66,42 L52,42 L52,58 L28,58 L28,42 L14,42 L14,28 L28,28 Z' },
  { id: 'libre', name: 'Forma libre', desc: 'Diseno propio',      path: null },
]
export function Step1Forma({ value, rotacion, onChange, onRotar }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-1">Que forma tiene la planta?</h2>
      <p className="text-sm text-gray-500 mb-5">Elegi la que mas se parece a tu casa</p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {SHAPES.map((s) => {
          const active = value === s.id
          return (
            <button key={s.id} type="button" onClick={() => onChange(s.id as FormaPlanta)}
              className={`flex flex-col items-center p-2.5 rounded-xl border transition-all active:scale-95 ${active ? 'border-2 border-amber-500 bg-amber-50' : 'border border-gray-200 bg-white hover:border-gray-300'}`}>
              <div style={{ width:60, height:54, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {s.id === 'libre' ? (
                  <svg viewBox="0 0 60 54" width="60" height="54">
                    <rect x="4" y="4" width="52" height="46" rx="6" fill={active ? '#FEF3C7' : '#F9FAFB'} stroke={active ? '#D97706' : '#D1D5DB'} strokeWidth="1.5" strokeDasharray="4 3"/>
                    <path d="M12,38 Q20,28 28,32 Q36,36 44,20" fill="none" stroke={active ? '#FCD34D' : '#E5E7EB'} strokeWidth="2.5" strokeLinecap="round"/>
                    <g transform="translate(38,16) rotate(40)">
                      <rect x="-4" y="-12" width="8" height="18" rx="1.5" fill={active ? '#D97706' : '#9CA3AF'}/>
                      <polygon points="-4,6 4,6 0,13" fill={active ? '#92400E' : '#6B7280'}/>
                      <rect x="-4" y="-15" width="8" height="4" rx="1" fill={active ? '#F59E0B' : '#D1D5DB'}/>
                    </g>
                  </svg>
                ) : (
                  <svg viewBox="0 0 80 70" width={active ? 60 : 54} height={active ? 54 : 48}
                    style={{ transform: active ? `rotate(${rotacion}deg)` : 'rotate(0deg)', transition: active ? 'transform 0.35s ease' : 'none' }}>
                    <path d={s.path!} fill={active ? '#FEF3C7' : '#F3F4F6'} stroke={active ? '#D97706' : '#9CA3AF'} strokeWidth="2.5" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <p className={`text-xs font-medium mt-1 text-center ${active ? 'text-amber-900' : 'text-gray-700'}`}>{s.name}</p>
              <p className="text-xs text-gray-400 text-center">{s.desc}</p>
            </button>
          )
        })}
      </div>
      {value && value !== 'libre' && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={onRotar}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm font-medium hover:bg-amber-100 active:scale-95 transition-all">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none"
              style={{ transform: `rotate(${rotacion}deg)`, transition: 'transform 0.35s ease' }}>
              <path d="M15.5 4.5A8 8 0 1 0 17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M17 5V10H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Rotar 90
          </button>
          <p className="text-xs text-gray-400">Posicion: {((rotacion % 360) + 360) % 360} grados</p>
        </div>
      )}
      {value === 'libre' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-xs text-amber-800">En el paso de dibujo vas a poder trazar la forma exacta desde cero.</p>
        </div>
      )}
    </div>
  )
}
