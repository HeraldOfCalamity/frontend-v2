import { Box, Grid, InputLabel, Stack, Typography, Button } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpeech, useSpeechCommands } from "../../../context/SpeechContext";

/** Claves de los 4 campos */
type FieldKey = "personales" | "familiares" | "condicion" | "intervencion";

/** Texto consolidado por campo */
type Store = Record<FieldKey, string>;

/* =========================
   (Opcional) Limpieza a posteriori
   ========================= */
function cleanCommandsLater(text: string): string {
  const patterns: RegExp[] = [
    // activar/silenciar micrófono
    /(?:^|\s)silenciar\s+micr[oó]f?o?no?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)activar\s+micr[oó]f?o?no?(?=\s|[.,;:!?]|$)/giu,
    // dictar …
    /(?:^|\s)dictar\s+(?:antecedentes\s+)?personales(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:antecedentes\s+)?familiares(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:condici[oó]n(?:\s+actual)?|actual)(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:intervenci[oó]n(?:\s+cl[ií]nica)?|cl[ií]nica)(?=\s|[.,;:!?]|$)/giu,
  ];
  let out = text;
  for (const re of patterns) out = out.replace(re, "");
  out = out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
  return out;
}

/* =========================
   Hook: ejecutar cuando el interino queda “estable” (silencio breve)
   ========================= */
function useExecuteWhenFinal(interimTranscript: string, delayMs = 450) {
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!pendingRef.current) return;

    // Si hay interino, rearmamos el timer
    if (interimTranscript) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        // volverá a evaluar en siguiente render
      }, delayMs);
      return;
    }

    // Si NO hay interino, esperamos un poquito y ejecutamos
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const fn = pendingRef.current;
      pendingRef.current = null;
      fn?.();
    }, delayMs);
  }, [interimTranscript, delayMs]);

  return {
    schedule: (fn: () => void) => { pendingRef.current = fn; },
    cancel: () => { pendingRef.current = null; if (timerRef.current) window.clearTimeout(timerRef.current); },
  };
}

/* =========================
   Regex de comandos (anclados al final)
   ========================= */
const END = String.raw`[\s.,;:!?]*$`;
const RE_SILENCIAR = new RegExp(String.raw`(?:^|\s)silenciar\s+micr(?:o|ó)fono${END}`, 'i');
const RE_ACTIVAR   = new RegExp(String.raw`(?:^|\s)activar\s+micr(?:o|ó)fono${END}`, 'i');
const RE_TERMINAR  = new RegExp(String.raw`(?:^|\s)(terminar|detener)\s+dictado${END}`, 'i');

const RE_DICTAR = new RegExp(
  String.raw`(?:^|\s)dictar\s+` +
  String.raw`(` +
    String.raw`antecedentes\s+personales|` +
    String.raw`antecedentes\s+familiares|` +
    String.raw`condici(?:o|ó)n(?:\s+actual)?|` +
    String.raw`intervenci(?:o|ó)n(?:\s+cl[ií]nica)?|` +
    String.raw`cl[ií]nica|personales|familiares` +
  String.raw`)` +
  END,
  'i'
);

/* =========================
   Map de campo capturado → clave interna
   ========================= */
function mapCampo(str: string): FieldKey {
  const s = str.toLowerCase();
  if (s.includes('famil')) return 'familiares';
  if (s.includes('condici')) return 'condicion';
  if (s.includes('intervenc') || s.includes('clínica') || s.includes('clinica')) return 'intervencion';
  return 'personales';
}

/* =========================
   Componente
   ========================= */
export default function Anamnesis() {
  const {
    transcript,
    interimTranscript,
    dictationEnabled,
    resetAllTranscripts,
    enableDictation,
    disableDictation,
    stop,
  } = useSpeech();

  const execFinal = useExecuteWhenFinal(interimTranscript, 450);

  // Campo activo
  const [active, setActive] = useState<FieldKey>("personales");

  // Texto consolidado por campo
  const [store, setStore] = useState<Store>({
    personales: "",
    familiares: "",
    condicion: "",
    intervencion: "",
  });

  // Ancla por campo (desde dónde leer del transcript crudo)
  const anchorsRef = useRef<Record<FieldKey, number>>({
    personales: transcript.length,
    familiares: transcript.length,
    condicion: transcript.length,
    intervencion: transcript.length,
  });

  // Detectar ON->OFF para consolidar automáticamente
  const prevDictRef = useRef(dictationEnabled);
  useEffect(() => { prevDictRef.current = dictationEnabled }, [dictationEnabled]);

  // Re-sincronizar anclas si el transcript crudo se resetea
  useEffect(() => {
    (Object.keys(anchorsRef.current) as FieldKey[]).forEach(k => {
      if (anchorsRef.current[k] > transcript.length) {
        anchorsRef.current[k] = transcript.length;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript.length]);

  /** Consolida lo hablado del campo activo (NO limpia comandos en tiempo real) */
  const commitActive = useCallback(() => {
    const start = anchorsRef.current[active];
    const chunk = transcript.slice(start); // dejamos el comando si vino, se limpia después
    if (chunk) {
      setStore(prev => ({ ...prev, [active]: prev[active] + chunk }));
    }
    anchorsRef.current[active] = transcript.length;
  }, [active, transcript]);

  /** Cambiar de campo: consolida el actual y arranca un tramo nuevo en el destino */
  const selectField = useCallback((next: FieldKey) => {
    commitActive();
    setActive(next);
    anchorsRef.current[next] = transcript.length; // evita arrastrar la orden
  }, [commitActive, transcript.length]);

  // Al mutear (ON -> OFF) consolida
  useEffect(() => {
    const prev = prevDictRef.current;
    if (prev && !dictationEnabled) {
      commitActive();
    }
  }, [dictationEnabled, commitActive]);

  // Vista por campo: el activo muestra base + slice en vivo (incluyendo comandos)
  const view = useMemo(() => {
    const slice = dictationEnabled ? transcript.slice(anchorsRef.current[active]) : "";
    return {
      personales: active === "personales" ? (store.personales + slice) : store.personales,
      familiares: active === "familiares" ? (store.familiares + slice) : store.familiares,
      condicion:  active === "condicion"  ? (store.condicion  + slice) : store.condicion,
      intervencion: active === "intervencion" ? (store.intervencion + slice) : store.intervencion,
    } as Store;
  }, [store, active, dictationEnabled, transcript]);

  /* ====== Comandos de voz (esperan resultado final) ====== */
  const commands = useMemo(() => ([
    // Silenciar (final + gate por silencio)
    {
      command: RE_SILENCIAR,
      matchInterim: false,
      bestMatchOnly: true,
      callback: () => {
        execFinal.schedule(() => disableDictation());
      }
    },
    // Activar (final + gate por silencio)
    {
      command: RE_ACTIVAR,
      matchInterim: false,
      bestMatchOnly: true,
      callback: () => {
        execFinal.schedule(() => {
          enableDictation();
          anchorsRef.current[active] = transcript.length; // nuevo tramo
        });
      }
    },
    // Terminar dictado (final + gate)
    {
      command: RE_TERMINAR,
      matchInterim: false,
      bestMatchOnly: true,
      callback: () => {
        execFinal.schedule(() => { commitActive(); stop(); });
      }
    },
    // Dictar <campo> (final + captura nombre)
    {
      command: RE_DICTAR,
      matchInterim: false,
      bestMatchOnly: true,
      callback: (campoDetectado: string) => {
        const campo = mapCampo(campoDetectado);
        execFinal.schedule(() => selectField(campo));
      }
    },

    // Reseteo total por voz (opcional)
    {
      command: 'limpiar dictado',
      matchInterim: false,
      callback: () => {
        execFinal.schedule(() => {
          resetAllTranscripts();
          setStore({ personales: "", familiares: "", condicion: "", intervencion: "" });
          (Object.keys(anchorsRef.current) as FieldKey[]).forEach(k => {
            anchorsRef.current[k] = transcript.length;
          });
        });
      }
    },
  ]), [active, commitActive, disableDictation, enableDictation, execFinal, resetAllTranscripts, selectField, stop, transcript.length]);

  useSpeechCommands(commands, [commands]);

  /* ====== UI ====== */
  const boxSx = (isActive: boolean) => ({
    height: '20vh',
    border: 2,
    borderColor: isActive ? 'success.main' : 'divider',
    borderRadius: 1,
    p: 1,
    whiteSpace: 'pre-wrap',
  });

  return (
    <Box>
      <Stack mb={2} direction="row" spacing={2} alignItems="center">
        <div>
          <InputLabel>Dictado (interim):</InputLabel>
          <Typography>{interimTranscript}</Typography>
        </div>
        <Button variant="outlined" onClick={() => {
          // Limpieza manual (a posteriori) de los 4 campos
          setStore(prev => ({
            personales:  cleanCommandsLater(prev.personales),
            familiares:  cleanCommandsLater(prev.familiares),
            condicion:   cleanCommandsLater(prev.condicion),
            intervencion: cleanCommandsLater(prev.intervencion),
          }));
        }}>
          Limpiar comandos (post)
        </Button>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6">Antecedentes Personales</Typography>
          <Box sx={boxSx(active === 'personales')}>
            {view.personales}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6">Antecedentes Familiares</Typography>
          <Box sx={boxSx(active === 'familiares')}>
            {view.familiares}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6">Condición Actual</Typography>
          <Box sx={boxSx(active === 'condicion')}>
            {view.condicion}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6">Intervención Clínica</Typography>
          <Box sx={boxSx(active === 'intervencion')}>
            {view.intervencion}
          </Box>
        </Grid>
      </Grid>
      <Stack my={2}>
        <Button variant="contained">
            Guardar Informacion
        </Button>
      </Stack>
    </Box>
  );
}
