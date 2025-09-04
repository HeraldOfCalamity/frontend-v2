import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export type SpeechCommand = {
  command: string | string[] | RegExp
  callback: (...args: any[]) => void
  isFuzzyMatch?: boolean
  fuzzyMatchingThreshold?: number
  bestMatchOnly?: boolean
  matchInterim?: boolean
  hideFromTranscript?: boolean
}

type Registry = Map<string, SpeechCommand[]>

type SpeechCtx = {
  visibleTranscript: string
  visibleInterimTranscript: string
  listening: boolean
  dictationEnabled: boolean
  start: (opts?: Partial<Parameters<typeof SpeechRecognition.startListening>[0]>) => void
  stop: () => void
  enableDictation: () => void
  disableDictation: () => void
  toggleDictation: () => void
  resetVisibleTranscript: () => void
  setLanguage: (lang: string) => void
  browserSupportsSpeechRecognition: boolean
  isMicrophoneAvailable: boolean
  registerCommands: (id: string, cmds: SpeechCommand[]) => void
  unregisterCommands: (id: string) => void
}

const Ctx = createContext<SpeechCtx | null>(null)

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function stringToHideRegex(cmd: string): RegExp {
  const parts = cmd.split('*').map(p => escapeRegex(p.trim()))
  if (parts.length === 1) return new RegExp(`\\b${parts[0]}\\b`, 'gi')
  const joined = parts.join('[^.,;!?]*?')
  return new RegExp(`\\b${joined}\\b?[^.,;!?]*?`, 'gi')
}

function buildHideRegexes(registry: Registry): RegExp[] {
  const res: RegExp[] = []
  for (const list of registry.values()) {
    for (const c of list) {
      if (c.hideFromTranscript === false) continue
      const cmd = c.command
      if (typeof cmd === 'string') res.push(stringToHideRegex(cmd))
      else if (Array.isArray(cmd)) cmd.forEach(s => typeof s === 'string' && res.push(stringToHideRegex(s)))
      else if (cmd instanceof RegExp) res.push(cmd)
    }
  }
  return res
}

export function SpeechProvider({ children }: { children: React.ReactNode }) {
  const [registry] = useState<Registry>(() => new Map())
  const [version, setVersion] = useState(0)
  const [language, setLanguageState] = useState('es-BO')
  const [dictationEnabled, setDictationEnabled] = useState(true)

  const [visibleTranscript, setVisibleTranscript] = useState('')
  const prevRawTranscriptRef = useRef('')

  // ✅ ref para usar reset en cualquier callback
  const resetRef = useRef<() => void>(() => {})

  // ✅ commands envueltos para auto-limpiar (usan resetRef)
  const wrappedCommands = useMemo(() => {
    const all = Array.from(registry.values()).flat()
    return all.map((c) => {
      const cb = (...args: any[]) => {
        try {
          c.callback?.(...args)
        } finally {
          if (c.hideFromTranscript !== false) {
            resetRef.current()
            prevRawTranscriptRef.current = ''
          }
        }
      }
      return { ...c, callback: cb }
    })
  }, [version, registry])

  // --- Hook principal del STT, usando comandos envueltos ---
  const {
    transcript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({ commands: wrappedCommands })

  // ✅ mantener el ref actualizado
  useEffect(() => { resetRef.current = resetTranscript }, [resetTranscript])

  const hideRegexes = useMemo(() => buildHideRegexes(registry), [version, registry])

  const visibleInterimTranscript = useMemo(() => {
    let s = interimTranscript || ''
    for (const r of hideRegexes) s = s.replace(r, '')
    s = s.replace(/\s{2,}/g, ' ').replace(/\s+([.,;!?])/g, '$1')
    return s.trim()
  }, [interimTranscript, hideRegexes])

  useEffect(() => {
    const prev = prevRawTranscriptRef.current
    if (transcript.length >= prev.length) {
      let delta = transcript.slice(prev.length)
      for (const r of hideRegexes) delta = delta.replace(r, '')
      delta = delta.replace(/\s{2,}/g, ' ').replace(/\s+([.,;!?])/g, '$1').trim()
      if (dictationEnabled && delta) {
        setVisibleTranscript((b) => (b + (b && !b.endsWith(' ') ? ' ' : '') + delta).trim())
      }
    }
    prevRawTranscriptRef.current = transcript
  }, [transcript, hideRegexes, dictationEnabled])

  const start = useCallback((opts?: Partial<Parameters<typeof SpeechRecognition.startListening>[0]>) => {
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language,
      ...opts,
    })
  }, [language])

  const stop = useCallback(() => SpeechRecognition.stopListening(), [])

  const enableDictation = useCallback(() => {
    setDictationEnabled(true)
    resetRef.current()                 // ✅
    prevRawTranscriptRef.current = ''
  }, [])

  const disableDictation = useCallback(() => {
    setDictationEnabled(false)
    resetRef.current()                 // ✅
    prevRawTranscriptRef.current = ''
  }, [])

  const toggleDictation = useCallback(() => {
    setDictationEnabled(d => {
      resetRef.current()               // ✅
      prevRawTranscriptRef.current = ''
      return !d
    })
  }, [])

  const resetVisibleTranscript = useCallback(() => {
    setVisibleTranscript('')
    resetRef.current()                 // ✅
    prevRawTranscriptRef.current = ''
  }, [])

  const setLanguage = useCallback((lang: string) => setLanguageState(lang), [])

  const registerCommands = useCallback((id: string, cmds: SpeechCommand[]) => {
    registry.set(id, cmds)
    setVersion(v => v + 1)
  }, [registry])

  const unregisterCommands = useCallback((id: string) => {
    registry.delete(id)
    setVersion(v => v + 1)
  }, [registry])

  useEffect(() => {
    return () => {
        void SpeechRecognition.stopListening()
    }
    
  }, [])

  const value: SpeechCtx = {
    visibleTranscript,
    visibleInterimTranscript,
    listening,
    dictationEnabled,
    start, stop,
    enableDictation, disableDictation, toggleDictation,
    resetVisibleTranscript,
    setLanguage,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    registerCommands, unregisterCommands,
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
