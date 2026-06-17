'use client'

import React, { useState } from 'react'
import { WizardShell }  from '../shared/WizardShell'
import { StepPlano }    from '../shared/StepPlano'
import { StepDibujo }   from '../shared/StepDibujo'
import { Step1Forma }   from './steps/Step1Forma'
import { Step2Medidas } from './steps/Step2Medidas'
import { Step3Cimiento} from './steps/Step3Cimiento'
import { Step6Techo }   from './steps/Step6Techo'
import { Step7Opciones }from './steps/Step7Opciones'
import { Step8Resumen } from './steps/Step8Resumen'
import { useObraNuevaStore, STEP_LABELS_ON } from './store'

/**
 * Flujo lineal — 8 pasos, sin ramificaciones.
 *
 * 1 Forma → 2 Medidas → 3 Cimiento → 4 Plano → 5 Dibujo → 6 Techo → 7 Opciones → 8 Resumen
 */
export function ObraNuevaWizard() {
  const store = useObraNuevaStore()
  const [errorMessage, setErrorMessage] = useState('')
  const [hasWalls, setHasWalls] = useState(false)

  function validate(step: number): string | null {
    switch (step) {
      case 1:
        return store.forma ? null : 'Elegí la forma de la planta'
      case 2:
        if (store.largo < 1 || store.ancho < 1) return 'El largo y el ancho deben ser mayores a 1 m'
        return null
      case 3:
        return store.cimiento ? null : 'Elegí el tipo de cimiento'
      case 4:
        return null  // plano es opcional
      case 5:
        return hasWalls ? null : 'Dibujá al menos un muro para continuar'
      case 6:
        if (!store.techo) return 'Elegí el tipo de techo'
        if (store.pendiente < 2) return 'La pendiente mínima recomendada es 2%'
        return null
      default:
        return null
    }
  }

  function handleNext(): boolean {
    const msg = validate(store.currentStep)
    if (msg) {
      setErrorMessage(msg)
      setTimeout(() => setErrorMessage(''), 3000)
      return false
    }
    setErrorMessage('')
    store.goNext()
    return true
  }

  return (
    <WizardShell
      currentStep={store.currentStep}
      totalSteps={8}
      stepLabels={STEP_LABELS_ON}
      branchName="Obra nueva"
      accentColor="bg-amber-500"
      onNext={handleNext}
      onBack={() => { setErrorMessage(''); store.goBack() }}
      errorMessage={errorMessage}
    >
      {store.currentStep === 1 && (
        <Step1Forma
          value={store.forma}
          rotacion={store.rotacion}
          onChange={store.setForma}
          onRotar={store.rotar}
        />
      )}

      {store.currentStep === 2 && (
        <Step2Medidas
          forma={store.forma}
          rotacion={store.rotacion}
          largo={store.largo}
          ancho={store.ancho}
          alto={store.alto}
          onLargo={store.setLargo}
          onAncho={store.setAncho}
          onAlto={store.setAlto}
          dimExtras={store.dimExtras}
onDimExtra={store.setDimExtra}
        />
      )}

      {store.currentStep === 3 && (
        <Step3Cimiento
          value={store.cimiento}
          onChange={store.setCimiento}
        />
      )}

      {store.currentStep === 4 && (
        <StepPlano
          context="ampliacion"     // reutilizamos el copy de "plano existente"
          plano={store.plano}
          onPlano={store.setPlano}
        />
      )}

      {store.currentStep === 5 && (
        <StepDibujo
          planoFile={store.plano}
          largo={store.largo}
          ancho={store.ancho}
          context="ampliacion"
          onHasWalls={setHasWalls}
        />
      )}

      {store.currentStep === 6 && (
        <Step6Techo
          value={store.techo}
          orientacionAgua={store.orientacionAgua}
          pendiente={store.pendiente}
          alturaCumbrera={store.alturaCumbrera}
          pendienteNegativa={store.pendienteNegativa}
          onChange={store.setTecho}
          onOrientacion={store.setOrientacionAgua}
          onPendiente={store.setPendiente}
          onAlturaCumbrera={store.setAlturaCumbrera}
          onPendienteNegativa={store.setPendienteNegativa}
        />
      )}

      {store.currentStep === 7 && (
        <Step7Opciones
          opciones={store.opciones}
          onChange={store.setOpciones}
        />
      )}

      {store.currentStep === 8 && (
        <Step8Resumen
          state={{
            forma:              store.forma,
            rotacion:           store.rotacion,
            largo:              store.largo,
            ancho:              store.ancho,
            alto:               store.alto,
            cimiento:           store.cimiento,
            plano:              store.plano,
            techo:              store.techo,
            orientacionAgua:    store.orientacionAgua,
            pendiente:          store.pendiente,
            alturaCumbrera:     store.alturaCumbrera,
            pendienteNegativa:  store.pendienteNegativa,
            opciones:           store.opciones,
          }}
          onReset={store.reset}
        />
      )}
    </WizardShell>
  )
}
