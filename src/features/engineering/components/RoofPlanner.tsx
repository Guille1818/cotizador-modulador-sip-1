"use client";
// ================================================================
// RoofPlanner — src/features/engineering/components/RoofPlanner.tsx
// ARCHIVO NUEVO
// Panel visual de configuración de techos.
// Reemplaza los 4 selectores de fachada individuales.
// ================================================================

import React, { useState } from 'react';
import type { RoofConfig, RoofTypeId, RoofOrientation } from '@/shared/lib/roofConfig';
import { validateRoofConfig, calcSlope } from '@/shared/lib/roofConfig';

// ── Íconos SVG de tipo de techo (vista en corte) ─────────────────
const ROOF_ICONS: Record<RoofTypeId, React.ReactNode> = {
  'plano': (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <line x1="4" y1="20" x2="44" y2="20" stroke="currentColor" strokeWidth="2"/>
      <rect x="4" y="20" width="40" height="6" fill="currentColor" opacity=".15"/>
    </svg>
  ),
  '1-agua': (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <polygon points="4,24 44,24 44,6" fill="currentColor" opacity=".2"/>
      <line x1="4" y1="24" x2="44" y2="6" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  '2-aguas': (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <polygon points="4,24 24,6 44,24" fill="currentColor" opacity=".2"/>
      <line x1="4" y1="24" x2="24" y2="6" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="6" x2="44" y2="24" stroke="currentColor" strokeWidth="2"/>
      <line x1="24" y1="6" x2="24" y2="24" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity=".5"/>
    </svg>
  ),
  '2-aguas-desfase': (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <polygon points="4,24 16,6 44,24" fill="currentColor" opacity=".2"/>
      <line x1="4" y1="24" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
      <line x1="16" y1="6" x2="44" y2="24" stroke="currentColor" strokeWidth="2"/>
      <line x1="16" y1="6" x2="16" y2="24" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity=".5"/>
    </svg>
  ),
  '4-aguas-puntual': (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <polygon points="4,24 44,24 24,8" fill="currentColor" opacity=".2"/>
      <polygon points="4,4 44,4 24,8" fill="currentColor" opacity=".1"/>
      <line x1="4" y1="24" x2="24" y2="8" stroke="currentColor" strokeWidth="2"/>
      <line x1="44" y1="24" x2="24" y2="8" stroke="currentColor" strokeWidth="2"/>
      <line x1="4" y1="4" x2="24" y2="8" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
      <line x1="44" y1="4" x2="24" y2="8" stroke="currentColor" strokeWidth="1.5" opacity=".5"/>
    </svg>
  ),
  '4-aguas-cumbrera': (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <polygon points="4,24 44,24 36,8 12,8" fill="currentColor" opacity=".2"/>
      <line x1="4" y1="24" x2="12" y2="8" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="8" x2="36" y2="8" stroke="currentColor" strokeWidth="2"/>
      <line x1="36" y1="8" x2="44" y2="24" stroke="currentColor" strokeWidth="2"/>
      <line x1="12" y1="8" x2="12" y2="24" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity=".4"/>
      <line x1="36" y1="8" x2="36" y2="24" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity=".4"/>
    </svg>
  ),
  'desnivel': (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <polygon points="4,24 4,14 18,6 44,24" fill="currentColor" opacity=".2"/>
      <line x1="4" y1="14" x2="18" y2="6" stroke="currentColor" strokeWidth="2"/>
      <line x1="18" y1="6" x2="44" y2="24" stroke="currentColor" strokeWidth="2"/>
      <rect x="17" y="6" width="4" height="18" fill="currentColor" opacity=".3"/>
      <line x1="4" y1="14" x2="4" y2="24" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
};

const ROOF_LABELS: Record<RoofTypeId, string> = {
  'plano':            'Plano',
  '1-agua':           '1 Agua',
  '2-aguas':          '2 Aguas',
  '2-aguas-desfase':  '2 Aguas\nDesfasadas',
  '4-aguas-puntual':  '4 Aguas\nPuntual',
  '4-aguas-cumbrera': '4 Aguas\nCumbrera',
  'desnivel':         'Desnivel\n/ Vano',
};

// ── Vista en planta del techo ─────────────────────────────────────
const RoofPlanView = ({
  config, width, length
}: { config: RoofConfig; width: number; length: number }) => {
  const PX = 16, PY = 16, PW = 160, PH = 100;
  const { type, orientation, ridgeOffset } = config;
  const warm = '#F0997B', cool = '#9FE1CB', purple = '#534AB7';

  const poly = (pts: number[][], fill: string, op = 0.7) =>
    `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill}" opacity="${op}"/>`;

  let content = '';

  if (type === 'plano') {
    content = poly([[PX,PY],[PX+PW,PY],[PX+PW,PY+PH],[PX,PY+PH]], '#9ca3af', 0.3);
  } else if (type === '1-agua') {
    content = poly([[PX,PY],[PX+PW,PY],[PX+PW,PY+PH],[PX,PY+PH]], warm, 0.4);
    if (orientation === 'NS') {
      const lx = PX + PW * ridgeOffset;
      content += `<line x1="${lx}" y1="${PY}" x2="${lx}" y2="${PY+PH}" stroke="${purple}" stroke-width="2" stroke-dasharray="5 3"/>`;
      content += `<circle cx="${lx}" cy="${PY+PH/2}" r="4" fill="#D85A30"/>`;
    } else {
      const ly = PY + PH * ridgeOffset;
      content += `<line x1="${PX}" y1="${ly}" x2="${PX+PW}" y2="${ly}" stroke="${purple}" stroke-width="2" stroke-dasharray="5 3"/>`;
      content += `<circle cx="${PX+PW/2}" cy="${ly}" r="4" fill="#D85A30"/>`;
    }
  } else if (type === '2-aguas' || type === '2-aguas-desfase') {
    const off = type === '2-aguas' ? 0.5 : ridgeOffset;
    if (orientation === 'NS') {
      const rx = PX + PW * off;
      content += poly([[PX,PY],[rx,PY],[rx,PY+PH],[PX,PY+PH]], warm, 0.6);
      content += poly([[rx,PY],[PX+PW,PY],[PX+PW,PY+PH],[rx,PY+PH]], cool, 0.6);
      content += `<line x1="${rx}" y1="${PY}" x2="${rx}" y2="${PY+PH}" stroke="${purple}" stroke-width="2" stroke-dasharray="5 3"/>`;
      content += `<circle cx="${rx}" cy="${PY+PH/2}" r="4" fill="#D85A30"/>`;
    } else {
      const ry = PY + PH * off;
      content += poly([[PX,PY],[PX+PW,PY],[PX+PW,ry],[PX,ry]], warm, 0.6);
      content += poly([[PX,ry],[PX+PW,ry],[PX+PW,PY+PH],[PX,PY+PH]], cool, 0.6);
      content += `<line x1="${PX}" y1="${ry}" x2="${PX+PW}" y2="${ry}" stroke="${purple}" stroke-width="2" stroke-dasharray="5 3"/>`;
      content += `<circle cx="${PX+PW/2}" cy="${ry}" r="4" fill="#D85A30"/>`;
    }
  } else if (type === '4-aguas-puntual') {
    const cx = PX+PW/2, cy = PY+PH/2;
    content += poly([[PX,PY],[PX+PW,PY],[cx,cy]], cool, 0.6);
    content += poly([[PX+PW,PY],[PX+PW,PY+PH],[cx,cy]], warm, 0.6);
    content += poly([[PX+PW,PY+PH],[PX,PY+PH],[cx,cy]], cool, 0.6);
    content += poly([[PX,PY+PH],[PX,PY],[cx,cy]], warm, 0.6);
    content += `<circle cx="${cx}" cy="${cy}" r="5" fill="#D85A30"/>`;
  } else if (type === '4-aguas-cumbrera') {
    const ofs = 0.22;
    const rx1=PX+PW*ofs, rx2=PX+PW*(1-ofs), ry1=PY+PH*ofs, ry2=PY+PH*(1-ofs);
    content += poly([[PX,PY],[PX+PW,PY],[rx2,ry1],[rx1,ry1]], cool, 0.6);
    content += poly([[PX+PW,PY],[PX+PW,PY+PH],[rx2,ry2],[rx2,ry1]], warm, 0.6);
    content += poly([[PX+PW,PY+PH],[PX,PY+PH],[rx1,ry2],[rx2,ry2]], cool, 0.6);
    content += poly([[PX,PY+PH],[PX,PY],[rx1,ry1],[rx1,ry2]], warm, 0.6);
    content += `<line x1="${rx1}" y1="${ry1}" x2="${rx2}" y2="${ry1}" stroke="${purple}" stroke-width="2" stroke-dasharray="4 2"/>`;
    content += `<line x1="${rx1}" y1="${ry2}" x2="${rx2}" y2="${ry2}" stroke="${purple}" stroke-width="2" stroke-dasharray="4 2"/>`;
    if (orientation === 'NS') {
      content += `<line x1="${rx1}" y1="${ry1}" x2="${rx1}" y2="${ry2}" stroke="${purple}" stroke-width="2" stroke-dasharray="4 2"/>`;
      content += `<line x1="${rx2}" y1="${ry1}" x2="${rx2}" y2="${ry2}" stroke="${purple}" stroke-width="2" stroke-dasharray="4 2"/>`;
    }
  } else if (type === 'desnivel') {
    const split = orientation === 'NS' ? PX + PW * ridgeOffset : PY + PH * ridgeOffset;
    if (orientation === 'NS') {
      content += poly([[PX,PY],[split,PY],[split,PY+PH],[PX,PY+PH]], warm, 0.6);
      content += poly([[split,PY],[PX+PW,PY],[PX+PW,PY+PH],[split,PY+PH]], cool, 0.6);
      content += `<rect x="${split-3}" y="${PY}" width="6" height="${PH}" fill="#888" opacity=".5"/>`;
    } else {
      content += poly([[PX,PY],[PX+PW,PY],[PX+PW,split],[PX,split]], warm, 0.6);
      content += poly([[PX,split],[PX+PW,split],[PX+PW,PY+PH],[PX,PY+PH]], cool, 0.6);
      content += `<rect x="${PX}" y="${split-3}" width="${PW}" height="6" fill="#888" opacity=".5"/>`;
    }
  }

  const svg = `<svg width="192" height="132" viewBox="0 0 192 132" xmlns="http://www.w3.org/2000/svg">
    ${content}
    <rect x="${PX}" y="${PY}" width="${PW}" height="${PH}" rx="2" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="${PX+PW/2}" y="${PY-5}" font-size="8" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">N</text>
    <text x="${PX+PW/2}" y="${PY+PH+11}" font-size="8" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">S</text>
    <text x="${PX-6}" y="${PY+PH/2+3}" font-size="8" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">O</text>
    <text x="${PX+PW+7}" y="${PY+PH/2+3}" font-size="8" text-anchor="middle" fill="#94a3b8" font-family="sans-serif">E</text>
  </svg>`;

  void width; void length;
  return <div dangerouslySetInnerHTML={{ __html: svg }} />;
};

// ── Componente principal ──────────────────────────────────────────

interface RoofPlannerProps {
  config: RoofConfig;
  onChange: (updates: Partial<RoofConfig>) => void;
  width: number;
  length: number;
}

export const RoofPlanner = ({ config: configProp, onChange, width, length }: RoofPlannerProps) => {
  const config = {
    type: (configProp?.type ?? '2-aguas') as RoofTypeId,
    orientation: (configProp?.orientation ?? 'NS') as RoofOrientation,
    hBase: Number(configProp?.hBase) || 2.44,
    hRidge: Number(configProp?.hRidge) || 3.50,
    hRidge2: Number(configProp?.hRidge2) || 3.00,
    ridgeOffset: Number(configProp?.ridgeOffset) || 0.5,
    negativeSlope: configProp?.negativeSlope ?? false,
  };
  const safeConfig = config;
  const [expanded, setExpanded] = useState(false);
  const validation = validateRoofConfig(safeConfig, width, length);
  const slope = calcSlope(safeConfig, width, length);

  const types: RoofTypeId[] = [
    'plano', '1-agua', '2-aguas', '2-aguas-desfase',
    '4-aguas-puntual', '4-aguas-cumbrera', 'desnivel'
  ];

  const show4aguas = config.type === '4-aguas-puntual' || config.type === '4-aguas-cumbrera';
  const showOffset = config.type === '2-aguas-desfase' || config.type === '1-agua' || config.type === 'desnivel';
  const showRidge2 = config.type === 'desnivel';
  const showOrient = !show4aguas;

  const on  = 'bg-indigo-50 border-indigo-500 text-indigo-600';
  const off = 'border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-400';
  const btn = 'rounded-lg border-2 flex items-center justify-center transition-all';

  const valColor = validation.level === 'error' ? 'bg-red-50 border-red-300 text-red-700'
    : validation.level === 'warn' ? 'bg-amber-50 border-amber-300 text-amber-700'
    : 'bg-emerald-50 border-emerald-300 text-emerald-700';

  return (
    <div className="flex flex-col gap-2">
      {/* Header con resumen */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Techo:</span>

        {/* Tipo activo — botón para expandir */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-2 h-8 px-3 ${btn} ${expanded ? on : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-300'}`}
        >
          <span className="text-indigo-500">{ROOF_ICONS[config.type]}</span>
          <span className="text-[10px] font-bold whitespace-nowrap">
            {ROOF_LABELS[config.type].replace('\n', ' ')}
          </span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <path d="M1 3l4 4 4-4"/>
          </svg>
        </button>

        {/* Orientación rápida */}
        {showOrient && !show4aguas && (
          <div className="flex gap-1">
            <button
              onClick={() => onChange({ orientation: 'NS' })}
              className={`h-8 px-2 text-[10px] font-bold ${btn} ${config.orientation === 'NS' ? on : off}`}
              title="Cumbrera Norte-Sur"
            >↑↓</button>
            <button
              onClick={() => onChange({ orientation: 'EW' })}
              className={`h-8 px-2 text-[10px] font-bold ${btn} ${config.orientation === 'EW' ? on : off}`}
              title="Cumbrera Este-Oeste"
            >←→</button>
          </div>
        )}

        {/* Pendiente negativa */}
        {config.type !== 'plano' && (
          <button
            onClick={() => onChange({ negativeSlope: !config.negativeSlope })}
            className={`h-8 px-2 text-[10px] font-bold ${btn} ${config.negativeSlope ? 'bg-amber-50 border-amber-400 text-amber-700' : off}`}
            title="Pendiente negativa / canaleta interior"
          >⬇ canaleta</button>
        )}

        {/* Pendiente display */}
        <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-lg px-2 h-8">
          <span className="text-[10px] text-slate-400 font-medium">Pend.</span>
          <span className="text-sm font-black text-slate-700 tabular-nums">
            {config.negativeSlope ? '-' : ''}{slope}%
          </span>
        </div>
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col gap-3">
          {/* Tipos de techo */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo</div>
            <div className="flex flex-wrap gap-1.5">
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => onChange({ type: t })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${config.type === t ? on : off}`}
                >
                  <span className={config.type === t ? 'text-indigo-500' : 'text-slate-400'}>
                    {ROOF_ICONS[t]}
                  </span>
                  <span className="text-[8px] font-bold text-center leading-tight whitespace-pre">
                    {ROOF_LABELS[t]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Vista en planta */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vista en planta</div>
              <div className="bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center">
                <RoofPlanView config={config} width={width} length={length} />
              </div>
            </div>

            {/* Controles de altura */}
            <div className="flex flex-col gap-2">
              {showOrient && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Orientación</div>
                  <div className="flex gap-1">
                    <button onClick={() => onChange({ orientation: 'NS' })} className={`flex-1 h-7 text-[10px] font-bold ${btn} ${config.orientation === 'NS' ? on : off}`}>↑ N–S ↓</button>
                    <button onClick={() => onChange({ orientation: 'EW' })} className={`flex-1 h-7 text-[10px] font-bold ${btn} ${config.orientation === 'EW' ? on : off}`}>← E–O →</button>
                  </div>
                </div>
              )}

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Alero: <span className="text-slate-700">{safeConfig.hBase.toFixed(2)}m</span>
                </div>
                <input type="range" min="200" max="500" step="5"
                  value={Math.round(safeConfig.hBase * 100)}
                  onChange={e => onChange({ hBase: +e.target.value / 100 })}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Cumbrera: <span className="text-slate-700">{config.hRidge.toFixed(2)}m</span>
                </div>
                <input type="range" min="200" max="700" step="5"
                  value={Math.round(config.hRidge * 100)}
                  onChange={e => onChange({ hRidge: +e.target.value / 100 })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {showRidge2 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Cumbrera 2: <span className="text-slate-700">{config.hRidge2.toFixed(2)}m</span>
                  </div>
                  <input type="range" min="200" max="600" step="5"
                    value={Math.round(config.hRidge2 * 100)}
                    onChange={e => onChange({ hRidge2: +e.target.value / 100 })}
                    className="w-full accent-indigo-500"
                  />
                </div>
              )}

              {showOffset && (
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Posición: <span className="text-slate-700">{Math.round(config.ridgeOffset * 100)}%</span>
                  </div>
                  <input type="range" min="10" max="90" step="5"
                    value={Math.round(config.ridgeOffset * 100)}
                    onChange={e => onChange({ ridgeOffset: +e.target.value / 100 })}
                    className="w-full accent-indigo-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Validación */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-medium ${valColor}`}>
            <span>{validation.level === 'ok' ? '✓' : validation.level === 'warn' ? '⚠' : '✕'}</span>
            <span>{validation.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
