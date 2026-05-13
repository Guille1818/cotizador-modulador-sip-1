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
  let minBaseH = 2.44;

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

    const sidePanels = Math.ceil(sideArea / (PANEL_WIDTH * PANEL_HEIGHT));

    areaFachadasTotal += sideArea;
    cantMurosExtTotal += sidePanels;

    sides[side] = {
      area: sideArea,
      panels: sidePanels,
      openingML: sideOpeningsML,
      perimPanels: sidePanels * 7.32,
      isVisible: true,
    };
  });

  // 3. Recesses (kept for perimeter and piso, but wall area is now facade-based as per user)
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

  // Interior walls height = min(2.44, minBaseH)
  const intHeight = Math.min(2.44, minBaseH);

  // Filter by inclusions
  const incExt = selections.includeExterior !== false;
  const incInt = selections.includeInterior !== false;
  const incRoof = selections.includeRoof !== false;
  const incFloor = (project.foundationType === 'platea') ? false : (selections.includeFloor !== false);

  const cantMurosExt = incExt ? cantMurosExtTotal : 0;
  const cantMurosInt = incInt ? Math.ceil((interiorWallsLength * intHeight) / (PANEL_WIDTH * PANEL_HEIGHT)) : 0;

  const floorPanelsByGrid = incFloor
    ? Math.min(
        Math.ceil(width / PANEL_WIDTH) * Math.ceil(length / PANEL_HEIGHT),
        Math.ceil(width / PANEL_HEIGHT) * Math.ceil(length / PANEL_WIDTH)
      )
    : 0;
  const cantPiso = incFloor ? floorPanelsByGrid : 0;

  const cantTecho = incRoof
    ? (isSandwichRoof
        ? Math.ceil(areaTecho / (roofPanelWidth * PANEL_HEIGHT))
        : (roofIncrement === 0
            ? Math.min(
                Math.ceil(width / PANEL_WIDTH) * Math.ceil(length / PANEL_HEIGHT),
                Math.ceil(width / PANEL_HEIGHT) * Math.ceil(length / PANEL_WIDTH)
              )
            : Math.ceil(areaTecho / (roofPanelWidth * PANEL_HEIGHT))))
    : 0;

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
  structureType: string = 'madera',
  interiorWalls: InteriorWall[] = [],
  facadeConfigs: FacadeConfigs = {}
): Quantities => {
  const { areaPiso, areaTecho, cantMurosExt, cantMurosInt, cantPiso, cantTecho, perimExt } = geo;

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

  const width = Number(dimensions.width) || 0;
  const length = Number(dimensions.length) || 0;
  const minSide = Math.min(width, length);
  const maxSide = Math.max(width, length);
  const floorSecondaryBeams = includeFloor ? Math.ceil(minSide / 0.65) + 1 : 0;
  const floorMainBeams = includeFloor ? Math.ceil(maxSide / 3.0) + 1 : 0;
  const floorBeamIntersections = includeFloor ? floorSecondaryBeams * floorMainBeams : 0;

  const interiorWallsHeightMode = selections.interiorWallsHeight || 'panel';

  const facadeList = Object.entries(facadeConfigs).map(([side, config]) => {
    const facadeSide = side as FacadeSide;
    const isFB = facadeSide === 'Norte' || facadeSide === 'Sur';
    const facadeLength = isFB ? width : length;
    const hBase = config?.hBase ?? PANEL_HEIGHT;
    const hMax = config?.hMax ?? hBase;
    return { facadeSide, facadeLength, hBase, hMax };
  });

  const defaultFacadeHBase = facadeList.length
    ? Math.min(...facadeList.map(f => f.hBase))
    : PANEL_HEIGHT;

  const exteriorMontantesML = facadeList.reduce((acc, facade) => {
    if (facade.facadeLength <= 0) return acc;
    const montantesCount = Math.ceil(facade.facadeLength / PANEL_WIDTH) + 1;
    const heightsSum = Array.from({ length: montantesCount }, (_, index) => {
      const x = Math.min(index * PANEL_WIDTH, facade.facadeLength);
      return facade.hBase + ((facade.hMax - facade.hBase) * (x / facade.facadeLength));
    }).reduce((sum, h) => sum + h, 0);
    return acc + heightsSum;
  }, 0);

  const wallLength = (wall: InteriorWall): number => {
    if (wall.length !== undefined) return Number(wall.length) || 0;
    if (wall.x1 !== undefined && wall.x2 !== undefined && wall.y1 !== undefined && wall.y2 !== undefined) {
      const dx = (wall.x2 as number) - (wall.x1 as number);
      const dy = (wall.y2 as number) - (wall.y1 as number);
      return Math.sqrt(dx * dx + dy * dy);
    }
    return 0;
  };

  const nearestFacadeHBase = (wall: InteriorWall): number => {
    if (interiorWallsHeightMode !== 'roof') return PANEL_HEIGHT;
    if (facadeList.length === 0) return defaultFacadeHBase;
    if (wall.x1 !== undefined && wall.y1 !== undefined && wall.x2 !== undefined && wall.y2 !== undefined) {
      const midX = ((wall.x1 as number) + (wall.x2 as number)) / 2;
      const midY = ((wall.y1 as number) + (wall.y2 as number)) / 2;
      return facadeList.reduce((best, facade) => {
        const dist = facade.facadeSide === 'Norte'
          ? midY
          : facade.facadeSide === 'Sur'
            ? Math.abs(length - midY)
            : facade.facadeSide === 'Este'
              ? Math.abs(width - midX)
              : midX;
        const bestDist = best.dist;
        return dist < bestDist ? { facade, dist } : best;
      }, { facade: facadeList[0], dist: Infinity }).facade.hBase;
    }
    return defaultFacadeHBase;
  };

  const interiorMontantesML = interiorWalls.reduce((acc, wall) => {
    const lengthWall = wallLength(wall);
    if (lengthWall <= 0) return acc;
    const montantesCount = Math.ceil(lengthWall / PANEL_WIDTH) + 1;
    const height = interiorWallsHeightMode === 'roof' ? nearestFacadeHBase(wall) : PANEL_HEIGHT;
    return acc + montantesCount * height;
  }, 0);

  const numVigasTecho = Math.ceil(width / 1.22) + 1;
  const paneles_techo_conv = (includeRoof && !isSandwich) ? cantTecho : 0;
  const paneles_techo_sandwich = (includeRoof && isSandwich) ? cantTecho : 0;
  const total_paneles = paneles_muros + paneles_piso + (includeRoof ? cantTecho : 0);

  const exteriorCornerPairs: [FacadeSide, FacadeSide][] = [
    ['Norte', 'Este'],
    ['Este', 'Sur'],
    ['Sur', 'Oeste'],
    ['Oeste', 'Norte'],
  ];

  const visibleExteriorCorners = exteriorCornerPairs.reduce((count, [a, b]) => {
    return count + ((geo.sides?.[a]?.isVisible && geo.sides?.[b]?.isVisible) ? 1 : 0);
  }, 0);

  const clavaderasMurosML = includeExt ? Object.entries(facadeConfigs).reduce((acc, [side, config]) => {
    const facadeSide = side as FacadeSide;
    const isVisible = geo.sides?.[side]?.isVisible ?? true;
    if (!isVisible || !config) return acc;
    const facadeLength = facadeSide === 'Norte' || facadeSide === 'Sur' ? width : length;
    const wallHeight = config.hMax ?? config.hBase ?? PANEL_HEIGHT;
    const lineasClavaderas = Math.round(wallHeight / 1.0);
    return acc + (lineasClavaderas > 0 ? lineasClavaderas * facadeLength : 0);
  }, 0) : 0;

  const perimetroAberturasML = includeExt ? (geo.perimAberturas || 0) : 0;
  const clavaderasEsquinasML = visibleExteriorCorners * 2;
  const totalClavaderasMurosML = Math.round(clavaderasMurosML + perimetroAberturasML + clavaderasEsquinasML);

  const lineasClavaderasTechoConv = Math.round(Math.min(width, length) / 1.0);
  const clavaderasTechoML = includeRoof && !isSandwich
    ? lineasClavaderasTechoConv * Math.max(width, length)
    : 0;

  const flejesMurosML = 0; // TODO: calcular flejes si clavaderas son horizontales
  const lineasFlejesTechoConv = Math.ceil(Math.max(width, length) / 0.6);
  const flejesTechoML = includeRoof && !isSandwich
    ? lineasFlejesTechoConv * Math.min(width, length)
    : 0;

  const hbs140SoleraPiso = includeFloor ? Math.ceil(perimExt / 0.4) : 0;
  const hbs140SoleraMadera = includeFloor && structureType === 'madera' ? Math.ceil(perimExt / 0.8) : 0;
  const telHex4SoleraMetal = includeFloor && structureType === 'metal' ? Math.ceil(perimExt / 0.8) : 0;
  const hbs160Floor = includeFloor ? floorSecondaryBeams * Math.ceil(maxSide / 0.4) : 0;
  const hbs160Roof = includeRoof && !isSandwich ? numVigasTecho * Math.ceil(length / 0.4) : 0;
  const hbs200Entre = includeFloor ? floorSecondaryBeams * 2 : 0;
  const herrajes = includeFloor ? floorBeamIntersections * 2 : 0;

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

  // Vinculantes muros 2x3:  montantes exteriores + montantes interiores
  quantities['MAD_VINC_2X3'] = Math.round(exteriorMontantesML + interiorMontantesML);

  // Vinculantes piso 2x3: paneles_piso * 5 (only if includeFloor)
  quantities['MAD_VINC_PISO_2X3'] = includeFloor ? Math.round(paneles_piso * 5) : 0;

  // Solera 1x4: paneles_muros * 1
  quantities['MAD_SOL_BASE'] = Math.round(paneles_muros * 1);

  // Acompana solera 2x3: solo muros con altura superior a 2.44m o 2.40m según tipo
  const isCementicio = /\bCE(?:-|$)|CEM(?:ENTICIO)?/i.test(selections.exteriorWallId || '');
  const soleraDobleThreshold = isCementicio ? 2.40 : 2.44;
  const exteriorSoleraDobleML = Object.entries(facadeConfigs).reduce((acc, [side, config]) => {
    const facadeSide = side as FacadeSide;
    const isVisible = geo.sides?.[side]?.isVisible ?? true;
    if (!isVisible || !config) return acc;
    const hMax = config.hMax ?? config.hBase ?? PANEL_HEIGHT;
    const facadeLength = facadeSide === 'Norte' || facadeSide === 'Sur' ? width : length;
    return acc + (hMax > soleraDobleThreshold ? facadeLength : 0);
  }, 0);
  quantities['MAD_ACOMP_SOL'] = Math.round(exteriorSoleraDobleML);

  // Solera superior de cierre: suma de largos de TODOS los muros sin descontar vanos
  const fachadasExterioresML = Object.entries(facadeConfigs).reduce((acc, [side, config]) => {
    const facadeSide = side as FacadeSide;
    const isVisible = geo.sides?.[side]?.isVisible ?? true;
    if (!isVisible || !config) return acc;
    const facadeLength = facadeSide === 'Norte' || facadeSide === 'Sur' ? width : length;
    return acc + facadeLength;
  }, 0);
  const murosInterioresML = interiorWalls.reduce((acc, wall) => acc + wallLength(wall), 0);
  quantities['MAD_SOL_CIERRE'] = Math.round(fachadasExterioresML + murosInterioresML);

  // Vigas techo: calculo de cantidad y metros lineales para sandwich y SIP conv.
  const ladoCorto = Math.min(width, length);
  const ladoLargo = Math.max(width, length);
  const cantidadVigasTecho = isSandwich
    ? Math.ceil(ladoLargo / 1.00) + 1
    : Math.ceil(ladoLargo / 1.22) + 1;
  quantities['MAD_VIGA_TECHO'] = Math.round(cantidadVigasTecho * ladoCorto);

  // Clavaderas muros 2x2: fachada por fachada + aberturas + esquinas
  quantities['MAD_CLAV_2X2'] = totalClavaderasMurosML;

  // Clavaderas techo 2x2: líneas perpendiculares a la caída, solo techo conv
  quantities['MAD_CLAV_TECHO_2X2'] = Math.round(clavaderasTechoML);

  // Flejes muros 2x1/2: por ahora no se usan con clavaderas verticales
  const flejesMuros = flejesMurosML;
  // Flejes techo 2x1/2: líneas paralelas a la caída, solo techo conv
  quantities['FLEJES_TECHO'] = Math.round(flejesTechoML);

  // Vigas piso 3x6: keep existing logic
  if (includeFloor && (structureType === 'madera' || structureType === 'metal')) {
    quantities['MAD_VIGA_PISO_3X6'] = Math.ceil(areaPiso * 2.5 * 1.1);
  } else {
    quantities['MAD_VIGA_PISO_3X6'] = 0;
  }

  // --- 3. TORNILLOS ---

  // Fix 6x1.5: panel a montante (vinculante) - ceil(altura / 0.20) * 2 por montante
  const alturaMontante = 2.44;
  const totalMLVinculantes = paneles_muros * 7;
  const totalMontantes = totalMLVinculantes / alturaMontante;
  const tornillosPorMontante = Math.ceil(alturaMontante / 0.20) * 2;
  quantities['FIX_6X1_5'] = Math.round(totalMontantes * tornillosPorMontante);

  // Fix 6x2: paneles_muros * 3
  quantities['FIX_6X2'] = Math.round(paneles_muros * 3);

  // HBS 140mm: encuentros SIP-SIP y soleras sobre piso.
  const alturaEncuentro = 2.44;
  const tornillosPorEncuentro = Math.ceil(alturaEncuentro / 0.30);
  const numEncuentros = Math.round(perimExt / 3); // aproximación
  quantities['HBS_140'] = Math.round(numEncuentros * tornillosPorEncuentro + hbs140SoleraPiso + hbs140SoleraMadera);

  // Hex 14x3: paneles_techo_conv * 28 (ONLY techo conv)
  quantities['TORN_HEX_3'] = Math.round(paneles_techo_conv * 28);

  // Hex 14x5: paneles_techo_sandwich * 5.5 (ONLY techo sandwich) - 1 cada 0.40m por viga
  const tornillosPorVigaSandwich = Math.ceil(length / 0.4);
  quantities['HEX_T2_14X5'] = Math.round(numVigasTecho * tornillosPorVigaSandwich);

  // Fix 6x1: paneles_techo_conv * 11 (ONLY techo conv)
  quantities['FIX_6X1'] = Math.round(paneles_techo_conv * 11);

  // Fix 8x3: clavaderas a muro y techo - 1 por cruce, cruces cada 0.60m
  const lineasClavaderasMuro = Math.round(2.44 / 1.0); // ~2 líneas por muro
  const totalTornillosMuro = lineasClavaderasMuro * Math.ceil(perimExt / 0.6);
  const lineasClavaderasTecho = Math.round(length / 1.0);
  const totalTornillosTecho = lineasClavaderasTecho * Math.ceil(width / 0.6);
  quantities['FIX_8X3'] = totalTornillosMuro + totalTornillosTecho;

  // HBS 160mm: panel piso y panel techo SIP a vigas
  quantities['HBS_160'] = hbs160Floor + hbs160Roof;

  // HBS 200mm: vigas entrepiso a muro (apoyo)
  quantities['HBS_200'] = hbs200Entre;

  // Tel Hex 4" solera sobre estructura metálica
  quantities['TEL_HEX_4'] = telHex4SoleraMetal;

  // Herraje ángulo 90°: intersección viga principal × secundaria
  quantities['HERRAJE_ANGULO_90'] = herrajes;

  // Taco N10: encuentros SIP-mampostería
  quantities['TACO_N10'] = 0;

  // --- 4. FIJACION A PLATEA ---

  const plateaPerforaciones = !includeFloor && perimExt > 0 ? Math.max(1, Math.ceil(perimExt / 0.8)) : 0;

  // Varilla Roscada 1/2": only if NOT includeFloor (platea)
  // Cada varilla de 1m se corta en 4 pedazos de 25cm.
  if (!includeFloor) {
    quantities['VARILLA_12'] = Math.max(1, Math.ceil(plateaPerforaciones / 4));
  } else {
    quantities['VARILLA_12'] = 0;
  }

  // Kit Tuerca + Arandela: one kit per perforation
  quantities['KIT_TUERCA'] = plateaPerforaciones;

  // Anclaje Quimico: one cartucho per 15 perforations
  quantities['ANCLAJE_QUIMICO'] = plateaPerforaciones > 0 ? Math.max(1, Math.ceil(plateaPerforaciones / 15)) : 0;

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
  const actualInteriorWalls = Array.isArray(interiorWalls) ? interiorWalls : [];
  const q = calculateQuantities(geo, safeSelections, actualOpenings.length, prices, dimensions, foundationType, structureType, actualInteriorWalls, facadeConfigs || {});

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
