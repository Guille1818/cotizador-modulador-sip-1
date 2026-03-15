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
  hideSideWall?: boolean;
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

// === Geometry Result Types ===

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
