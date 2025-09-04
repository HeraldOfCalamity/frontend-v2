import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export type SpeechCommand = {
  command: string | string[] | RegExp
  callback: (...args: any[]) => void
  isFuzzyMatch?: boolean
  fuzzyMatchingThreshold?: number
  bestMatchOnly?: boolean
  matchInterim?: boolean
}

type Registry = Map<string, SpeechCommand[]>

type SpeechCtx = {
  transcript: string
  interimTranscript: string

  visibleTranscript: string
  visibleInterimTranscript: string

  listening: boolean
  dictationEnabled: boolean

  start: (opts?: Partial<Parameters<typeof SpeechRecognition.startListening>[0]>) => void
  stop: () => void
  resetTranscript: () => void

  enableDictation: () => void
  disableDictation: () => void
  toggleDictation: () => void

  resetVisibleTranscript: () => void
  resetVisibleTranscriptAndSyncPointer: () => void
  resetAllTranscripts: () => void

  setLanguage: (lang: string) => void

  browserSupportsSpeechRecognition: boolean
  isMicrophoneAvailable: boolean

  registerCommands: (id: string, cmds: SpeechCommand[]) => void
  unregisterCommands: (id: string) => void
}

const Ctx = createContext<SpeechCtx | null>(null)

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const [registry] = useState<Registry>(() => new Map())
  const [version, setVersion] = useState(0)
  const [language, setLanguageState] = useState('es-BO')
  const [dictationEnabled, setDictationEnabled] = useState(true)

  // Texto ya consolidado + ancla en el transcript crudo
  const [visibleBase, setVisibleBase] = useState('')       // segmentos previos “cerrados”
  const visibleBaseRef = useRef(visibleBase)
  useEffect(() => { visibleBaseRef.current = visibleBase }, [visibleBase])

  const [visibleTranscript, setVisibleTranscript] = useState('') // lo que ve el usuario
  const anchorRef = useRef<number>(0)                    // índice desde donde se acumula el tramo activo

  // Comandos de hijos
  const mergedCommands = useMemo(
    () => Array.from(registry.values()).flat(),
    [version, registry]
  )

  // Hook principal (sin tocar resultados)
  const {
    transcript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({ commands: mergedCommands })

  // Inicializar el ancla al montar
  useEffect(() => {
    anchorRef.current = transcript.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // === Acumulación del visible ===
  useEffect(() => {
    if (dictationEnabled) {
      // visible = base + tramo activo (si el motor reescribe, heredamos correcciones)
      const next = visibleBaseRef.current + transcript.slice(anchorRef.current)
      setVisibleTranscript(next)
    } else {
      // en mute: NO tocamos visible; solo descartamos backlog avanzando el ancla
      anchorRef.current = transcript.length
    }
  }, [transcript, dictationEnabled])

  // Interim visible solo si dictado ON (para no “parpadear” en mute)
  const visibleInterimTranscript = useMemo(
    () => (dictationEnabled ? interimTranscript : ''),
    [dictationEnabled, interimTranscript]
  )

  // === Control básico ===
  const start = useCallback((opts?: Partial<Parameters<typeof SpeechRecognition.startListening>[0]>) => {
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language,
      ...opts,
    })
  }, [language])

  const stop = useCallback(() => { void SpeechRecognition.stopListening() }, [])
  const setLanguage = useCallback((lang: string) => setLanguageState(lang), [])

  // === Dictado ON/OFF (sin parar el micro) ===
  const enableDictation = useCallback(() => {
    // reanudar: abrir nuevo tramo desde el final actual
    anchorRef.current = transcript.length
    setDictationEnabled(true)
  }, [transcript.length])

  const disableDictation = useCallback(() => {
    // consolidar tramo activo y congelar visible SIN parpadeo
    const snapshot = visibleBaseRef.current + transcript.slice(anchorRef.current)
    setVisibleBase(snapshot)        // cierra el tramo en la base
    setVisibleTranscript(snapshot)  // deja visible como está (consolida ya)
    anchorRef.current = transcript.length
    setDictationEnabled(false)
  }, [transcript.length])

  const toggleDictation = useCallback(() => {
    setDictationEnabled(d => {
      if (d) {
        // ON -> OFF
        const snapshot = visibleBaseRef.current + transcript.slice(anchorRef.current)
        setVisibleBase(snapshot)
        setVisibleTranscript(snapshot)
        anchorRef.current = transcript.length
      } else {
        // OFF -> ON
        anchorRef.current = transcript.length
      }
      return !d
    })
  }, [transcript.length])

  // === Resets ===
  const resetVisibleTranscript = useCallback(() => {
    // Borrar visible, empezar un nuevo capítulo a partir de ahora
    setVisibleBase('')
    setVisibleTranscript('')
    visibleBaseRef.current = ''
    anchorRef.current = transcript.length
  }, [transcript.length])

  const resetVisibleTranscriptAndSyncPointer = useCallback(() => {
    // Igual que el anterior en este modelo (sin backlog)
    setVisibleBase('')
    setVisibleTranscript('')
    visibleBaseRef.current = ''
    anchorRef.current = transcript.length
  }, [transcript.length])

  const resetAllTranscripts = useCallback(() => {
    setVisibleBase('')
    visibleBaseRef.current = ''
    setVisibleTranscript('')
    anchorRef.current = 0
    resetTranscript()
  }, [resetTranscript])

  // Limpieza al desmontar
  useEffect(() => {
    return () => { void SpeechRecognition.stopListening() }
  }, [])

  // Registro de comandos
  const registerCommands = useCallback((id: string, cmds: SpeechCommand[]) => {
    registry.set(id, cmds)
    setVersion(v => v + 1)
  }, [registry])

  const unregisterCommands = useCallback((id: string) => {
    registry.delete(id)
    setVersion(v => v + 1)
  }, [registry])

  const value: SpeechCtx = {
    transcript,
    interimTranscript,

    visibleTranscript,
    visibleInterimTranscript,

    listening,
    dictationEnabled,

    start,
    stop,
    resetTranscript,

    enableDictation,
    disableDictation,
    toggleDictation,

    resetVisibleTranscript,
    resetVisibleTranscriptAndSyncPointer,
    resetAllTranscripts,

    setLanguage,

    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,

    registerCommands,
    unregisterCommands,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSpeech() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSpeech debe usarse dentro de <SpeechProvider>')
  return ctx
}

export function useSpeechCommands(cmds: SpeechCommand[], deps: React.DependencyList = []) {
  const { registerCommands, unregisterCommands } = useSpeech()
  const idRef = useRef(`cmp_${Math.random().toString(36).slice(2)}`)
  useEffect(() => {
    registerCommands(idRef.current, cmds)
    return () => unregisterCommands(idRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
