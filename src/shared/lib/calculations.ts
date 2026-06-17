import type {
  Dimensions,
  InteriorWall,
  FacadeSide,
  FacadeConfig,
  Opening,
  Project,
  Selections,
  GeometryResult,
  FacadeStats,
  Product,
  Recess,
} from '@/shared/types';
import { INITIAL_PRICES } from '@/shared/lib/constants';

export const PANEL_WIDTH = 1.22;
export const PANEL_HEIGHT = 2.44;

type FacadeConfigs = Partial<Record<FacadeSide, FacadeConfig>>;
type Quantities = Record<string, number>;

// ─── helpers ────────────────────────────────────────────────────────────────

/** Cuántas paredes del bolsillo genera un receso (en m2) */
function recessPocketWallArea(r: Recess, fallbackH: number): number {
  const h = r.height || fallbackH;
  let area = 0;
  if (!r.hideSideWall)    area += r.depth * h; // pared lateral inicio
  if (!r.hideSideWallEnd) area += r.depth * h; // pared lateral fin
  if (!r.hideBase)        area += r.width * h; // pared del fondo
  return area;
}

/** Lineal exterior que agregan las paredes del bolsillo de un receso */
function recessPocketLineal(r: Recess): number {
  let ml = 0;
  if (!r.hideSideWall)    ml += r.depth;
  if (!r.hideSideWallEnd) ml += r.depth;
  if (!r.hideBase)        ml += r.width;
  return ml;
}

// ─── calculateGeometry ──────────────────────────────────────────────────────

export const calculateGeometry = (
  dimensions: Dimensions,
  interiorWalls: InteriorWall[] | number,
  facadeConfigs: FacadeConfigs,
  openings: Opening[] = [],
  project: Partial<Project> & { foundationType?: string } = {},
  selections: Partial<Selections> = {}
): GeometryResult => {
  const { width, length } = dimensions;
  const recesses: Recess[] = (project.recesses || []) as Recess[];

  // 1. Longitud de tabiques interiores
  const interiorWallsLength = Array.isArray(interiorWalls)
    ? interiorWalls.reduce((acc, wall) => {
        if (wall.length !== undefined) return acc + (Number(wall.length) || 0);
        if (wall.x1 !== undefined && wall.x2 !== undefined && wall.y1 !== undefined && wall.y2 !== undefined) {
          const dx = (wall.x2 as number) - (wall.x1 as number);
          const dy = (wall.y2 as number) - (wall.y1 as number);
          return acc + Math.sqrt(dx * dx + dy * dy);
        }
        return acc;
      }, 0)
    : (Number(interiorWalls) || 0);

  // 2. Área de fachadas + conteo de paneles exteriores
  const sides: Record<string, FacadeStats> = {};
  let areaFachadasTotal = 0;
  let cantMurosExtTotal = 0;
  let maxH = 2.44;
  let minBaseH = Infinity;

  Object.entries(facadeConfigs).forEach(([side, config]) => {
    const facadeSide = side as FacadeSide;
    const isFB = facadeSide === 'Norte' || facadeSide === 'Sur';
    const w = isFB ? width : length;
    const { hBase, hMax } = config as FacadeConfig;
    if (hMax > maxH) maxH = hMax;
    if (hBase < minBaseH) minBaseH = hBase;

    const isVisible = project.perimeterVisibility?.[facadeSide] !== false;
    if (!isVisible) {
      sides[side] = { area: 0, panels: 0, openingML: 0, perimPanels: 0, isVisible: false };
      return;
    }

    // Área bruta de la fachada según tipo de techo
    let sideArea = 0;
    if (config!.type === 'recto')     sideArea = w * hBase;
    else if (config!.type === 'inclinado') sideArea = w * (hBase + hMax) / 2;
    else if (config!.type === '2-aguas')   sideArea = w * hBase + (w * (hMax - hBase) / 2);

    // ── FIX: descontar área de recesos de esta fachada ──────────────────
    const facadeRecessDeduction = recesses
      .filter(r => r.side === facadeSide)
      .reduce((acc, r) => {
        const h = r.height || hBase;
        return acc + r.width * h;
      }, 0);
    const sideAreaNet = Math.max(0, sideArea - facadeRecessDeduction);
    // ────────────────────────────────────────────────────────────────────

    // Aberturas de esta fachada
    const sideOpenings = (openings || []).filter(o => o.side === facadeSide);
    const sideOpeningsML = sideOpenings.reduce((acc, o) => {
      const ow = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
      const oh = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
      return acc + ((ow + oh) * 2);
    }, 0);
    const sideOpeningsArea = sideOpenings.reduce((acc, o) => {
      const ow = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
      const oh = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
      return acc + (ow * oh);
    }, 0);

    const sideNetArea = Math.max(0, sideAreaNet - sideOpeningsArea);
    const sidePanels  = Math.ceil(sideNetArea / (PANEL_WIDTH * PANEL_HEIGHT));

    areaFachadasTotal += sideAreaNet;
    cantMurosExtTotal += sidePanels;

    sides[side] = {
      area: sideAreaNet,
      panels: sidePanels,
      openingML: sideOpeningsML,
      perimPanels: sidePanels * 7.32,
      isVisible: true,
    };
  });

  if (minBaseH === Infinity) minBaseH = 2.44;

  // ── FIX: agregar paredes del bolsillo de cada receso ────────────────────
  recesses.forEach(r => {
    if (project.perimeterVisibility?.[r.side] === false) return;
    const pocketArea = recessPocketWallArea(r, minBaseH);
    if (pocketArea > 0) {
      const pocketPanels = Math.ceil(pocketArea / (PANEL_WIDTH * PANEL_HEIGHT));
      areaFachadasTotal += pocketArea;
      cantMurosExtTotal += pocketPanels;
    }
  });
  // ────────────────────────────────────────────────────────────────────────

  // 3. Área de piso y perímetro exterior (con recesos)
  let recessPisoArea = 0;
  let extraLineal = 0;

  recesses.forEach(r => {
    recessPisoArea += r.width * r.depth;
    if (project.perimeterVisibility?.[r.side] !== false) {
      extraLineal += recessPocketLineal(r);
    }
  });

  let perimExtBase = 0;
  if (project.perimeterVisibility?.Norte !== false) perimExtBase += width;
  if (project.perimeterVisibility?.Sur  !== false)  perimExtBase += width;
  if (project.perimeterVisibility?.Este !== false)  perimExtBase += length;
  if (project.perimeterVisibility?.Oeste !== false) perimExtBase += length;

  const perimExt = Math.max(0, perimExtBase + extraLineal);
  const areaPiso = Math.max(0, (width * length) - recessPisoArea);

  // 4. Aberturas totales
  const visibleOpenings = (openings || []).filter(o => project.perimeterVisibility?.[o.side] !== false);
  const totalAberturasCount = visibleOpenings.length;
  const perimAberturas = visibleOpenings.reduce((acc, o) => {
    const w = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
    const h = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
    return acc + ((w + h) * 2);
  }, 0);
  const areaAberturas = visibleOpenings.reduce((acc, o) => {
    const w = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
    const h = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
    return acc + (w * h);
  }, 0);

  // 5. Área de techo (con pendiente real, cap 12%)
  let maxSlopeFactor = 0;
  Object.entries(facadeConfigs).forEach(([side, config]) => {
    const facadeSide = side as FacadeSide;
    const isFB = facadeSide === 'Norte' || facadeSide === 'Sur';
    const { hBase, hMax, type } = config as FacadeConfig;
    if (type === 'recto' || hMax <= hBase) return;
    const run = type === '2-aguas'
      ? (isFB ? width : length) / 2
      : (isFB ? width : length);
    const rise = hMax - hBase;
    const factor = Math.sqrt(rise * rise + run * run) / run - 1;
    if (factor > maxSlopeFactor) maxSlopeFactor = factor;
  });
  const roofIncrement = Math.min(maxSlopeFactor, 0.12);
  const areaTecho = areaPiso * (1 + roofIncrement);

  // 6. Área de muros exteriores neta
  const areaMurosExtBruta = areaFachadasTotal;
  const areaMurosExtNeta  = Math.max(0, areaMurosExtBruta - areaAberturas);

  // 7. Conteo de paneles
  const isSandwichRoof  = selections.roofSystem === 'sandwich';
  const roofPanelWidth  = isSandwichRoof ? 1.0 : PANEL_WIDTH;
  const interiorWallHeightMode = selections.interiorWallHeightMode ?? 'roof';
  const intHeight = interiorWallHeightMode === 'panel' ? Math.min(2.44, minBaseH) : minBaseH;

  const incExt   = selections.includeExterior !== false;
  const incInt   = selections.includeInterior !== false;
  const incRoof  = selections.includeRoof !== false;
  const incFloor = project.foundationType === 'platea' ? false : (selections.includeFloor !== false);

  const cantMurosExt = incExt   ? cantMurosExtTotal : 0;
  const cantMurosInt = incInt   ? Math.ceil((interiorWallsLength * intHeight) / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
  const cantPiso     = incFloor ? Math.ceil(areaPiso / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
  const cantTecho    = incRoof  ? Math.ceil(areaTecho / (roofPanelWidth * PANEL_HEIGHT)) : 0;

  const totalPaneles      = cantMurosExt + cantMurosInt + cantPiso + cantTecho;
  const perimLinealPaneles = totalPaneles * 7.32;

  const result: GeometryResult = {
    perimExt,
    areaPiso,
    areaTecho,
    cantMurosExt,
    cantMurosInt,
    cantPiso,
    cantTecho,
    perimMurosExt: cantMurosExt * 7.32,
    perimMurosInt: cantMurosInt * 7.32,
    perimPiso:     cantPiso     * 7.32,
    perimTecho:    cantTecho    * 7.32,
    totalPaneles,
    tabiques: interiorWallsLength,
    areaMurosBruta: areaMurosExtBruta,
    areaMuros:      areaMurosExtNeta,
    perimAberturas,
    perimLinealPaneles,
    totalAberturasCount,
    sides,
  };

  // Sanitizar NaN
  (Object.keys(result) as (keyof GeometryResult)[]).forEach(key => {
    const val = result[key];
    if (typeof val === 'number' && isNaN(val)) {
      (result as unknown as Record<string, unknown>)[key] = 0;
    }
  });

  return result;
};

// ─── calculateQuantities ────────────────────────────────────────────────────

export const calculateQuantities = (
  geo: GeometryResult,
  selections: Partial<Selections>,
  openingsCount: number,
  prices: Product[],
  dimensions: Partial<Dimensions> = {},
  foundationType: string = 'platea',
  structureType: string = 'madera'
): Quantities => {
  const { areaPiso, cantMurosExt, cantMurosInt, cantPiso, cantTecho } = geo;
  const quantities: Quantities = {};

  const includeExt   = selections.includeExterior !== undefined ? selections.includeExterior : true;
  const includeInt   = selections.includeInterior !== undefined ? selections.includeInterior : true;
  const includeFloor = foundationType === 'platea' ? false : (selections.includeFloor !== undefined ? selections.includeFloor : true);
  const includeRoof  = selections.includeRoof !== undefined ? selections.includeRoof : true;

  const paneles_muros = (includeExt ? cantMurosExt : 0) + (includeInt ? cantMurosInt : 0);
  const paneles_piso  = includeFloor ? cantPiso : 0;

  const roofId    = (selections?.roofId || 'TECHO-OSB-70').toString().trim();
  const isSandwich = selections.roofSystem === 'sandwich' || roofId.includes('SAND-');

  const paneles_techo_conv     = (includeRoof && !isSandwich) ? cantTecho : 0;
  const paneles_techo_sandwich = (includeRoof && isSandwich)  ? cantTecho : 0;
  const total_paneles = paneles_muros + paneles_piso + (includeRoof ? cantTecho : 0);

  // --- 1. SISTEMA DE PANELES ---
  if (includeExt && geo.cantMurosExt > 0) {
    const id = (selections?.exteriorWallId || 'OSB-70-E').toString().trim();
    quantities[`${id}@@EXTERIOR`] = geo.cantMurosExt;
  }
  if (includeInt && geo.cantMurosInt > 0) {
    const id = (selections?.interiorWallId || 'OSB-70-DECO').toString().trim();
    quantities[`${id}@@INTERIOR`] = geo.cantMurosInt;
  }
  if (includeFloor && geo.cantPiso > 0) {
    const id = (selections?.floorId || 'PISO-OSB-70').toString().trim();
    quantities[`${id}@@PISO`] = geo.cantPiso;
  }
  if (includeRoof) {
    if (isSandwich) {
      quantities[`${roofId}@@TECHO`] = Math.round(geo.areaTecho);
    } else if (geo.cantTecho > 0) {
      quantities[`${roofId}@@TECHO`] = geo.cantTecho;
    }
  }

  // --- 2. MADERAS ESTRUCTURALES ---
  quantities['MAD_VINC_2X3']       = Math.round(paneles_muros * 7);
  quantities['MAD_VINC_PISO_2X3']  = includeFloor ? Math.round(paneles_piso * 5) : 0;
  quantities['MAD_SOL_BASE']        = Math.round(paneles_muros * 1);
  quantities['MAD_ACOMP_SOL']       = Math.round(paneles_muros * 1);
  quantities['MAD_VIGA_TECHO_3X6']  = Math.round(paneles_techo_conv * 3.5);
  quantities['MAD_CLAV_2X2']        = Math.round(paneles_muros * 3.5);
  quantities['MAD_CLAV_TECHO_2X2']  = Math.round(paneles_techo_conv * 4);
  quantities['FLEJES_TECHO']        = Math.round(paneles_techo_conv * 3.25);

  if (includeFloor && (structureType === 'madera' || structureType === 'metal')) {
    const joistsSpacing = 0.6;
    const { width = 6, length = 8 } = dimensions;
    const runs    = Math.ceil(length / joistsSpacing) + 1;
    const mlTotal = Math.ceil(runs * width * 1.1);
    quantities['MAD_VIGA_PISO_3X6'] = mlTotal;
  } else {
    quantities['MAD_VIGA_PISO_3X6'] = 0;
  }

  // --- 3. TORNILLOS ---
  quantities['FIX_6X1_5']  = Math.round((paneles_muros + paneles_piso) * 55);
  quantities['FIX_6X2']    = Math.round(paneles_muros * 3);
  quantities['TORX_120']   = Math.round(paneles_muros * 2.25);
  quantities['TORX_140']   = Math.round(paneles_muros * 5);
  quantities['TORN_HEX_3'] = Math.round(paneles_techo_conv * 28);
  quantities['HEX_T2_14X5']= Math.round(paneles_techo_sandwich * 5.5);
  quantities['FIX_6X1']    = Math.round(paneles_techo_conv * 11);
  quantities['FIX_8X3']    = Math.round(paneles_muros * 8 + paneles_techo_conv * 10);

  // --- 4. FIJACION A PLATEA ---
  if (!includeFloor) {
    quantities['VARILLA_12'] = paneles_muros > 0 ? Math.max(1, Math.round(paneles_muros * 0.22)) : 0;
  } else {
    quantities['VARILLA_12'] = 0;
  }
  quantities['KIT_TUERCA']       = quantities['VARILLA_12'] * 3;
  quantities['ANCLAJE_QUIMICO']  = paneles_muros > 0 ? Math.max(1, Math.round(paneles_muros * 0.12)) : 0;

  // --- 5. SELLADORES ---
  quantities['ESPUMA_PU']  = total_paneles > 0 ? Math.max(1, Math.round(total_paneles * 0.22)) : 0;
  quantities['PEG_PU']     = paneles_muros  > 0 ? Math.max(1, Math.round(paneles_muros  * 0.05)) : 0;
  quantities['MEMB_LIQ']   = paneles_muros  > 0 ? Math.max(1, Math.round(paneles_muros  * 0.035)) : 0;
  quantities['MEMB_AUTO']  = paneles_muros  > 0 ? Math.max(1, Math.round(paneles_muros  * 0.03)) : 0;

  // --- 6. CUBIERTA ---
  quantities['CHAPA_C27']  = Math.ceil(paneles_techo_conv * 2.977);
  quantities['BARRERA']    = paneles_muros > 0 ? Math.max(1, Math.ceil(paneles_muros / 12)) : 0;

  // --- 7. SERVICIOS ---
  quantities['INGENIERIA_DETALLE'] = selections.includeEngineeringDetail ? Math.ceil(areaPiso) : 0;

  void openingsCount;
  void prices;
  void dimensions;

  return quantities;
};

// ─── fullCalculation ─────────────────────────────────────────────────────────

export const fullCalculation = (
  dimensions: Dimensions,
  selections: Partial<Selections> | null,
  interiorWalls: InteriorWall[] | number | null,
  openings: Opening[] | null,
  facadeConfigs: FacadeConfigs | null,
  project: Partial<Project> = {},
  foundationType: string = 'platea',
  structureType: string = 'madera',
  prices: Product[] = []
): { geo: GeometryResult; quantities: Quantities } => {
  const actualOpenings  = Array.isArray(openings) ? openings : [];
  const safeSelections  = selections || {};
  const geo = calculateGeometry(
    dimensions,
    interiorWalls || [],
    facadeConfigs || {},
    actualOpenings,
    {
      ...(project as Record<string, unknown>),
      foundationType,
      perimeterWalls: (project as Record<string, unknown>).perimeterWalls || [],
      interiorWalls:  (project as Record<string, unknown>).interiorWalls  || [],
    } as Partial<Project> & { foundationType?: string },
    safeSelections
  );
  const q = calculateQuantities(geo, safeSelections, actualOpenings.length, prices, dimensions, foundationType, structureType);

  [geo as unknown as Record<string, unknown>, q as unknown as Record<string, unknown>].forEach(obj => {
    if (obj) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'number' && isNaN(obj[key] as number)) obj[key] = 0;
      });
    }
  });

  return { geo, quantities: q };
};
