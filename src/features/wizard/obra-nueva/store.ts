import { create } from 'zustand'
import type {
  ObraNuevaState, FormaPlanta, TipoCimiento,
  TipoTecho, OrientacionAgua, OpcionesTecnicas,
} from './types'
import { DEFAULT_OPCIONES } from './types'

interface ObraNuevaStore extends ObraNuevaState {
  currentStep: number
  setForma:              (v: FormaPlanta) => void
  /** Suma 90° al acumulador — el CSS transition hace el giro animado */
  rotar:                 () => void
  setLargo:              (v: number) => void
  setAncho:              (v: number) => void
  setAlto:               (v: number) => void
  setCimiento:           (v: TipoCimiento) => void
  setPlano:              (file: File | null) => void
  setTecho:              (v: TipoTecho) => void
  setOrientacionAgua:    (v: OrientacionAgua) => void
  setPendiente:          (v: number) => void
  setAlturaCumbrera:     (v: number) => void
  setPendienteNegativa:  (v: boolean) => void
  setDimExtra: (key: string, v: number) => void
  setOpciones:           (patch: Partial<OpcionesTecnicas>) => void
  goNext: () => void
  goBack: () => void
  reset:  () => void
}

export const STEP_LABELS_ON = [
  'Forma de planta',
  'Medidas',
  'Cimiento',
  'Plano (opcional)',
  'Dibujo',
  'Techo',
  'Opciones técnicas',
  'Resumen',
]

const INITIAL: ObraNuevaState = {
  forma:             null,
  rotacion:          0,       // número puro, crece de a 90 sin wrapping
  largo:             8,
  ancho:             5,
  alto:              2.7,
  cimiento:          null,
  plano:             null,
  techo:             null,
  orientacionAgua:   'N',
  pendiente:         15,
  alturaCumbrera:    1.2,
  pendienteNegativa: false,
  dimExtras: {},
  opciones:          DEFAULT_OPCIONES,
}

export const useObraNuevaStore = create<ObraNuevaStore>((set) => ({
  ...INITIAL,
  currentStep: 1,

  setForma:   (forma)   => set({ forma, rotacion: 0 }),
  // +90 sin módulo → CSS interpola siempre en la dirección correcta
  rotar:      ()        => set((s) => ({ rotacion: s.rotacion + 90 })),
  setLargo:   (largo)   => set({ largo }),
  setAncho:   (ancho)   => set({ ancho }),
  setAlto:    (alto)    => set({ alto }),
  setCimiento:(cimiento)=> set({ cimiento }),
  setPlano:   (plano)   => set({ plano }),
  setTecho:   (techo)   => set({ techo }),
  setOrientacionAgua:   (v) => set({ orientacionAgua: v }),
  setPendiente:         (v) => set({ pendiente: v }),
  setAlturaCumbrera:    (v) => set({ alturaCumbrera: v }),
  setPendienteNegativa: (v) => set({ pendienteNegativa: v }),
  setDimExtra: (key, v) => set((s) => ({ dimExtras: { ...s.dimExtras, [key]: v } })),
  setOpciones: (patch)  => set((s) => ({ opciones: { ...s.opciones, ...patch } })),

  goNext: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 8) })),
  goBack: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  reset:  () => set({ ...INITIAL, currentStep: 1 }),
}))
