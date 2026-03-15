export interface HousePreset {
  id: string;
  name: string;
  description: string;
  rooms: number;
  dimensions: {
    width: number;
    length: number;
    height: number;
    ridgeHeight: number;
  };
  foundationType: 'platea' | 'estructura';
  structureType: 'madera' | 'metal';
  roofSystem: 'sip' | 'sandwich';
  exteriorWallId: string;
  interiorWallId: string;
  roofId: string;
  floorId: string;
  icon: string;
}

export const HOUSE_PRESETS: HousePreset[] = [
  {
    id: 'monoambiente-compacto',
    name: 'Monoambiente Compacto',
    description: 'Unidad minima habitable ideal para vivienda de emergencia, estudio o deposito climatizado. 24 m² de superficie.',
    rooms: 1,
    dimensions: {
      width: 4,
      length: 6,
      height: 2.44,
      ridgeHeight: 3.2,
    },
    foundationType: 'estructura',
    structureType: 'madera',
    roofSystem: 'sandwich',
    exteriorWallId: 'OSB-70-E',
    interiorWallId: 'OSB-70-DECO',
    roofId: 'SAND-OSB-80-M2',
    floorId: 'PISO-OSB-70',
    icon: '🏠',
  },
  {
    id: 'monoambiente-amplio',
    name: 'Monoambiente Amplio',
    description: 'Espacio unico integrado con cocina, living y dormitorio. 35 m² con buena ventilacion y luminosidad.',
    rooms: 1,
    dimensions: {
      width: 5,
      length: 7,
      height: 2.44,
      ridgeHeight: 3.5,
    },
    foundationType: 'platea',
    structureType: 'madera',
    roofSystem: 'sip',
    exteriorWallId: 'OSB-70-E',
    interiorWallId: 'OSB-70-DECO',
    roofId: 'TECHO-OSB-70',
    floorId: 'PISO-OSB-70',
    icon: '🏡',
  },
  {
    id: 'casa-2-ambientes',
    name: 'Casa 2 Ambientes',
    description: 'Distribucion clasica con dormitorio separado y living-comedor integrado. 48 m², ideal para pareja o familia pequena.',
    rooms: 2,
    dimensions: {
      width: 6,
      length: 8,
      height: 2.44,
      ridgeHeight: 3.5,
    },
    foundationType: 'platea',
    structureType: 'madera',
    roofSystem: 'sip',
    exteriorWallId: 'OSB-70-E',
    interiorWallId: 'OSB-70-DECO',
    roofId: 'TECHO-OSB-70',
    floorId: 'PISO-OSB-70',
    icon: '🏘',
  },
  {
    id: 'casa-3-ambientes',
    name: 'Casa 3 Ambientes',
    description: 'Vivienda familiar completa con 2 dormitorios, living-comedor y cocina diferenciada. 80 m² de superficie cubierta.',
    rooms: 3,
    dimensions: {
      width: 8,
      length: 10,
      height: 2.44,
      ridgeHeight: 3.8,
    },
    foundationType: 'platea',
    structureType: 'madera',
    roofSystem: 'sip',
    exteriorWallId: 'OSB-70-E',
    interiorWallId: 'OSB-70-DECO',
    roofId: 'TECHO-OSB-70',
    floorId: 'PISO-OSB-70',
    icon: '🏠',
  },
  {
    id: 'casa-4-ambientes',
    name: 'Casa 4 Ambientes',
    description: 'Casa amplia con 3 dormitorios, living, comedor y cocina independiente. 120 m², optima para familia numerosa.',
    rooms: 4,
    dimensions: {
      width: 10,
      length: 12,
      height: 2.44,
      ridgeHeight: 4.0,
    },
    foundationType: 'platea',
    structureType: 'metal',
    roofSystem: 'sip',
    exteriorWallId: 'OSB-70-E',
    interiorWallId: 'OSB-70-DECO',
    roofId: 'TECHO-OSB-70',
    floorId: 'PISO-OSB-70',
    icon: '🏗',
  },
  {
    id: 'cabana',
    name: 'Cabana',
    description: 'Cabana de montana con techo a dos aguas pronunciado. 20 m² con altura generosa y estetica rustica.',
    rooms: 1,
    dimensions: {
      width: 4,
      length: 5,
      height: 2.44,
      ridgeHeight: 4.5,
    },
    foundationType: 'estructura',
    structureType: 'madera',
    roofSystem: 'sandwich',
    exteriorWallId: 'OSB-70-E',
    interiorWallId: 'OSB-70-DECO',
    roofId: 'SAND-OSB-80-M2',
    floorId: 'PISO-OSB-70',
    icon: '⛺',
  },
  {
    id: 'oficina-local',
    name: 'Oficina / Local',
    description: 'Modulo comercial o de trabajo con techo plano racionalizado. 30 m², facil de replicar y ampliar.',
    rooms: 1,
    dimensions: {
      width: 5,
      length: 6,
      height: 2.6,
      ridgeHeight: 2.6,
    },
    foundationType: 'platea',
    structureType: 'metal',
    roofSystem: 'sandwich',
    exteriorWallId: 'OSB-70-E',
    interiorWallId: 'OSB-70-DECO',
    roofId: 'SAND-OSB-80-M2',
    floorId: 'PISO-OSB-70',
    icon: '🏢',
  },
  {
    id: 'duplex',
    name: 'Duplex',
    description: 'Modulo de dos unidades espejadas comparte medianera SIP. 60 m² totales, ideal para inversion o alquiler.',
    rooms: 2,
    dimensions: {
      width: 6,
      length: 10,
      height: 2.44,
      ridgeHeight: 3.5,
    },
    foundationType: 'platea',
    structureType: 'metal',
    roofSystem: 'sip',
    exteriorWallId: 'OSB-70-E',
    interiorWallId: 'OSB-70-DECO',
    roofId: 'TECHO-OSB-70',
    floorId: 'PISO-OSB-70',
    icon: '🏛',
  },
];
