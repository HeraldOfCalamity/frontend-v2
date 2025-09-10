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
  hardStop: () => void
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

  // Texto consolidado + visible derivado
  const [visibleBase, setVisibleBase] = useState('')
  const visibleBaseRef = useRef(visibleBase)
  useEffect(() => { visibleBaseRef.current = visibleBase }, [visibleBase])

  const [visibleTranscript, setVisibleTranscript] = useState('')
  const visibleTranscriptRef = useRef(visibleTranscript)
  useEffect(() => { visibleTranscriptRef.current = visibleTranscript }, [visibleTranscript])

  const anchorRef = useRef<number>(0) // índice desde donde acumulamos tramo activo

  // Hook principal
  const {
    transcript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    commands: useMemo(() => Array.from(registry.values()).flat(), [version, registry])
  })

  // Mantener un ref con transcript.length para no pinchar deps de callbacks
  const transcriptLenRef = useRef(0)
  useEffect(() => { transcriptLenRef.current = transcript.length }, [transcript.length])

  // Inicializar ancla al montar
  useEffect(() => {
    anchorRef.current = transcript.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Acumulación del visible
  useEffect(() => {
    if (dictationEnabled) {
      const next = visibleBaseRef.current + transcript.slice(anchorRef.current)
      // Evita sets redundantes (no es obligatorio, pero reduce renders)
      if (next !== visibleTranscriptRef.current) setVisibleTranscript(next)
    } else {
      // en mute: no cambiamos visible, solo “saltamos” backlog
      anchorRef.current = transcript.length
    }
  }, [transcript, dictationEnabled])

  // Interim visible solo si dictado ON
  const visibleInterimTranscript = useMemo(
    () => (dictationEnabled ? interimTranscript : ''),
    [dictationEnabled, interimTranscript]
  )

  // Control básico
  const start = useCallback((opts?: Partial<Parameters<typeof SpeechRecognition.startListening>[0]>) => {
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language,
      ...opts,
    })
  }, [language])

  const stop = useCallback(() => { void SpeechRecognition.stopListening() }, [])

  const hardStop = useCallback(() => {
    // 1) congelar visible como hace disableDictation (sin depender de los comp.)
    const snapshot = visibleBaseRef.current + 
                    (transcriptLenRef.current >= anchorRef.current
                      ? transcript.slice(anchorRef.current)
                      : '');
    setVisibleBase(snapshot);
    setVisibleTranscript(snapshot);
    anchorRef.current = transcriptLenRef.current;
    setDictationEnabled(false);

    // 2) detener y ABORTAR (Android/Chrome)
    try { SpeechRecognition.stopListening(); } catch {}
    setTimeout(() => { try { SpeechRecognition.abortListening?.(); } catch {} }, 0);

    // 3) limpiar posibles restos del motor
    setTimeout(() => resetTranscript(), 0);
  }, [resetTranscript]);
  
  const setLanguage = useCallback((lang: string) => setLanguageState(lang), [])

  // === Dictado ON/OFF (callbacks ESTABLES, sin depender de transcript.length) ===
  const enableDictation = useCallback(() => {
    anchorRef.current = transcriptLenRef.current // abrir nuevo tramo
    setDictationEnabled(true)
  }, [])

  const disableDictation = useCallback(() => {
    // consolidar tramo activo y congelar visible
    const snapshot = visibleBaseRef.current + 
                     (transcriptLenRef.current >= anchorRef.current
                       ? transcript.slice(anchorRef.current)
                       : '') // por seguridad si el motor “resetea”
    setVisibleBase(snapshot)
    setVisibleTranscript(snapshot)
    anchorRef.current = transcriptLenRef.current
    setDictationEnabled(false)
  }, [transcript])

  const toggleDictation = useCallback(() => {
    setDictationEnabled(d => {
      if (d) {
        const snapshot = visibleBaseRef.current + 
                         (transcriptLenRef.current >= anchorRef.current
                           ? transcript.slice(anchorRef.current)
                           : '')
        setVisibleBase(snapshot)
        setVisibleTranscript(snapshot)
        anchorRef.current = transcriptLenRef.current
      } else {
        anchorRef.current = transcriptLenRef.current
      }
      return !d
    })
  }, [transcript])

  // Resets
  const resetVisibleTranscript = useCallback(() => {
    setVisibleBase('')
    setVisibleTranscript('')
    visibleBaseRef.current = ''
    visibleTranscriptRef.current = ''
    anchorRef.current = transcriptLenRef.current
  }, [])

  const resetVisibleTranscriptAndSyncPointer = useCallback(() => {
    setVisibleBase('')
    setVisibleTranscript('')
    visibleBaseRef.current = ''
    visibleTranscriptRef.current = ''
    anchorRef.current = transcriptLenRef.current
  }, [])

  const resetAllTranscripts = useCallback(() => {
    setVisibleBase('')
    visibleBaseRef.current = ''
    setVisibleTranscript('')
    visibleTranscriptRef.current = ''
    anchorRef.current = 0
    resetTranscript()
  }, [resetTranscript])

  // Limpieza al desmontar
  useEffect(() => () => { void SpeechRecognition.stopListening() }, [])

  // Registro de comandos
  const registerCommands = useCallback((id: string, cmds: SpeechCommand[]) => {
    const prev = registry.get(id)
    if (prev === cmds) return          // nada que hacer
    registry.set(id, cmds)
    setVersion(v => v + 1)
  }, [registry])

  const unregisterCommands = useCallback((id: string) => {
    if (!registry.has(id)) return      // evita setVersion en vacío
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
    hardStop,
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

export function useSpeechCommands(cmds: SpeechCommand[], _deps: React.DependencyList = []) {
  const { registerCommands, unregisterCommands } = useSpeech()
  const idRef = useRef(`cmp_${Math.random().toString(36).slice(2)}`)

  // Mantiene SIEMPRE la referencia al array de comandos más reciente
  const cmdsRef = useRef(cmds)
  useEffect(() => { cmdsRef.current = cmds }, [cmds])

  // Construimos una copia ESTABLE que proxiea callbacks al cmdsRef actual
  const stableCmds = useMemo<SpeechCommand[]>(() => {
    return cmds.map((c, idx) => {
      const origCb = c.callback
      // callback estable que llama a la versión más nueva
      const proxiedCb = (...args: any[]) => {
        const current = cmdsRef.current[idx]
        current?.callback?.(...args)
      }
      return { ...c, callback: proxiedCb }
    })
    // 👇 deps vacías ⇒ identidad estable
  }, [])

  useEffect(() => {
    registerCommands(idRef.current, stableCmds)
    return () => unregisterCommands(idRef.current)
  }, [registerCommands, unregisterCommands, stableCmds])
}

