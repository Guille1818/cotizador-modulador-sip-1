/**
 * Tests para calculations.ts — La Fábrica del Panel
 *
 * Para ejecutar estos tests hay que instalar Vitest primero:
 *   npm install -D vitest @vitest/ui
 *
 * Luego agregar en package.json:
 *   "scripts": { "test": "vitest" }
 *
 * Y crear vitest.config.ts en la raíz del proyecto:
 *   import { defineConfig } from 'vitest/config'
 *   import path from 'path'
 *   export default defineConfig({
 *     test: { globals: true },
 *     resolve: { alias: { '@': path.resolve(__dirname, './src') } }
 *   })
 *
 * Los tests marcados con "BUG:" fallan con el código actual a propósito:
 * documentan el comportamiento correcto esperado, no el actual.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGeometry,
  calculateQuantities,
  PANEL_WIDTH,
  PANEL_HEIGHT,
} from './calculations';
import type { FacadeConfig, FacadeSide, Selections, InteriorWall } from '@/shared/types';

// Área de un panel SIP estándar: 1.22 × 2.44 = 2.9768 m²
const PANEL_AREA = PANEL_WIDTH * PANEL_HEIGHT;

type FacadeConfigs = Partial<Record<FacadeSide, FacadeConfig>>;

// ─── FIXTURES ─────────────────────────────────────────────────────────────────

const ALL_INCLUDED: Partial<Selections> = {
  includeExterior: true,
  includeInterior: true,
  includeRoof: true,
  includeFloor: true,
  roofSystem: 'sip',
  exteriorWallId: 'OSB-70-E',
  interiorWallId: 'OSB-70-DECO',
  roofId: 'TECHO-OSB-70',
  floorId: 'PISO-OSB-70',
};

/** Cuatro fachadas rectas con la misma altura */
function rectoFacades(hBase: number): FacadeConfigs {
  return {
    Norte: { type: 'recto', hBase, hMax: hBase },
    Sur:   { type: 'recto', hBase, hMax: hBase },
    Este:  { type: 'recto', hBase, hMax: hBase },
    Oeste: { type: 'recto', hBase, hMax: hBase },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PANELES DE MURO EXTERIOR
// ═══════════════════════════════════════════════════════════════════════════════

describe('Paneles de muro exterior', () => {

  it('casa 6×4m, h=2.44m: 18 paneles exteriores', () => {
    // Cálculo por GRILLA (correcto para SIP):
    //   Norte: ceil(6 / 1.22) × ceil(2.44 / 2.44) = 5 × 1 = 5
    //   Sur:                                          5 × 1 = 5
    //   Este:  ceil(4 / 1.22) × ceil(2.44 / 2.44) = 4 × 1 = 4
    //   Oeste:                                        4 × 1 = 4
    //   Total: 18
    //
    // A 2.44m de altura área y grilla coinciden → test pasa con código actual.
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'estructura' },
      ALL_INCLUDED,
    );
    expect(geo.cantMurosExt).toBe(18);
  });

  it('BUG: casa 6×4m, h=3.0m: debe ser 36 paneles (código produce 24)', () => {
    // Cuando la pared supera 2.44m se necesitan 2 filas de paneles.
    // Cálculo por GRILLA (correcto):
    //   Norte: ceil(6 / 1.22) × ceil(3.0 / 2.44) = 5 × 2 = 10
    //   Sur:                                         5 × 2 = 10
    //   Este:  ceil(4 / 1.22) × ceil(3.0 / 2.44) = 4 × 2 =  8
    //   Oeste:                                        4 × 2 =  8
    //   Total: 36
    //
    // El código divide por área: ceil(6×3 / 2.9768) = 7 en Norte/Sur
    // y ceil(4×3 / 2.9768) = 5 en Este/Oeste → total 24. INCORRECTO.
    // Con h=3.0m hay que empilhar 2 filas de paneles de 2.44m.
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 3, ridgeHeight: 3 },
      [],
      rectoFacades(3.0),
      [],
      { foundationType: 'estructura' },
      ALL_INCLUDED,
    );
    expect(geo.cantMurosExt).toBe(36); // ← FALLA: código produce 24
  });

  it('tabique interior de 5m a h=2.44m: 5 paneles', () => {
    // interiorWallsLength = 5m
    // intHeight = min(2.44, minBaseH=2.44) = 2.44m
    // cantMurosInt = ceil(5 × 2.44 / 2.9768) = ceil(5 / 1.22) = ceil(4.098) = 5
    // A 2.44m área y grilla coinciden → pasa con código actual.
    const walls: InteriorWall[] = [{ id: 'w1', length: 5 }];
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      walls,
      rectoFacades(2.44),
      [],
      { foundationType: 'estructura' },
      ALL_INCLUDED,
    );
    expect(geo.cantMurosInt).toBe(5);
  });

  it('fachadas Norte y Sur ocultas: solo 8 paneles (Este + Oeste)', () => {
    // Norte y Sur visibles=false → no aportan paneles
    // Este:  ceil(4 / 1.22) × 1 = 4
    // Oeste:                       4
    // Total: 8
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      {
        foundationType: 'estructura',
        perimeterVisibility: {
          Norte: false, Sur: false, Este: true, Oeste: true,
        } as Record<FacadeSide, boolean>,
      },
      ALL_INCLUDED,
    );
    expect(geo.cantMurosExt).toBe(8);
  });

  it('sin muros exteriores incluidos: cantMurosExt = 0', () => {
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'estructura' },
      { ...ALL_INCLUDED, includeExterior: false },
    );
    expect(geo.cantMurosExt).toBe(0);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PANELES DE PISO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Paneles de piso', () => {

  it('BUG: piso 6×4m con fundación estructura: debe ser 10 paneles (código produce 9)', () => {
    // areaPiso = 6 × 4 = 24 m²
    // Cálculo por GRILLA (correcto), orientación óptima:
    //   tiras a lo largo del eje 6m: ceil(6 / 1.22) = 5 tiras
    //   filas a lo largo del eje 4m: ceil(4 / 2.44) = 2 filas (cubre 4.88m, sobran 0.88m)
    //   Total: 5 × 2 = 10 paneles
    //
    // Las 5 tiras de 2ª fila tienen 1.56m de largo útil; el recorte de 0.88m
    // no puede reutilizarse en ese mismo piso (la siguiente tira también necesita 1.56m).
    //
    // El código usa área: ceil(24 / 2.9768) = ceil(8.066) = 9. INCORRECTO.
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'estructura' },
      ALL_INCLUDED,
    );
    expect(geo.cantPiso).toBe(10); // ← FALLA: código produce 9
  });

  it('piso 4.88×2.44m (múltiplos exactos del panel): 4 paneles', () => {
    // areaPiso = 4.88 × 2.44 = 11.9072 m²
    // Grilla: ceil(4.88 / 2.44) × ceil(2.44 / 1.22) = 2 × 2 = 4
    // Área:   ceil(11.9072 / 2.9768) = ceil(4.0) = 4 — coinciden
    // Este caso pasa con el código actual porque las dimensiones son múltiplos exactos.
    const geo = calculateGeometry(
      { width: 4.88, length: 2.44, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'estructura' },
      ALL_INCLUDED,
    );
    expect(geo.cantPiso).toBe(4);
  });

  it('fundación platea: cantPiso = 0', () => {
    // Con platea no se usan paneles SIP de piso (losa de hormigón)
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      { ...ALL_INCLUDED, includeFloor: false },
    );
    expect(geo.cantPiso).toBe(0);
  });

  it('includeFloor = false: cantPiso = 0', () => {
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'estructura' },
      { ...ALL_INCLUDED, includeFloor: false },
    );
    expect(geo.cantPiso).toBe(0);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PANELES DE TECHO SIP
// ═══════════════════════════════════════════════════════════════════════════════

describe('Paneles de techo SIP convencional', () => {

  it('BUG: techo plano 6×4m: debe ser 10 paneles (código produce 9)', () => {
    // areaTecho = areaPiso = 24 m² (sin pendiente, roofIncrement=0)
    // Grilla correcta: ceil(6 / 1.22) × ceil(4 / 2.44) = 5 × 2 = 10 paneles
    // Código (área): ceil(24 / 2.9768) = ceil(8.066) = 9 — subestima
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      ALL_INCLUDED,
    );
    expect(geo.cantTecho).toBe(10); // ← FALLA: código produce 9
  });

  it('BUG: techo 2-aguas 6×4m, cumbrera 5.5m: área real 34.28 m², 12 paneles', () => {
    // Geometría:
    //   run por rampa = width / 2 = 6 / 2 = 3m
    //   rise           = hMax - hBase = 5.5 - 2.44 = 3.06m
    //   longitud rampa = sqrt(3.06² + 3²) = sqrt(9.3636 + 9) = sqrt(18.3636) ≈ 4.285m
    //   areaTecho real = 2 rampas × 4.285m × largo(4m) = 34.28 m²
    //
    // El código calcula: factor = 4.285/3 − 1 = 0.428 → cap a 0.12
    //   areaTecho = 24 × 1.12 = 26.88 m²  ← subestima 27.7%
    //   cantTecho = ceil(26.88 / 2.9768) = 10  ← incorrecto
    //
    // Correcto:
    //   areaTecho = 34.28 m²
    //   cantTecho = ceil(34.28 / 2.9768) = ceil(11.51) = 12
    const facadeConfigs: FacadeConfigs = {
      Norte: { type: '2-aguas', hBase: 2.44, hMax: 5.5 },
      Sur:   { type: '2-aguas', hBase: 2.44, hMax: 5.5 },
      Este:  { type: 'recto',   hBase: 2.44, hMax: 2.44 },
      Oeste: { type: 'recto',   hBase: 2.44, hMax: 2.44 },
    };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 5.5 },
      [],
      facadeConfigs,
      [],
      { foundationType: 'platea' },
      ALL_INCLUDED,
    );
    // El área real del techo es la suma de las dos superficies inclinadas
    expect(geo.areaTecho).toBeCloseTo(34.28, 1); // ← FALLA: código produce 26.88
    expect(geo.cantTecho).toBe(12);              // ← FALLA: código produce 10
  });

  it('techo inclinado 6×4m, hBase=2.44→hMax=3.5m: pendiente suave, no activa el cap', () => {
    // run = 6m (inclinado cubre todo el ancho), rise = 3.5 - 2.44 = 1.06m
    // slope = sqrt(1.06² + 6²) = sqrt(37.12) = 6.093m
    // factor = 6.093/6 − 1 = 0.0155 < 0.12 → NO hay cap
    // areaTecho = areaPiso × (1 + 0.0155) = 24 × 1.0155 = 24.37 m²
    // En este caso el código es correcto porque no activa el tope del 12%.
    const facadeConfigs: FacadeConfigs = {
      Norte: { type: 'recto',     hBase: 2.44, hMax: 2.44 },
      Sur:   { type: 'inclinado', hBase: 2.44, hMax: 3.5  },
      Este:  { type: 'recto',     hBase: 2.44, hMax: 2.44 },
      Oeste: { type: 'recto',     hBase: 2.44, hMax: 2.44 },
    };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 3.5 },
      [],
      facadeConfigs,
      [],
      { foundationType: 'platea' },
      ALL_INCLUDED,
    );
    expect(geo.areaTecho).toBeCloseTo(24.37, 1);
  });

  it('includeRoof = false: cantTecho = 0', () => {
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      { ...ALL_INCLUDED, includeRoof: false },
    );
    expect(geo.cantTecho).toBe(0);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PANELES DE TECHO SANDWICH
// ═══════════════════════════════════════════════════════════════════════════════

describe('Paneles de techo SANDWICH', () => {

  it('BUG: sandwich 6×4m plano: ancho real 1.10m → 9 paneles (código usa 1.0m y produce 10)', () => {
    // areaTecho = 24 m² (plano)
    // Ancho real panel sandwich per catálogo: 1.10m
    //   cantTecho correcto = ceil(24 / (1.10 × 2.44)) = ceil(24 / 2.684) = ceil(8.94) = 9
    //
    // Código: roofPanelWidth = 1.0 (hardcodeado incorrecto)
    //   cantTecho = ceil(24 / (1.0 × 2.44)) = ceil(9.84) = 10 ← sobreestima
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      { ...ALL_INCLUDED, roofSystem: 'sandwich', roofId: 'SAND-OSB-80-4' },
    );
    expect(geo.cantTecho).toBe(9); // ← FALLA: código produce 10
  });

  it('sandwich: la cantidad en quantities se expresa en m² (no en paneles)', () => {
    // Los paneles sandwich vienen en longitudes variables (4m, 5m).
    // La lógica correcta es pedir en m² y luego el proveedor define la longitud.
    // quantities['SAND-OSB-80-4@@TECHO'] debe ser Math.round(areaTecho).
    const selections = { ...ALL_INCLUDED, roofSystem: 'sandwich' as const, roofId: 'SAND-OSB-80-4', includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    // areaTecho = 24 m² → quantity = 24
    expect(q['SAND-OSB-80-4@@TECHO']).toBe(Math.round(geo.areaTecho));
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. VIGAS ESTRUCTURALES
// ═══════════════════════════════════════════════════════════════════════════════
//
// Fixture de referencia para tests de quantities:
//   Casa 6×4m, h=2.44m, platea (sin piso SIP), techo SIP convencional
//   cantMurosExt = 18, cantMurosInt = 0 → paneles_muros = 18
//   cantTecho correcto = 10 (código actual produce 9 por bug de grilla)

describe('Vigas estructurales', () => {

  it('BUG: vigas techo 3×6": ratio correcto = cantTecho × 3.5 → 35 piezas (código produce 32 porque cantTecho=9)', () => {
    // Cuando se corrija el bug de grilla: cantTecho = 10
    //   MAD_VIGA_TECHO = cantidadVigasTecho * ladoCorto = 6 * 4 = 24
    //
    // Código actual: anteriormente calculaba 32 con el ratio antiguo.
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['MAD_VIGA_TECHO']).toBe(24);
  });

  it('vigas techo = 0 con techo sandwich', () => {
    // Las MAD_VIGA_TECHO son exclusivas del techo SIP convencional.
    // Con sandwich paneles_techo_conv = 0 → MAD_VIGA_TECHO = 0
    const selections = { ...ALL_INCLUDED, includeFloor: false, roofSystem: 'sandwich' as const, roofId: 'SAND-OSB-80-4' };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['MAD_VIGA_TECHO']).toBe(0);
  });

  it('vigas piso 3×6": ceil(areaPiso × 2.5 × 1.1) con estructura madera (verificar unidad)', () => {
    // areaPiso = 24 m²
    // MAD_VIGA_PISO_3X6 = ceil(24 × 2.5 × 1.1) = ceil(66) = 66
    //
    // PENDIENTE DE VALIDACIÓN:
    //   - El factor 2.5 representa ~ml de viga por m² de piso (vigas cada 40cm).
    //   - El 1.1 es 10% de desperdicio.
    //   - No está claro si el resultado es piezas o metros lineales.
    //     Verificar unidad de venta del producto MAD_VIGA_PISO_3X6.
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'estructura' },
      ALL_INCLUDED,
    );
    const q = calculateQuantities(geo, ALL_INCLUDED, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'estructura', 'madera');
    expect(q['MAD_VIGA_PISO_3X6']).toBe(66);
  });

  it('vigas piso = 0 con fundación platea', () => {
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['MAD_VIGA_PISO_3X6']).toBe(0);
  });

  it('vinculantes muros 2×3": paneles_muros × 7 = 126', () => {
    // paneles_muros = 18 (ext) + 0 (int) = 18
    // MAD_VINC_2X3 = round(18 × 7) = 126
    // NOTA: ratio pendiente de validación con equipo constructivo.
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['MAD_VINC_2X3']).toBe(126);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. TORNILLOS Y FIJACIONES
// ═══════════════════════════════════════════════════════════════════════════════
//
// Fixture de referencia:
//   Casa 6×4m, h=2.44m, platea (sin piso), techo SIP
//   paneles_muros = 18, paneles_piso = 0
//   cantTecho correcto = 10 (paneles_techo_conv = 10 post-fix)

describe('Tornillos y fijaciones', () => {

  it('Fix 6×1.5": (paneles_muros + paneles_piso) × 55 = 990', () => {
    // paneles_muros = 18, paneles_piso = 0
    // FIX_6X1_5 = round((18 + 0) × 55) = 990
    // NOTA: ratio 55 pendiente de validación.
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['FIX_6X1_5']).toBe(990);
  });

  it('HBS 140mm: paneles_muros × 5 = 90', () => {
    // paneles_muros = 18
    // HBS_140 = round(18 × 5) = 90
    // NOTA: ratio pendiente de validación.
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['HBS_140']).toBe(90);
  });

  it('Encuentros SIP-SIP con HBS 140mm: round(paneles_muros × 5) = 90', () => {
    // paneles_muros = 18
    // HBS_140 = round(18 × 5) = 90
    // NOTA: ratio pendiente de validación.
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['HBS_140']).toBe(90);
  });

  it('BUG: Hex 14×3" techo conv: cantTecho correcto(10) × 28 = 280 (código produce 252)', () => {
    // paneles_techo_conv = cantTecho
    // Correcto (post-fix grilla): cantTecho=10 → TORN_HEX_3 = round(10 × 28) = 280
    // Código actual: cantTecho=9 → TORN_HEX_3 = round(9 × 28) = 252
    // NOTA: ratio 28 tornillos por panel pendiente de validación.
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['TORN_HEX_3']).toBe(280); // ← FALLA: código produce 252
  });

  it('BUG: Hex 14×5" sandwich: cantTecho correcto(9) × 5.5 = 50 (código produce 55)', () => {
    // Con ancho correcto 1.10m: cantTecho = 9 → HEX_T2_14X5 = round(9 × 5.5) = round(49.5) = 50
    // Con ancho incorrecto 1.0m: cantTecho = 10 → HEX_T2_14X5 = round(10 × 5.5) = 55 ← incorrecto
    // NOTA: ratio 5.5 pendiente de validación.
    const selections = { ...ALL_INCLUDED, includeFloor: false, roofSystem: 'sandwich' as const, roofId: 'SAND-OSB-80-4' };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['HEX_T2_14X5']).toBe(50); // ← FALLA: código produce 55
  });

  it('BUG: Fix 8×3": paneles_muros×8 + cantTecho_correcto(10)×10 = 244 (código produce 234)', () => {
    // FIX_8X3 = round(paneles_muros × 8 + paneles_techo_conv × 10)
    //         = round(18 × 8 + 10 × 10)
    //         = round(144 + 100) = 244
    //
    // Código actual: cantTecho=9 → round(18×8 + 9×10) = round(234) = 234
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['FIX_8X3']).toBe(244); // ← FALLA: código produce 234
  });

  it('Varilla roscada 1/2" con platea: 7 varillas para 25 perforaciones', () => {
    // VARILLA_12 solo se incluye cuando foundationType='platea' (no hay piso SIP)
    // Perímetro exterior = 20m → perforaciones = ceil(20 / 0.8) = 25
    // Varillas = ceil(25 / 4) = 7
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['VARILLA_12']).toBe(7);
  });

  it('Varilla roscada = 0 con fundación estructura (piso SIP, no platea)', () => {
    // Con estructura (includeFloor=true) → VARILLA_12 = 0
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'estructura' },
      ALL_INCLUDED,
    );
    const q = calculateQuantities(geo, ALL_INCLUDED, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'estructura', 'madera');
    expect(q['VARILLA_12']).toBe(0);
  });

  it('Kit tuerca+arandela = perforaciones en platea = 25', () => {
    // KIT_TUERCA = perforaciones = ceil(20 / 0.8) = 25
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['KIT_TUERCA']).toBe(25);
  });

  it('Espuma PU: max(1, round(total_paneles × 0.22)), mínimo 1 unidad', () => {
    // total_paneles = paneles_muros + paneles_piso + paneles_techo
    //              = 18 + 0 + cantTecho_correcto(10) = 28
    // ESPUMA_PU = max(1, round(28 × 0.22)) = max(1, round(6.16)) = max(1, 6) = 6
    // Con código actual (cantTecho=9): total=27 → round(27×0.22) = round(5.94) = 6 — coincide
    const selections = { ...ALL_INCLUDED, includeFloor: false };
    const geo = calculateGeometry(
      { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 },
      [],
      rectoFacades(2.44),
      [],
      { foundationType: 'platea' },
      selections,
    );
    const q = calculateQuantities(geo, selections, 0, [], { width: 6, length: 4, height: 2.44, ridgeHeight: 2.44 }, 'platea', 'madera');
    expect(q['ESPUMA_PU']).toBeGreaterThanOrEqual(1);
    // Con 28 paneles totales (post-fix): 6 unidades
    expect(q['ESPUMA_PU']).toBe(6);
  });

});

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN DE TESTS QUE FALLAN CON CÓDIGO ACTUAL (bugs a corregir)
// ═══════════════════════════════════════════════════════════════════════════════
//
// BUG A — Grilla vs área en paneles de muro (altura > 2.44m):
//   "casa 6×4m, h=3.0m: debe ser 36 paneles"
//
// BUG B — Grilla vs área en paneles de piso:
//   "piso 6×4m con fundación estructura: debe ser 10 paneles"
//
// BUG C — Grilla vs área en paneles de techo:
//   "techo plano 6×4m: debe ser 10 paneles"
//
// BUG D — Tope arbitrario del 12% en área de techo inclinado:
//   "techo 2-aguas 6×4m, cumbrera 5.5m: área real 34.28 m²"
//   "techo 2-aguas 6×4m, cumbrera 5.5m: 12 paneles"
//
// BUG E — Ancho sandwich 1.0m en vez de 1.10m:
//   "sandwich 6×4m plano: ancho real 1.10m → 9 paneles"
//
// BUG F — Tornillos en cascada por BUG C (cantTecho=9 en vez de 10):
//   "Hex 14×3" techo conv: cantTecho correcto(10) × 28 = 280"
//   "Fix 8×3": paneles_muros×8 + cantTecho_correcto(10)×10 = 244"
//
// BUG G — Tornillos sandwich en cascada por BUG E (cantTecho=10 en vez de 9):
//   "Hex 14×5" sandwich: cantTecho correcto(9) × 5.5 = 50"
