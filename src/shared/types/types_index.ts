// === Core Domain Types ===

export interface ProjectInfo {
  benefits: string;
  extraNotes: string;
  adjustmentPercentage: number;
  showEarlyPaymentDiscount: boolean;
}

export interface Recess {
  id: string;
  side: FacadeSide;
  x: number;
  width: number;
  depth: number;
  height: number;
  hideBase?: boolean;
  hideSideWall?: boolean; // El viewer-3d detecta automáticamente inicio/fin por la posición x
}

export interface Project {
  budgetNumber: string;
  status: string;
  clientName: string;
  cuit: string;
  phone: string;
  email: string;
  location: string;
  date: string;
  projectInfo: ProjectInfo;
  recesses: Recess[];
  perimeterVisibility: Record<FacadeSide, boolean>;
  overrides: Record<string, ProductOverride>;
  finalTotal?: number;
}

export interface ProductOverride {
  qty?: number;
  price?: number;
  name?: string;
  unit?: string;
  category?: string;
}

export type FacadeSide = 'Norte' | 'Sur' | 'Este' | 'Oeste';
export type FacadeType = 'recto' | 'inclinado' | '2-aguas';

export interface FacadeConfig {
  type: FacadeType;
  hBase: number;
  hMax: number;
}

export interface Dimensions {
  width: number;
  length: number;
  height: number;
  ridgeHeight: number;
}

export interface PerimeterWall {
  id: string;
  side: FacadeSide;
}

export interface InteriorWall {
  id: string;
  x?: number;
  y?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  length?: number;
  [key: string]: unknown;
}

export type OpeningType = 'window' | 'door';

export interface Opening {
  id: string;
  side: FacadeSide;
  type: OpeningType;
  width: number;
  height: number;
  x: number;
  y: number;
  recessId: string | null;
  recessWall: string | null;
  isOutward: boolean;
}

export interface Selections {
  exteriorWallId: string;
  interiorWallId: string;
  roofId: string;
  floorId: string;
  roofSystem: 'sip' | 'sandwich';
  includeExterior: boolean;
  includeInterior: boolean;
  includeRoof: boolean;
  includeFloor: boolean;
  includeEngineeringDetail: boolean;
  interiorWallHeightMode: 'roof' | 'panel';
}

export type FoundationType = 'platea' | 'estructura';
export type StructureType = 'madera' | 'metal';

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: string;
}

export interface CustomMeasurement {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface CRMEntry {
  id: string;
  date: string;
  client: string;
  email: string;
  phone: string;
  location: string;
  area: number;
  status: string;
  total: number;
  budgetNumber?: string;
  cuit?: string;
}

export interface Defaults {
  benefits: string;
  extraNotes: string;
}

export interface FacadeStats {
  area: number;
  panels: number;
  openingML: number;
  perimPanels: number;
  isVisible: boolean;
}

export interface GeometryResult {
  perimExt: number;
  areaPiso: number;
  areaTecho: number;
  cantMurosExt: number;
  cantMurosInt: number;
  cantPiso: number;
  cantTecho: number;
  perimMurosExt: number;
  perimMurosInt: number;
  perimPiso: number;
  perimTecho: number;
  totalPaneles: number;
  tabiques: number;
  areaMurosBruta: number;
  areaMuros: number;
  perimAberturas: number;
  perimLinealPaneles: number;
  totalAberturasCount: number;
  sides: Record<string, FacadeStats>;
}

export interface BudgetItem extends Product {
  qty: number;
  total: number;
  isOverridden: boolean;
}

export interface BudgetResult {
  items: BudgetItem[];
  total: number;
  subtotal: number;
}

export interface Clipboard {
  type: 'wall';
  data: InteriorWall;
}

export type RoomType =
  | 'dormitorio' | 'bano' | 'cocina' | 'living'
  | 'comedor' | 'lavadero' | 'estudio' | 'garage' | 'otro';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
}

export interface SavedDesign {
  id: string;
  name: string;
  date: string;
  dimensions: Dimensions;
  interiorWalls: InteriorWall[];
  perimeterWalls: PerimeterWall[];
  openings: Opening[];
  facadeConfigs: Record<FacadeSide, FacadeConfig>;
  selections: Selections;
  foundationType: FoundationType;
  structureType: StructureType;
  rooms: Room[];
  recesses: Recess[];
  perimeterVisibility: Record<FacadeSide, boolean>;
  area: number;
  totalPanels: number;
  roomCount: number;
  bathroomCount: number;
}

// ─── Shape System ─────────────────────────────────────────────────────────────
// Rotación de 90° en 90°. El viewer-3d no requiere cambios.
// L/T usan hideSideWall:true + posición x para determinar qué esquina se recorta.

export type ShapeVariant =
  | 'rectangular'
  | 'L-0' | 'L-90' | 'L-180' | 'L-270'   // 4 rotaciones
  | 'C-0' | 'C-90' | 'C-180' | 'C-270'   // 4 rotaciones
  | 'T-0' | 'T-90' | 'T-180' | 'T-270'   // 4 rotaciones
  | 'cruz';                                // simétrica, sin rotación

export type ShapeType = 'rectangular' | 'L' | 'C' | 'T' | 'cruz';
