// Anamnesis.tsx
import {
  Box, Grid, InputLabel, Stack, Typography, Button, Alert, useTheme, TextField,
  Chip,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpeech, useSpeechCommands } from "../../../context/SpeechContext";
import type { HistorialClinico, NerSpan } from "../../../api/historialService";
import { Mic, MicOff } from "@mui/icons-material";
import Swal from "sweetalert2";
import { actualizarAnamnesis, groupNer, NER_COLORS } from "../../../api/historialService";
import { labelEs } from "../../../utils/nerLabels";

/** Claves de los 4 campos */
type FieldKey = "personales" | "familiares" | "condicion" | "intervencion";

/** Texto consolidado por campo */
type Store = Record<FieldKey, string>;

/* ===== Limpieza “post” (no en vivo) ===== */
function cleanCommandsLater(text: string): string {
  const patterns: RegExp[] = [
    /(?:^|\s)silenciar\s+micr[oó]f?o?no?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)activar\s+micr[oó]f?o?no?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:antecedentes\s+)?personales(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:antecedentes\s+)?familiares(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:condici[oó]n(?:\s+actual)?|actual)(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:intervenci[oó]n(?:\s+cl[ií]nica)?|cl[ií]nica)(?=\s|[.,;:!?]|$)/giu,
  ];
  let out = text;
  for (const re of patterns) out = out.replace(re, "");
  return out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
}

/* ===== Gate por silencio ===== */
function useExecuteWhenFinal(interimTranscript: string, delayMs = 450) {
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!pendingRef.current) return;
    if (interimTranscript) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {}, delayMs);
      return;
    }
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

/* ===== Regex de comandos ===== */
const END = String.raw`[\s.,;:!?]*$`;
const RE_SILENCIAR = new RegExp(String.raw`(?:^|\s)silenciar\s+micr(?:o|ó)fono${END}`, "i");
const RE_ACTIVAR   = new RegExp(String.raw`(?:^|\s)activar\s+micr(?:o|ó)fono${END}`, "i");
const RE_TERMINAR  = new RegExp(String.raw`(?:^|\s)(terminar|detener)\s+dictado${END}`, "i");

const RE_DICTAR = new RegExp(
  String.raw`(?:^|\s)dictar\s+(` +
  String.raw`antecedentes\s+personales|` +
  String.raw`antecedentes\s+familiares|` +
  String.raw`condici(?:o|ó)n(?:\s+actual)?|` +
  String.raw`intervenci(?:o|ó)n(?:\s+cl[ií]nica)?|` +
  String.raw`cl[ií]nica|personales|familiares` +
  String.raw`)` + END,
  "i"
);

function mapCampo(str: string): FieldKey {
  const s = str.toLowerCase();
  if (s.includes("famil")) return "familiares";
  if (s.includes("condici")) return "condicion";
  if (s.includes("intervenc") || s.includes("clínica") || s.includes("clinica")) return "intervencion";
  return "personales";
}

/* ====== Props ====== */
interface AnamnesisProps {
  historial: HistorialClinico;
  handleClickGuardar: (data: {
    personales: string;
    familiares: string;
    condicion: string;
    intervencion: string;
  }) => void;
  handleClickEditar: (data: {
    condActual: string;
    intervencionClinica: string;
  }) => void
}

export default function Anamnesis({
  historial,
  handleClickGuardar = () => {},
  handleClickEditar = () => {},
}: AnamnesisProps) {
  const {
    transcript,
    interimTranscript,
    isMicrophoneAvailable,
    dictationEnabled,
    resetAllTranscripts,
    enableDictation,
    disableDictation,
    stop,
    start,
    hardStop
  } = useSpeech();

  const execFinal = useExecuteWhenFinal(interimTranscript, 450);
  const [canEdit, setCanEdit] = useState(false);
  const theme = useTheme();

  // Campo activo
  const [active, setActive] = useState<FieldKey>("personales");

  // Texto consolidado por campo
  const [store, setStore] = useState<Store>({
    personales: "",
    familiares: "",
    condicion: "",
    intervencion: "",
  });

  // Anclas por campo
  const anchorsRef = useRef<Record<FieldKey, number>>({
    personales: transcript.length,
    familiares: transcript.length,
    condicion: transcript.length,
    intervencion: transcript.length,
  });

  const prevDictRef = useRef(dictationEnabled);
  useEffect(() => { prevDictRef.current = dictationEnabled; }, [dictationEnabled]);

  useEffect(() => {
    (Object.keys(anchorsRef.current) as FieldKey[]).forEach((k) => {
      if (anchorsRef.current[k] > transcript.length) anchorsRef.current[k] = transcript.length;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript.length]);

  const commitActive = useCallback(() => {
    const startIdx = anchorsRef.current[active];
    const chunk = transcript.slice(startIdx);
    if (chunk) setStore((prev) => ({ ...prev, [active]: prev[active] + chunk }));
    anchorsRef.current[active] = transcript.length;
  }, [active, transcript]);

  const selectField = useCallback((next: FieldKey) => {
    commitActive();
    setActive(next);
    anchorsRef.current[next] = transcript.length;
  }, [commitActive, transcript.length]);

  useEffect(() => {
    const prev = prevDictRef.current;
    if (prev && !dictationEnabled) commitActive();
  }, [dictationEnabled, commitActive]);

  const view = useMemo(() => {
    const slice = dictationEnabled ? transcript.slice(anchorsRef.current[active]) : "";
    return {
      personales:  active === "personales"  ? (store.personales  + slice) : store.personales,
      familiares:  active === "familiares"  ? (store.familiares  + slice) : store.familiares,
      condicion:   active === "condicion"   ? (store.condicion   + slice) : store.condicion,
      intervencion:active === "intervencion"? (store.intervencion+ slice) : store.intervencion,
    } as Store;
  }, [store, active, dictationEnabled, transcript]);

  /* ===== stop seguro (móvil) ===== */
  const stopDictationSafely = useCallback(() => {
    commitActive();
    hardStop();
  }, [commitActive, hardStop]);

  /* ===== Comandos ===== */
  const commands = useMemo(() => ([
    {
      command: RE_SILENCIAR, matchInterim: false, bestMatchOnly: true,
      callback: () => execFinal.schedule(() => disableDictation()),
    },
    {
      command: RE_ACTIVAR, matchInterim: false, bestMatchOnly: true,
      callback: () => execFinal.schedule(() => {
        enableDictation();
        anchorsRef.current[active] = transcript.length;
      }),
    },
    {
      command: RE_TERMINAR, matchInterim: false, bestMatchOnly: true,
      callback: () => execFinal.schedule(() => stopDictationSafely()),
    },
    // Dictar <campo>: en modo edición solo permitimos condicion/intervencion
    {
      command: RE_DICTAR, matchInterim: false, bestMatchOnly: true,
      callback: (campoDetectado: string) => {
        const campo = mapCampo(campoDetectado);
        execFinal.schedule(() => {
          selectField(campo);
        });
      },
    },
    {
      command: "limpiar dictado", matchInterim: false,
      callback: () => execFinal.schedule(() => {
        resetAllTranscripts();
        setStore({ personales: "", familiares: "", condicion: "", intervencion: "" });
        (Object.keys(anchorsRef.current) as FieldKey[]).forEach(k => {
          anchorsRef.current[k] = transcript.length;
        });
      }),
    },
  ]), [active, canEdit, disableDictation, enableDictation, execFinal, historial, resetAllTranscripts, selectField, stopDictationSafely, transcript.length]);

  useSpeechCommands(commands, [commands]);

  /* ===== helpers UI ===== */
  const boxSx = (isActive: boolean) => ({
    minHeight: "20vh",
    border: 2,
    borderColor: isActive ? "secondary.main" : "divider",
    borderRadius: 1,
    p: 1,
    whiteSpace: "pre-wrap",
    overflowY: 'auto'
  });

  const onGuardarHistorialClick = () => {
    handleClickGuardar({
      personales: view.personales,
      familiares: view.familiares,
      condicion: view.condicion,
      intervencion: view.intervencion,
    });
  };

  // Guardar cambios (PUT)
  const onEditHistorialClick = async () => {
    try {
      commitActive(); // consolida en memoria local
      const result = await Swal.fire({
        title: "Confirmar modificación",
        text: "¿Está seguro de guardar los cambios? La operación no se puede deshacer.",
        showCancelButton: true,
        cancelButtonText: "No",
        cancelButtonColor: theme.palette.error.main,
        confirmButtonText: "Sí, guardar cambios",
        confirmButtonColor: theme.palette.success.main,
        icon: "question",
      });
      if (!result.isConfirmed || !historial?._id) return;

      // limpiamos comandos y preparamos payload
      const payload = {
        condActual: cleanCommandsLater(view.condicion),
        intervencionClinica: cleanCommandsLater(view.intervencion),        
      };

      // detener dictado si estaba activo
      if (dictationEnabled) stopDictationSafely();

      handleClickEditar(payload)
      
      // if (!res?.ok) throw new Error("No se pudo actualizar el historial");

      setCanEdit(false);

      // opcional: sincroniza el store con lo guardado
      setStore(prev => ({
        ...prev,
        condicion: payload.condActual,
        intervencion: payload.intervencionClinica,
      }));
    } catch (err: any) {
      Swal.fire("Error", `${err?.message || err}`, "error");
    }
  };

  const onDiscardChangesClick = () => {
    if (!historial) return;
    setStore({
      personales: historial.antPersonales,
      familiares: historial.antfamiliares,
      condicion: historial.condActual,
      intervencion: historial.intervencionClinica,
    });
    setCanEdit(false);
    // si había dictado en curso, lo detenemos
    if (dictationEnabled) stopDictationSafely();
  };

  // Cargar valores iniciales desde historial
  useEffect(() => {
    if (!historial) return;
    setStore({
      condicion: historial.condActual || "",
      familiares: historial.antfamiliares || "",
      personales: historial.antPersonales || "",
      intervencion: historial.intervencionClinica || "",
    });
  }, [historial]);

  // Al activar edición enfocamos “condición”
  useEffect(() => {
    if (canEdit && historial) setActive("condicion");
  }, [canEdit, historial]);

  const startDictation = () => start({ language: "es-BO" });

  const nerRaw = (historial as any)?.ner_sections;
  const groupedSections = useMemo(() => groupNer(nerRaw), [nerRaw])
  const hasNer = Object.keys(groupedSections).length > 0;

  return (
    <Box>
      <Stack mb={2} direction="column" spacing={2} alignItems="center">
        {(!historial || canEdit) && (
          <>
            <Button
              fullWidth
              size="large"
              variant="contained"
              startIcon={<Mic />}
              disabled={!isMicrophoneAvailable}
              onClick={startDictation}
            >
              Iniciar Dictado
            </Button>
            <Button
              fullWidth
              size="large"
              color="secondary"
              variant="contained"
              startIcon={<MicOff />}
              disabled={!isMicrophoneAvailable}
              onClick={() => {commitActive(); hardStop();}}
            >
              Detener Dictado
            </Button>
          </>
        )}
        {!isMicrophoneAvailable && (
          <Alert severity="error" sx={{ height: 50, mt: 1 }}>
            El micrófono no está disponible o sin permisos.
          </Alert>
        )}

        <Box display="flex" width="100%" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            onClick={() =>
              setStore((prev) => ({
                personales: cleanCommandsLater(prev.personales),
                familiares: cleanCommandsLater(prev.familiares),
                condicion: cleanCommandsLater(prev.condicion),
                intervencion: cleanCommandsLater(prev.intervencion),
              }))
            }
          >
            Limpiar comandos (post)
          </Button>

          <InputLabel>Dictado (interim):</InputLabel>
          <Typography>{interimTranscript}</Typography>
        </Box>
      </Stack>
      <Stack direction={'row'}>
        {hasNer && (
          <Box my={3} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Entidades detectadas</Typography>
            <Stack direction="row" gap={2} flexWrap="wrap" borderRight={2} borderLeft={2} p={1} borderRadius={2}>
              {Object.entries(groupedSections).map(([label, items]) => (
                <Stack key={label} gap={1}>
                  <Typography variant="subtitle2">{labelEs(label)}</Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap" justifyContent={'center'}>
                    {items.map((t, i) => (
                      <Chip key={`${label}-${i}`} label={t} color={NER_COLORS[label] || "default"} size="small" />
                    ))}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <Grid container spacing={2}>
        {/* Siempre solo lectura */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6">Antecedentes Personales</Typography>
          {/* <Box sx={boxSx(active === "personales")}>{store.personales}</Box> */}
          <TextField 
            multiline
            minRows={6}
            fullWidth
            value={view.personales}
            onFocus={() => setActive('personales')}
            onChange={(e) => setStore((p) => ({...p, personales: e.target.value}))}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{
              input:{
                readOnly: dictationEnabled || (!!historial && !canEdit)
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6">Antecedentes Familiares</Typography>
          {/* <Box sx={boxSx(active === "familiares")}>{store.familiares}</Box> */}
          <TextField
            multiline
            minRows={6}
            fullWidth
            value={view.familiares}
            onFocus={() => setActive("familiares")}
            onChange={(e) => setStore((p) => ({ ...p, familiares: e.target.value }))}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{
              input:{
                readOnly: dictationEnabled || (!!historial && !canEdit)
              }
            }}
          />
        </Grid>

        {/* Editables sólo en modo edición */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6">Condición Actual</Typography>
          <TextField
            multiline
            minRows={6}
            fullWidth
            value={view.condicion}
            onFocus={() => setActive("condicion")}
            onChange={(e) => setStore((p) => ({ ...p, condicion: e.target.value }))}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{
              input:{
                readOnly: dictationEnabled || (!!historial && !canEdit)
              }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6">Intervención Clínica</Typography>
          <TextField
            multiline
            minRows={6}
            fullWidth
            value={view.intervencion}
            onFocus={() => setActive("intervencion")}
            onChange={(e) => setStore((p) => ({ ...p, intervencion: e.target.value }))}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{
              input:{
                readOnly: dictationEnabled || (!!historial && !canEdit)
              }
            }}
          />
        </Grid>
      </Grid>

      <Stack my={2} width="100%" spacing={2}>
        {!historial ? (
          <Button
            variant="contained"
            fullWidth
            color="success"
            onClick={onGuardarHistorialClick}
          >
            Guardar Información
          </Button>
        ) : (
          <>
            <Button
              variant="contained"
              color={canEdit ? "success" : "warning"}
              fullWidth
              onClick={() => (canEdit ? onEditHistorialClick() : setCanEdit(true))}
            >
              {canEdit ? "Guardar Cambios" : "Activar Edición"}
            </Button>
            {canEdit && (
              <Button variant="contained" color="error" onClick={onDiscardChangesClick}>
                Descartar Cambios
              </Button>
            )}
          </>
        )}
      </Stack>
      
    </Box>
  );
}
