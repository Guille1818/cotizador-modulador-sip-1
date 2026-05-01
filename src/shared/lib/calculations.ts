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
} from '@/shared/types';
import { INITIAL_PRICES } from '@/shared/lib/constants';

export const PANEL_WIDTH = 1.22; // Standard SIP panel width
export const PANEL_HEIGHT = 2.44; // Standard

type FacadeConfigs = Partial<Record<FacadeSide, FacadeConfig>>;
type Quantities = Record<string, number>;

export const calculateGeometry = (
  dimensions: Dimensions,
  interiorWalls: InteriorWall[] | number,
  facadeConfigs: FacadeConfigs,
  openings: Opening[] = [],
  project: Partial<Project> & { foundationType?: string } = {},
  selections: Partial<Selections> = {}
): GeometryResult => {
  const { width, length } = dimensions;
  const recesses = project.recesses || [];

  // 1. Interior Walls Length (Robust calculation: uses length property or coordinates from structural interiorWalls array)
  // IMPORTANT: customMeasurements (reference rulers) are kept in a separate array in the store
  // and should NEVER be passed here or counted as functional walls.
  const interiorWallsLength = Array.isArray(interiorWalls)
    ? interiorWalls.reduce((acc, wall) => {
        // Ensure we are working with a structural wall object and not a generic reference
        if (wall.length !== undefined) return acc + (Number(wall.length) || 0);
        if ((wall.x1 !== undefined && wall.x2 !== undefined) && (wall.y1 !== undefined && wall.y2 !== undefined)) {
          const dx = (wall.x2 as number) - (wall.x1 as number);
          const dy = (wall.y2 as number) - (wall.y1 as number);
          return acc + Math.sqrt(dx * dx + dy * dy);
        }
        return acc;
      }, 0)
    : (Number(interiorWalls) || 0);

  // 2. Facade-based Area Calculation (Gross Exterior)
  const sides: Record<string, FacadeStats> = {};
  let areaFachadasTotal = 0;
  let cantMurosExtTotal = 0;
  let maxH = 2.44;
  // Inicializar con Infinity para que el primer hBase real siempre actualice el valor
  let minBaseH = Infinity;

  Object.entries(facadeConfigs).forEach(([side, config]) => {
    const facadeSide = side as FacadeSide;
    const isFB = facadeSide === 'Norte' || facadeSide === 'Sur';
    const w = isFB ? width : length;
    const { hBase, hMax } = config as FacadeConfig;
    if (hMax > maxH) maxH = hMax;
    if (hBase < minBaseH) minBaseH = hBase;

    // Skip calculations if side is hidden
    const isVisible = project.perimeterVisibility?.[facadeSide] !== false;
    if (!isVisible) {
      sides[side] = {
        area: 0,
        panels: 0,
        openingML: 0,
        perimPanels: 0,
        isVisible: false,
      };
      return;
    }

    let sideArea = 0;
    if (config!.type === 'recto') sideArea = w * hBase;
    else if (config!.type === 'inclinado') sideArea = w * (hBase + hMax) / 2;
    else if (config!.type === '2-aguas') sideArea = w * hBase + (w * (hMax - hBase) / 2);

    const sideOpenings = (openings || []).filter(o => o.side === facadeSide);
    const sideOpeningsML = sideOpenings.reduce((acc, o) => {
      const ow = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
      const oh = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
      return acc + ((ow + oh) * 2);
    }, 0);

    // Área de aberturas de esta fachada (puertas + ventanas)
    const sideOpeningsArea = sideOpenings.reduce((acc, o) => {
      const ow = Number(o.width) || (o.type === 'door' ? 0.9 : 1.2);
      const oh = Number(o.height) || (o.type === 'door' ? 2.1 : 1.2);
      return acc + (ow * oh);
    }, 0);

    // Área neta = área bruta de fachada menos los vanos
    const sideNetArea = Math.max(0, sideArea - sideOpeningsArea);
    const sidePanels = Math.ceil(sideNetArea / (PANEL_WIDTH * PANEL_HEIGHT));

    areaFachadasTotal += sideArea; // total bruto se mantiene para info
    cantMurosExtTotal += sidePanels; // conteo de paneles sobre área neta

    sides[side] = {
      area: sideArea,       // área bruta (para mostrar en reporte)
      panels: sidePanels,   // paneles calculados sobre área neta
      openingML: sideOpeningsML,
      perimPanels: sidePanels * 7.32,
      isVisible: true,
    };
  });

  // Fallback: si no hay fachadas configuradas, usar altura estándar de panel
  if (minBaseH === Infinity) minBaseH = 2.44;
  let recessPisoArea = 0;
  let extraLineal = 0;

  recesses.forEach(r => {
    recessPisoArea += r.width * r.depth;
    // Only calculate extra lineal for recesses if its facade is visible
    if (project.perimeterVisibility?.[r.side] !== false) {
      if (r.hideBase) {
        if (!r.hideSideWall) {
          extraLineal += 2 * r.depth;
        }
      } else {
        extraLineal += (2 * r.depth + r.width);
      }
    }
  });

  let perimExtBase = 0;
  if (project.perimeterVisibility?.Norte !== false) perimExtBase += width;
  if (project.perimeterVisibility?.Sur !== false) perimExtBase += width;
  if (project.perimeterVisibility?.Este !== false) perimExtBase += length;
  if (project.perimeterVisibility?.Oeste !== false) perimExtBase += length;

  const perimExt = Math.max(0, perimExtBase + extraLineal);
  const areaPiso = Math.max(0, (width * length) - recessPisoArea);

  // User requested: "area bruta en muros salga de la suma de las 4 fachadas laterales"
  const areaMurosExtBruta = areaFachadasTotal;

  // 4. Openings Analysis
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

  // 5. Roof Area estimation — max 12% over floor area, based on real slope
  // Calculate the dominant slope factor from facade configs
  let maxSlopeFactor = 0;
  Object.entries(facadeConfigs).forEach(([side, config]) => {
    const facadeSide = side as FacadeSide;
    const isFB = facadeSide === 'Norte' || facadeSide === 'Sur';
    const { hBase, hMax, type } = config as FacadeConfig;
    if (type === 'recto' || hMax <= hBase) return;
    // The run (horizontal distance the slope covers)
    const run = type === '2-aguas'
      ? (isFB ? width : length) / 2  // slope runs to center
      : (isFB ? width : length);     // slope runs full width
    const rise = hMax - hBase;
    // slope factor = sqrt(rise² + run²) / run  — ratio of sloped length to horizontal
    const factor = Math.sqrt(rise * rise + run * run) / run - 1; // extra fraction
    if (factor > maxSlopeFactor) maxSlopeFactor = factor;
  });
  // Cap the slope increment at 12%
  const roofIncrement = Math.min(maxSlopeFactor, 0.12);
  const areaTecho = areaPiso * (1 + roofIncrement);

  // 6. Walls Area (Net)
  const areaMurosExtNeta = Math.max(0, areaMurosExtBruta - areaAberturas);

  // 7. Panels Calculation
  const isSandwichRoof = selections.roofSystem === 'sandwich';
  const roofPanelWidth = isSandwichRoof ? 1.0 : PANEL_WIDTH;

  // Altura de muros interiores según modo elegido:
  // 'roof'  → llegan hasta el techo real (minBaseH)  — sin cielorraso
  // 'panel' → se limitan a 2.44m (altura estándar de panel) — para cielorraso suspendido plano
  const interiorWallHeightMode = selections.interiorWallHeightMode ?? 'roof';
  const intHeight = interiorWallHeightMode === 'panel' ? Math.min(2.44, minBaseH) : minBaseH;

  // Filter by inclusions
  const incExt = selections.includeExterior !== false;
  const incInt = selections.includeInterior !== false;
  const incRoof = selections.includeRoof !== false;
  const incFloor = (project.foundationType === 'platea') ? false : (selections.includeFloor !== false);

  const cantMurosExt = incExt ? cantMurosExtTotal : 0;
  const cantMurosInt = incInt ? Math.ceil((interiorWallsLength * intHeight) / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
  const cantPiso = incFloor ? Math.ceil(areaPiso / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;
  const cantTecho = incRoof ? Math.ceil(areaTecho / (roofPanelWidth * PANEL_HEIGHT)) : 0;

  const totalPaneles = cantMurosExt + cantMurosInt + cantPiso + cantTecho;
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
    perimPiso: cantPiso * 7.32,
    perimTecho: cantTecho * 7.32,
    totalPaneles,
    tabiques: interiorWallsLength,
    areaMurosBruta: areaMurosExtBruta,
    areaMuros: areaMurosExtNeta,
    perimAberturas,
    perimLinealPaneles,
    totalAberturasCount,
    sides,
  };

  // Global Safety: Ensure no NaN leaks to components
  (Object.keys(result) as (keyof GeometryResult)[]).forEach(key => {
    const val = result[key];
    if (typeof val === 'number' && isNaN(val)) {
      (result as unknown as Record<string, unknown>)[key] = 0;
    }
  });

  return result;
};

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

  const includeExt = selections.includeExterior !== undefined ? selections.includeExterior : true;
  const includeInt = selections.includeInterior !== undefined ? selections.includeInterior : true;
  // Floor is automatically excluded if foundation is 'platea'
  const includeFloor = foundationType === 'platea' ? false : (selections.includeFloor !== undefined ? selections.includeFloor : true);
  const includeRoof = selections.includeRoof !== undefined ? selections.includeRoof : true;

  // --- DERIVED INPUT VARIABLES ---
  const paneles_muros = (includeExt ? cantMurosExt : 0) + (includeInt ? cantMurosInt : 0);
  const paneles_piso = includeFloor ? cantPiso : 0;

  const roofId = (selections?.roofId || 'TECHO-OSB-70').toString().trim();
  const isSandwich = selections.roofSystem === 'sandwich' || roofId.includes('SAND-');

  const paneles_techo_conv = (includeRoof && !isSandwich) ? cantTecho : 0;
  const paneles_techo_sandwich = (includeRoof && isSandwich) ? cantTecho : 0;
  const total_paneles = paneles_muros + paneles_piso + (includeRoof ? cantTecho : 0);

  // --- 1. SISTEMA DE PANELES ---

  if (includeExt && geo.cantMurosExt > 0) {
    const id = (selections?.exteriorWallId || 'OSB-70-E').toString().trim();
    quantities[`${id}@@EXTERIOR`] = geo.cantMurosExt;
  }

  // Interior Walls
  if (includeInt && geo.cantMurosInt > 0) {
    const id = (selections?.interiorWallId || 'OSB-70-DECO').toString().trim();
    quantities[`${id}@@INTERIOR`] = geo.cantMurosInt;
  }

  // Floor
  if (includeFloor && geo.cantPiso > 0) {
    const id = (selections?.floorId || 'PISO-OSB-70').toString().trim();
    quantities[`${id}@@PISO`] = geo.cantPiso;
  }

  // Roof
  if (includeRoof) {
    if (isSandwich) {
      quantities[`${roofId}@@TECHO`] = Math.round(geo.areaTecho);
    } else if (geo.cantTecho > 0) {
      quantities[`${roofId}@@TECHO`] = geo.cantTecho;
    }
  }

  // --- 2. MADERAS ESTRUCTURALES ---

  // Vinculantes muros 2x3: paneles_muros * 7
  quantities['MAD_VINC_2X3'] = Math.round(paneles_muros * 7);

  // Vinculantes piso 2x3: paneles_piso * 5 (only if includeFloor)
  quantities['MAD_VINC_PISO_2X3'] = includeFloor ? Math.round(paneles_piso * 5) : 0;

  // Solera 1x4: paneles_muros * 1
  quantities['MAD_SOL_BASE'] = Math.round(paneles_muros * 1);

  // Acompana solera 2x3: paneles_muros * 1
  quantities['MAD_ACOMP_SOL'] = Math.round(paneles_muros * 1);

  // Vigas techo 3x6: paneles_techo_conv * 3.5 (ONLY techo conv)
  quantities['MAD_VIGA_TECHO_3X6'] = Math.round(paneles_techo_conv * 3.5);

  // Clavaderas muros 2x2: paneles_muros * 3.5
  quantities['MAD_CLAV_2X2'] = Math.round(paneles_muros * 3.5);

  // Clavaderas techo 2x2: paneles_techo_conv * 4 (ONLY techo conv)
  quantities['MAD_CLAV_TECHO_2X2'] = Math.round(paneles_techo_conv * 4);

  // Flejes techo 2x1/2: paneles_techo_conv * 3.25 (ONLY techo conv)
  quantities['FLEJES_TECHO'] = Math.round(paneles_techo_conv * 3.25);

  // Vigas piso 3x6: metros lineales totales para cubrir el piso
  // Separación entre vigas = 60cm. Las vigas corren en la dirección del lado corto (width).
  // Cantidad de corridas = ceil(length / 0.6) + 1 (incluyendo borde inicial).
  // Cada corrida tiene largo = width metros.
  // Las piezas se pueden empalmar con herrajes, por eso el resultado se da en ML.
  if (includeFloor && (structureType === 'madera' || structureType === 'metal')) {
    const joistsSpacing = 0.6;
    const { width = 6, length = 8 } = dimensions;
    const runs = Math.ceil(length / joistsSpacing) + 1;
    const mlTotal = Math.ceil(runs * width * 1.1); // 10% desperdicio/empalmes
    quantities['MAD_VIGA_PISO_3X6'] = mlTotal;
  } else {
    quantities['MAD_VIGA_PISO_3X6'] = 0;
  }

  // --- 3. TORNILLOS ---

  // Fix 6x1.5: (paneles_muros + paneles_piso) * 55
  quantities['FIX_6X1_5'] = Math.round((paneles_muros + paneles_piso) * 55);

  // Fix 6x2: paneles_muros * 3
  quantities['FIX_6X2'] = Math.round(paneles_muros * 3);

  // Torx 120mm: paneles_muros * 2.25
  quantities['TORX_120'] = Math.round(paneles_muros * 2.25);

  // Torx 140mm: paneles_muros * 5
  quantities['TORX_140'] = Math.round(paneles_muros * 5);

  // Hex 14x3: paneles_techo_conv * 28 (ONLY techo conv)
  quantities['TORN_HEX_3'] = Math.round(paneles_techo_conv * 28);

  // Hex 14x5: paneles_techo_sandwich * 5.5 (ONLY techo sandwich)
  quantities['HEX_T2_14X5'] = Math.round(paneles_techo_sandwich * 5.5);

  // Fix 6x1: paneles_techo_conv * 11 (ONLY techo conv)
  quantities['FIX_6X1'] = Math.round(paneles_techo_conv * 11);

  // Fix 8x3: paneles_muros * 8 + paneles_techo_conv * 10
  quantities['FIX_8X3'] = Math.round(paneles_muros * 8 + paneles_techo_conv * 10);

  // --- 4. FIJACION A PLATEA ---

  // Varilla Roscada 1/2": only if NOT includeFloor (platea)
  if (!includeFloor) {
    quantities['VARILLA_12'] = paneles_muros > 0 ? Math.max(1, Math.round(paneles_muros * 0.22)) : 0;
  } else {
    quantities['VARILLA_12'] = 0;
  }

  // Kit Tuerca + Arandela: varillas * 3
  quantities['KIT_TUERCA'] = quantities['VARILLA_12'] * 3;

  // Anclaje Quimico: min 1 if paneles_muros > 0
  quantities['ANCLAJE_QUIMICO'] = paneles_muros > 0 ? Math.max(1, Math.round(paneles_muros * 0.12)) : 0;

  // --- 5. SELLADORES ---

  // Espuma PU: min 1 if total > 0
  quantities['ESPUMA_PU'] = total_paneles > 0 ? Math.max(1, Math.round(total_paneles * 0.22)) : 0;

  // Pegamento PU: min 1 if paneles_muros > 0
  quantities['PEG_PU'] = paneles_muros > 0 ? Math.max(1, Math.round(paneles_muros * 0.05)) : 0;

  // Membrana Liquida: min 1 if paneles_muros > 0
  quantities['MEMB_LIQ'] = paneles_muros > 0 ? Math.max(1, Math.round(paneles_muros * 0.035)) : 0;

  // Membrana Asfaltica: min 1 if paneles_muros > 0
  quantities['MEMB_AUTO'] = paneles_muros > 0 ? Math.max(1, Math.round(paneles_muros * 0.03)) : 0;

  // --- 6. CUBIERTA ---

  // Chapa C27: ceil(paneles_techo_conv * 2.977) ONLY techo conv
  quantities['CHAPA_C27'] = Math.ceil(paneles_techo_conv * 2.977);

  // Barrera Viento: min 1, ceil(paneles_muros / 12)
  quantities['BARRERA'] = paneles_muros > 0 ? Math.max(1, Math.ceil(paneles_muros / 12)) : 0;

  // --- 7. SERVICIOS Y EXTRAS ---
  quantities['INGENIERIA_DETALLE'] = selections.includeEngineeringDetail ? Math.ceil(areaPiso) : 0;

  // Suppress unused variable warnings
  void openingsCount;
  void prices;
  void dimensions;

  return quantities;
};

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
  const actualOpenings = Array.isArray(openings) ? openings : [];
  const safeSelections = selections || {};
  const geo = calculateGeometry(
    dimensions,
    interiorWalls || [],
    facadeConfigs || {},
    actualOpenings,
    {
      ...(project as Record<string, unknown>),
      foundationType,
      perimeterWalls: (project as Record<string, unknown>).perimeterWalls || [],
      interiorWalls: (project as Record<string, unknown>).interiorWalls || [],
    } as Partial<Project> & { foundationType?: string },
    safeSelections
  );
  const q = calculateQuantities(geo, safeSelections, actualOpenings.length, prices, dimensions, foundationType, structureType);

  // Safety check for NaN values in geo and quantities
  [geo as unknown as Record<string, unknown>, q as unknown as Record<string, unknown>].forEach(obj => {
    if (obj) {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'number' && isNaN(obj[key] as number)) obj[key] = 0;
      });
    }
  });

  return { geo, quantities: q };
};
