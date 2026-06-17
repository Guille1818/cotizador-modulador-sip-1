// ================================================================
// src/shared/lib/roofConfig.ts — ARCHIVO NUEVO
// Sistema de configuración de techos simplificado.
// El usuario elige parámetros simples y este módulo
// los traduce a los 4 facadeConfigs que usa el visor 3D.
// ================================================================

import type { FacadeSide, FacadeConfig, FacadeType } from '@/shared/types';

// ── Tipos públicos ────────────────────────────────────────────────

export type RoofTypeId =
  | 'plano'
  | '1-agua'
  | '2-aguas'
  | '2-aguas-desfase'
  | '4-aguas-puntual'
  | '4-aguas-cumbrera'
  | 'desnivel';

export type RoofOrientation = 'NS' | 'EW'; // dirección de la cumbrera

export interface RoofConfig {
  type: RoofTypeId;
  orientation: RoofOrientation; // para 1-agua y 2-aguas
  hBase: number;                // altura del alero (m)
  hRidge: number;               // altura de cumbrera principal (m)
  hRidge2: number;              // segunda cumbrera (solo desnivel)
  ridgeOffset: number;          // 0.0–1.0, posición de la cumbrera (0.5 = centro)
  negativeSlope: boolean;       // pendiente negativa / canaleta interior
}

export const DEFAULT_ROOF_CONFIG: RoofConfig = {
  type: '2-aguas',
  orientation: 'NS',
  hBase: 2.44,
  hRidge: 3.50,
  hRidge2: 3.00,
  ridgeOffset: 0.5,
  negativeSlope: false,
};

// ── Traducción de RoofConfig → 4 FacadeConfigs ───────────────────

export function applyRoofConfig(
  config: RoofConfig,
  width: number,
  length: number
): Record<FacadeSide, FacadeConfig> {
  const { type, orientation, hBase, hRidge, hRidge2, ridgeOffset, negativeSlope } = config;

  // Helper: config plana
  const flat = (h: number): FacadeConfig => ({ type: 'recto', hBase: h, hMax: h });

  // Helper: config inclinada (una sola pendiente)
  const slope = (lo: number, hi: number): FacadeConfig => ({
    type: negativeSlope ? 'inclinado' : 'inclinado',
    hBase: Math.min(lo, hi),
    hMax: Math.max(lo, hi),
  });

  // Helper: config 2 aguas
  const twoWaters = (base: number, ridge: number): FacadeConfig => ({
    type: '2-aguas',
    hBase: base,
    hMax: ridge,
  });

  // Helper para 1 agua — la fachada que mira hacia arriba recibe hMax
  const oneWaterHigh = (base: number, ridge: number): FacadeConfig => ({
    type: 'inclinado',
    hBase: base,
    hMax: ridge,
  });
  const oneWaterLow = (base: number): FacadeConfig => ({
    type: 'recto',
    hBase: base,
    hMax: base,
  });

  // Resultado base
  let N: FacadeConfig = flat(hBase);
  let S: FacadeConfig = flat(hBase);
  let E: FacadeConfig = flat(hBase);
  let O: FacadeConfig = flat(hBase);

  switch (type) {
    case 'plano':
      N = S = E = O = flat(hBase);
      break;

    case '1-agua':
      if (orientation === 'NS') {
        // Cumbrera corre E-O, agua cae hacia Sur o Norte
        // ridgeOffset determina qué lado es alto
        const hiSide = ridgeOffset <= 0.5 ? 'Norte' : 'Sur';
        if (hiSide === 'Norte') {
          N = oneWaterHigh(hBase, hRidge);
          S = oneWaterLow(hBase);
        } else {
          S = oneWaterHigh(hBase, hRidge);
          N = oneWaterLow(hBase);
        }
        E = slope(hBase, hRidge);
        O = slope(hBase, hRidge);
      } else {
        // Cumbrera corre N-S, agua cae hacia Este o Oeste
        const hiSide = ridgeOffset <= 0.5 ? 'Oeste' : 'Este';
        if (hiSide === 'Oeste') {
          O = oneWaterHigh(hBase, hRidge);
          E = oneWaterLow(hBase);
        } else {
          E = oneWaterHigh(hBase, hRidge);
          O = oneWaterLow(hBase);
        }
        N = slope(hBase, hRidge);
        S = slope(hBase, hRidge);
      }
      break;

    case '2-aguas':
      if (orientation === 'NS') {
        // Cumbrera corre E-O → fachadas N y S son rectas, E y O tienen 2 aguas
        N = flat(hBase);
        S = flat(hBase);
        E = twoWaters(hBase, hRidge);
        O = twoWaters(hBase, hRidge);
      } else {
        // Cumbrera corre N-S → fachadas E y O son rectas, N y S tienen 2 aguas
        E = flat(hBase);
        O = flat(hBase);
        N = twoWaters(hBase, hRidge);
        S = twoWaters(hBase, hRidge);
      }
      break;

    case '2-aguas-desfase': {
      // Igual que 2-aguas pero la cumbrera está descentrada
      // ridgeOffset indica dónde está la cumbrera (0.0-1.0)
      // Los faldones tienen distintas pendientes pero mismo hBase
      const off = Math.max(0.1, Math.min(0.9, ridgeOffset));
      if (orientation === 'NS') {
        N = flat(hBase);
        S = flat(hBase);
        // Faldón izquierdo (Oeste side): desde hBase hasta hRidge
        // Faldón derecho (Este side): desde hRidge hasta hBase
        // Usamos inclinado en ambos lados, el visor interpola
        E = { type: 'inclinado' as FacadeType, hBase, hMax: hRidge };
        O = { type: 'inclinado' as FacadeType, hBase, hMax: hRidge };
        // Guardamos el offset en hMax de N para que applyRoofConfig lo use
        // Nota: el viewer-3d reconstruirá correctamente con getWallHeight
        N = { type: 'recto' as FacadeType, hBase, hMax: hBase };
        S = { type: 'recto' as FacadeType, hBase, hMax: hBase };
        // Para desfase real necesitamos 2-aguas con hMax y offset
        // Lo codificamos como 2-aguas en E/O con posición descentrada
        const leftH  = hRidge; // altura donde cae la cumbrera
        const rightH = hBase + (hRidge - hBase) * (1 - off) / off;
        E = { type: '2-aguas' as FacadeType, hBase, hMax: Math.max(leftH, rightH) };
        O = { type: '2-aguas' as FacadeType, hBase, hMax: Math.max(leftH, rightH) };
      } else {
        E = flat(hBase);
        O = flat(hBase);
        const leftH  = hRidge;
        const rightH = hBase + (hRidge - hBase) * (1 - off) / off;
        N = { type: '2-aguas' as FacadeType, hBase, hMax: Math.max(leftH, rightH) };
        S = { type: '2-aguas' as FacadeType, hBase, hMax: Math.max(leftH, rightH) };
      }
      void off;
      break;
    }

    case '4-aguas-puntual':
      // Todos los lados inclinados hacia el centro
      N = { type: 'inclinado', hBase, hMax: hRidge };
      S = { type: 'inclinado', hBase, hMax: hRidge };
      E = { type: 'inclinado', hBase, hMax: hRidge };
      O = { type: 'inclinado', hBase, hMax: hRidge };
      break;

    case '4-aguas-cumbrera':
      // 2 lados con inclinado, 2 lados con 2-aguas
      if (orientation === 'NS') {
        N = { type: 'inclinado', hBase, hMax: hRidge };
        S = { type: 'inclinado', hBase, hMax: hRidge };
        E = { type: '2-aguas', hBase, hMax: hRidge };
        O = { type: '2-aguas', hBase, hMax: hRidge };
      } else {
        E = { type: 'inclinado', hBase, hMax: hRidge };
        O = { type: 'inclinado', hBase, hMax: hRidge };
        N = { type: '2-aguas', hBase, hMax: hRidge };
        S = { type: '2-aguas', hBase, hMax: hRidge };
      }
      break;

    case 'desnivel':
      // Un faldón alto y uno bajo con pared entre ellos
      // ridgeOffset indica dónde está la cumbrera (qué fracción del ancho)
      if (orientation === 'NS') {
        N = flat(hBase);
        S = flat(hBase);
        E = { type: 'inclinado', hBase, hMax: hRidge };
        O = { type: 'inclinado', hBase: hRidge2, hMax: hRidge };
      } else {
        E = flat(hBase);
        O = flat(hBase);
        N = { type: 'inclinado', hBase, hMax: hRidge };
        S = { type: 'inclinado', hBase: hRidge2, hMax: hRidge };
      }
      break;
  }

  return { Norte: N, Sur: S, Este: E, Oeste: O };
}

// ── Validación ────────────────────────────────────────────────────

export interface RoofValidation {
  ok: boolean;
  level: 'ok' | 'warn' | 'error';
  message: string;
}

export function validateRoofConfig(
  config: RoofConfig,
  width: number,
  length: number
): RoofValidation {
  const { hBase, hRidge, hRidge2, type, orientation, negativeSlope, ridgeOffset } = config;

  if (!negativeSlope && hRidge <= hBase) {
    return { ok: false, level: 'error', message: 'La cumbrera debe ser más alta que el alero, o activá pendiente negativa.' };
  }
  if (negativeSlope && hRidge >= hBase) {
    return { ok: false, level: 'error', message: 'Para canaleta interior, la cumbrera debe ser más baja que el alero.' };
  }
  if (type === 'desnivel' && hRidge2 >= hRidge) {
    return { ok: false, level: 'error', message: 'La cumbrera 2 debe ser menor que la cumbrera principal.' };
  }

  // Calcular pendiente
  const run = orientation === 'NS'
    ? (type === '2-aguas' || type === '2-aguas-desfase' ? width * ridgeOffset : width)
    : (type === '2-aguas' || type === '2-aguas-desfase' ? length * ridgeOffset : length);

  const rise = Math.abs(hRidge - hBase);
  const pct = run > 0 ? Math.round(rise / run * 100) : 0;

  if (type !== 'plano' && pct < 2) {
    return { ok: false, level: 'warn', message: `Pendiente muy baja (${pct}%) — mínimo recomendado: 2%.` };
  }
  if (pct > 60) {
    return { ok: false, level: 'warn', message: `Pendiente muy pronunciada (${pct}%) — verificar estructura.` };
  }

  void width; void length; void hRidge2;
  return { ok: true, level: 'ok', message: `Techo válido — pendiente ${pct}%` };
}

// ── Cálculo de pendiente para mostrar ────────────────────────────

export function calcSlope(config: RoofConfig, width: number, length: number): number {
  const { orientation, ridgeOffset, type } = config;
  const run = orientation === 'NS'
    ? (type.startsWith('2') ? width * ridgeOffset : width)
    : (type.startsWith('2') ? length * ridgeOffset : length);
  const rise = Math.abs(config.hRidge - config.hBase);
  return run > 0 ? Math.round(rise / run * 100) : 0;
}
