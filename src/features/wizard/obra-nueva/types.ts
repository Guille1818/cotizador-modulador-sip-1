export type FormaPlanta = 'rect' | 'L' | 'C' | 'T' | 'cruz'

/** Grados acumulativos — sube de a 90 sin límite para que CSS anime suave */
export type RotacionForma = number

export type TipoCimiento = 'platea' | 'elevada'

export type TipoTecho =
  | 'plano'
  | '1agua'
  | '2aguas'
  | '2aguas_desf'
  | '4aguas_puntual'
  | '4aguas_cumbrera'
  | 'desnivel'

export type OrientacionAgua = 'N' | 'S' | 'E' | 'O'

export interface OpcionesTecnicas {
  panelExterior:  'osb' | 'cemento' | 'yeso'
  panelInterior:  'osb' | 'yeso'   | 'cemento'
  sistemaTecho:   'sip_osb' | 'sandwich'
  estructura:     'madera' | 'metal'
}

export interface ObraNuevaState {
  forma:    FormaPlanta | null
  /** Grados acumulativos — aumenta de a 90 indefinidamente */
  rotacion: number

  largo:  number
  ancho:  number
  alto:   number

  cimiento: TipoCimiento | null
  plano: File | null

  techo:             TipoTecho | null
  orientacionAgua:   OrientacionAgua
  pendiente:         number
  alturaCumbrera:    number
  pendienteNegativa: boolean
  dimExtras: Record<string, number>

  opciones: OpcionesTecnicas
}

export const DEFAULT_OPCIONES: OpcionesTecnicas = {
  panelExterior: 'osb',
  panelInterior: 'osb',
  sistemaTecho:  'sip_osb',
  estructura:    'madera',
}
