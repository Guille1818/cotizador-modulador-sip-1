"use client";
// ================================================================
// ShapeSelector — src/features/engineering/components/ShapeSelector.tsx
// Archivo NUEVO. Reemplaza los 3 botones (□ L C) del ribbon.
//
// Uso en engineering-page.tsx:
//   import { ShapeSelector } from './ShapeSelector';
//   <ShapeSelector currentRecesses={project.recesses || []} onSelect={setShape} />
// ================================================================

import type { ShapeVariant, ShapeType } from '@/shared/types';

// ── Paths SVG (viewBox 0 0 20 20, un solo path sin solapamiento) ─────────────
const SHAPE_PATHS: Record<ShapeVariant, string> = {
  'rectangular': 'M2,2 L18,2 L18,18 L2,18 Z',

  // L — esquina recortada. Cada rotación 90° horario.
  'L-0':   'M2,2 L10,2 L10,10 L18,10 L18,18 L2,18 Z',   // esquina NE
  'L-90':  'M2,2 L18,2 L18,10 L10,10 L10,18 L2,18 Z',   // esquina SE
  'L-180': 'M2,2 L18,2 L18,18 L10,18 L10,10 L2,10 Z',   // esquina SW
  'L-270': 'M10,2 L18,2 L18,18 L2,18 L2,10 L10,10 Z',   // esquina NW

  // C — muesca centrada en una fachada. Cada rotación 90° horario.
  'C-0':   'M2,2 L18,2 L18,7 L10,7 L10,13 L18,13 L18,18 L2,18 Z',  // Este
  'C-90':  'M2,2 L18,2 L18,18 L7,18 L7,10 L13,10 L13,18 L2,18 Z',  // Sur  (corregido)
  'C-180': 'M2,2 L18,2 L18,18 L2,18 L2,13 L10,13 L10,7 L2,7 Z',   // Oeste
  'C-270': 'M2,2 L7,2 L7,10 L13,10 L13,2 L18,2 L18,18 L2,18 Z',   // Norte

  // T — tallo en un lado, barra en el opuesto. Cada rotación 90° horario.
  'T-0':   'M8,2 L12,2 L12,11 L18,11 L18,18 L2,18 L2,11 L8,11 Z',  // tallo N
  'T-90':  'M2,2 L8,2 L8,8 L18,8 L18,12 L8,12 L8,18 L2,18 Z',      // tallo E
  'T-180': 'M2,2 L18,2 L18,9 L12,9 L12,18 L8,18 L8,9 L2,9 Z',      // tallo S
  'T-270': 'M12,2 L18,2 L18,18 L12,18 L12,12 L2,12 L2,8 L12,8 Z',  // tallo W

  // Cruz — simétrica
  'cruz':  'M6,2 L14,2 L14,7 L18,7 L18,13 L14,13 L14,18 L6,18 L6,13 L2,13 L2,7 L6,7 Z',
};

const ANGLE_LABEL: Partial<Record<ShapeVariant, string>> = {
  'L-0': '0°', 'L-90': '90°', 'L-180': '180°', 'L-270': '270°',
  'C-0': '0°', 'C-90': '90°', 'C-180': '180°', 'C-270': '270°',
  'T-0': '0°', 'T-90': '90°', 'T-180': '180°', 'T-270': '270°',
};

const ROTATION_SEQ: Record<string, ShapeVariant[]> = {
  L: ['L-0', 'L-90', 'L-180', 'L-270'],
  C: ['C-0', 'C-90', 'C-180', 'C-270'],
  T: ['T-0', 'T-90', 'T-180', 'T-270'],
};

const TYPE_DEFAULT: Record<ShapeType, ShapeVariant> = {
  rectangular: 'rectangular',
  L: 'L-0', C: 'C-0', T: 'T-0', cruz: 'cruz',
};

// ── Detección de variante activa a partir de los recesos del store ────────────
function detectActive(
  recesses: { side: string; hideSideWall?: boolean; x?: number; width?: number }[]
): ShapeVariant {
  if (!recesses || recesses.length === 0) return 'rectangular';

  if (recesses.length === 1) {
    const r = recesses[0];
    if (r.hideSideWall) {
      // Determinar qué esquina por la posición x
      const isStart = (r.x ?? 0) < 0.1;
      if (r.side === 'Este')  return isStart ? 'L-0'   : 'L-90';
      if (r.side === 'Oeste') return isStart ? 'L-270' : 'L-180';
    } else {
      if (r.side === 'Este')  return 'C-0';
      if (r.side === 'Sur')   return 'C-90';
      if (r.side === 'Oeste') return 'C-180';
      if (r.side === 'Norte') return 'C-270';
    }
  }

  if (recesses.length === 2) {
    const [r0] = recesses;
    const sides = recesses.map(r => r.side);

    if (sides.every(s => s === 'Este' || s === 'Oeste')) {
      const isStart = (r0.x ?? 0) < 0.1;
      return isStart ? 'T-0' : 'T-180';
    }
    if (sides.every(s => s === 'Norte' || s === 'Sur')) {
      // Norte isAtEnd (x≈width) → T-90 | Norte isAtStart (x=0) → T-270
      const norteR = recesses.find(r => r.side === 'Norte');
      if (norteR) {
        const isEnd = (norteR.x ?? 0) > 0.5;
        return isEnd ? 'T-90' : 'T-270';
      }
    }
  }

  if (recesses.length === 4) return 'cruz';

  return 'rectangular';
}

// ── Ícono SVG ─────────────────────────────────────────────────────────────────
const ShapeIcon = ({ variant, size = 16 }: { variant: ShapeVariant; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
    <path d={SHAPE_PATHS[variant]} />
  </svg>
);

// ── Componente principal ──────────────────────────────────────────────────────
interface ShapeSelectorProps {
  currentRecesses: { side: string; hideSideWall?: boolean; x?: number; width?: number }[];
  onSelect: (variant: ShapeVariant) => void;
}

export const ShapeSelector = ({ currentRecesses, onSelect }: ShapeSelectorProps) => {
  const active     = detectActive(currentRecesses);
  const activeType: ShapeType =
    active === 'rectangular' ? 'rectangular'
    : active === 'cruz' ? 'cruz'
    : (active.split('-')[0] as ShapeType);

  const canRotate = activeType !== 'rectangular' && activeType !== 'cruz';
  const seq       = canRotate ? (ROTATION_SEQ[activeType] ?? []) : [];
  const rotIdx    = seq.indexOf(active as ShapeVariant);

  const rotate = () => {
    if (!canRotate || seq.length === 0) return;
    onSelect(seq[(rotIdx + 1) % seq.length]);
  };

  const on  = 'bg-indigo-50 border-indigo-500 text-indigo-600';
  const off = 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-400';
  const btn = 'rounded-lg border-2 flex items-center justify-center transition-all font-bold text-[10px]';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Planta:</span>

      {/* Rectangular */}
      <button
        title="Rectangular"
        onClick={() => onSelect('rectangular')}
        className={`h-8 w-8 ${btn} ${activeType === 'rectangular' ? on : off}`}
      >
        <ShapeIcon variant="rectangular" size={13} />
      </button>

      {/* L / C / T / Cruz */}
      {(['L', 'C', 'T', 'cruz'] as const).map(type => (
        <button
          key={type}
          title={type}
          onClick={() => activeType !== type && onSelect(TYPE_DEFAULT[type])}
          className={`h-8 px-2.5 ${btn} ${activeType === type ? on : off}`}
        >
          {type === 'cruz' ? '+' : type}
        </button>
      ))}

      {/* Separador + ícono activo + ángulo + botón rotar */}
      {activeType !== 'rectangular' && (
        <>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 h-8">
            <ShapeIcon variant={active} size={14} />
            {canRotate && (
              <span className="text-[9px] font-bold text-slate-400 tabular-nums min-w-[24px]">
                {ANGLE_LABEL[active] ?? ''}
              </span>
            )}
            {canRotate ? (
              <button
                onClick={rotate}
                title="Rotar 90°"
                className="text-indigo-500 hover:text-indigo-700 transition-colors ml-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 2v6h-6"/>
                  <path d="M21 13a9 9 0 1 1-3-7.7L21 8"/>
                </svg>
              </button>
            ) : (
              <span className="text-[9px] font-bold text-slate-400">sim.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
