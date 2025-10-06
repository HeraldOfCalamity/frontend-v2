// Anamnesis.tsx
import {
  Box, Grid, InputLabel, Stack, Typography, Button, Alert, useTheme, TextField,
  Chip,
  Paper,
  Divider,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpeech, useSpeechCommands } from "../../../context/SpeechContext";
import type { HistorialClinico, NerSpan } from "../../../api/historialService";
import { Mic, MicOff } from "@mui/icons-material";
import Swal from "sweetalert2";
import { actualizarAnamnesis, groupNer, NER_COLORS, setAnamnesisOnce } from "../../../api/historialService";
import { labelEs } from "../../../utils/nerLabels";

/** Claves de los 4 campos */
type FieldKey = "personales" | "familiares" | "condicion" | "intervencion" | "diagnostico";

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
  String.raw`diagn[oó]stico|` +
  String.raw`cl[ií]nica|personales|familiares` +
  String.raw`)` + END,
  "i"
);

function mapCampo(str: string): FieldKey {
  const s = str.toLowerCase();
  if (s.includes('diagnost')) return 'diagnostico';
  if (s.includes("famil")) return "familiares";
  if (s.includes("condici")) return "condicion";
  if (s.includes("intervenc") || s.includes("clínica") || s.includes("clinica")) return "intervencion";
  return "personales";
}

/* ====== Props ====== */
interface AnamnesisProps {
  historial: HistorialClinico;
  tratamientoId?: string;
  onSaved?: (h: HistorialClinico) => void;
  forceReadonly?: boolean;
}

export default function Anamnesis({
  historial,
  tratamientoId,
  onSaved,
  forceReadonly
}: AnamnesisProps) {
  const {
    transcript,
    interimTranscript,
    isMicrophoneAvailable,
    dictationEnabled,
    resetAllTranscripts,
    enableDictation,
    disableDictation,
    start,
    hardStop
  } = useSpeech();

  const execFinal = useExecuteWhenFinal(interimTranscript, 450);
  const theme = useTheme();
  useEffect(() => {
    try {
      hardStop();         // corta cualquiera sesión residual
      disableDictation(); // fuerza dictationEnabled = false
      resetAllTranscripts?.();
    } catch {}
    // sólo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Campo activo
  const [active, setActive] = useState<FieldKey>("personales");

  // Texto consolidado por campo
  const [store, setStore] = useState<Store>({
    personales: "",
    familiares: "",
    condicion: "",
    intervencion: "",
    diagnostico: ""
  });

  // Anclas por campo
  const anchorsRef = useRef<Record<FieldKey, number>>({
    personales: transcript.length,
    familiares: transcript.length,
    condicion: transcript.length,
    intervencion: transcript.length,
    diagnostico: transcript.length
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
      diagnostico: active === "diagnostico" ? (store.diagnostico + slice) : store.diagnostico,
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
        setStore({ personales: "", familiares: "", condicion: "", intervencion: "", diagnostico: "" });
        (Object.keys(anchorsRef.current) as FieldKey[]).forEach(k => {
          anchorsRef.current[k] = transcript.length;
        });
      }),
    },
  ]), [active, disableDictation, enableDictation, execFinal, historial, resetAllTranscripts, selectField, stopDictationSafely, transcript.length]);

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

  // const onGuardarHistorialClick = () => {
  //   handleClickGuardar({
  //     personales: view.personales,
  //     familiares: view.familiares,
  //     condicion: view.condicion,
  //     intervencion: view.intervencion,
  //   });
  // };

  // Cargar valores desde tratamiento seleccionado (o ultimo)
  useEffect(() => {
    if (!historial) return;
    const trats: any[] = Array.isArray((historial as any).tratamientos) ? (historial as any).tratamientos : [];
    const last = trats.length ? trats[trats.length - 1] : undefined;
    const t = (tratamientoId && trats.find(x => x.id === tratamientoId)) || last;
    setStore({
      condicion: t?.condActual || "",
      // backend guarda 'antfamiliares' en el documento; DTO usa 'antFamiliares'
      familiares: t?.antFamiliares ?? t?.antfamiliares ?? "",
      personales: t?.antPersonales || "",
      intervencion: t?.intervencionClinica || "",
      diagnostico: t?.diagnostico || "",
    });
  }, [historial, tratamientoId]);

  // Tratamiento y estado de bloqueo (si ya tiene algún campo con contenido, queda bloqueado)
  const currentTrat = useMemo(() => {
    const trats: any[] = Array.isArray((historial as any)?.tratamientos) ? (historial as any).tratamientos : [];
    if (!trats.length) return undefined;
    return (tratamientoId && trats.find((x: any) => x.id === tratamientoId)) || trats[trats.length - 1];
  }, [historial, tratamientoId]);

  const isLocked = useMemo(() => {
    if (!currentTrat) return false;
    const p = (currentTrat.antPersonales ?? "").trim();
    const f = (currentTrat.antfamiliares ?? "").trim();
    const c = (currentTrat.condActual ?? "").trim();
    const i = (currentTrat.intervencionClinica ?? "").trim();
    const d = (currentTrat.diagnostico ?? "").trim();
    return Boolean(p || f || c || i || d);
  }, [currentTrat]);

  const readOnly = Boolean(forceReadonly || isLocked)

  const canSave = useMemo(() => {
    // Solo se puede guardar si NO está bloqueado y hay al menos un campo con texto
    if (isLocked) return false;
    const { personales, familiares, condicion, intervencion, diagnostico } = view;
    return [personales, familiares, condicion, intervencion, diagnostico].every(s => (s ?? "").trim().length > 0);
  }, [isLocked, view]);

  const onSaveOnce = async () => {
    try {
      if (!historial?._id || !currentTrat?.id) {
        await Swal.fire("Atención", "Falta historial o tratamiento.", "info");
        return;
    }
      const result = await Swal.fire({
        title: 'Guardar Información',
        text: 'Está seguro de la información a guardar? Después del guardado no se podrá cambiar.',
        icon: 'warning',
        showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: 'Si, Guardar',
        cancelButtonText: 'No',
        cancelButtonColor: theme.palette.error.main
      })

      if(!result.isConfirmed) return;

      // cierra dictado y consolida texto visible
      commitActive();
      hardStop();

      const res = await setAnamnesisOnce(historial._id, currentTrat.id, {
        motivo: currentTrat.motivo,
        antPersonales: cleanCommandsLater(view.personales),
        antFamiliares: cleanCommandsLater(view.familiares),
        condActual: cleanCommandsLater(view.condicion),
        intervencionClinica: cleanCommandsLater(view.intervencion),
        diagnostico: cleanCommandsLater(view.diagnostico),
      });
      if (res) {
        // refrescar UI desde respuesta del backend
        const updated: any = res;
        const trats: any[] = Array.isArray(updated?.tratamientos) ? updated.tratamientos : [];
        const t = trats.find((x: any) => x.id === currentTrat.id);
        setStore({
          personales: t?.antPersonales || "",
          familiares: t?.antFamiliares ?? t?.antfamiliares ?? "",
          condicion: t?.condActual || "",
          intervencion: t?.intervencionClinica || "",
          diagnostico: t?.diagnostico || "",
        });
        onSaved?.(res);
        await Swal.fire("Éxito", "Anamnesis guardada. Ya no será editable.", "success");
      }
    } catch (err: any) {
      // si backend retorna 409, significa que ya estaba guardada
      await Swal.fire("Aviso", err?.message || `${err}`, "error");
    }
  };

  const startDictation = () => {
    enableDictation();
    anchorsRef.current[active] = transcript.length;
    start({ language: "es-BO" })
  };



  const nerRaw = useMemo(() => {
    const trats: any[] = Array.isArray((historial as any)?.tratamientos) ? (historial as any)?.tratamientos : [];
    const last = trats.length ? trats[trats.length - 1] : undefined;
    const t = (tratamientoId && trats.find(x => x.id === tratamientoId)) || last;
    return t?.ner_sections;
  }, [historial, tratamientoId]);
  const groupedSections = useMemo(() => groupNer(nerRaw), [nerRaw])
  const hasNer = Object.keys(groupedSections).length > 0;

  return (
    <Box>
      {/* Barra de dictado */}
      {/* Motivo del tratamiento (NUEVO) */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          bgcolor: (t) => t.palette.background.default,
        }}
      >
        
          <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
            <Typography mr={1} fontSize={'1.2rem'} fontWeight={'bold'}>
              Motivo de la consulta:
            </Typography>
            
            <Typography fontSize={'1.2rem'}>
              {`${(currentTrat?.motivo ?? "")[0]?.toUpperCase()}${(currentTrat?.motivo ?? '').trim().slice(1)}` || "—" }
            </Typography>
          </Box>
        
      </Paper>
      {!readOnly && (
        <Paper 
          variant="outlined" 
          sx={{
            p:2, mb:2,
            position: 'sticky',
            top: 0,
            zIndex: (t) => t.zIndex.drawer + 1,
            bgcolor: theme.palette.background.default,
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Stack direction="row" spacing={1} flex={1}>
              <Button
                fullWidth
                size="small"
                variant="contained"
                startIcon={<Mic />}
                disabled={!isMicrophoneAvailable || isLocked}
                onClick={startDictation}
              >
                Iniciar Dictado
              </Button>
              <Button
                fullWidth
                size="small"
                color="secondary"
                variant="contained"
                startIcon={<MicOff />}
                disabled={!isMicrophoneAvailable || isLocked}
                onClick={() => { commitActive(); disableDictation(); hardStop(); }}
              >
                Detener
              </Button>
            </Stack>

            <Stack flex={2} spacing={0.5}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <InputLabel sx={{ mb: 0 }}>Dictado (interim):</InputLabel>
                <Typography variant="body2" noWrap>{interimTranscript || '—'}</Typography>
              </Stack>
              <Stack direction="row" gap={1}>
                <Button
                  variant="outlined"
                  onClick={() =>
                    setStore((prev) => ({
                      personales: cleanCommandsLater(prev.personales),
                      familiares: cleanCommandsLater(prev.familiares),
                      condicion: cleanCommandsLater(prev.condicion),
                      intervencion: cleanCommandsLater(prev.intervencion),
                      diagnostico: cleanCommandsLater(prev.diagnostico),
                    }))
                  }
                >
                  Limpiar comandos (post)
                </Button>
                {!isMicrophoneAvailable && (
                  <Alert severity="error" sx={{ py: 0, alignItems: 'center' }}>
                    El micrófono no está disponible o sin permisos.
                  </Alert>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      )}
      {isLocked && (
        <Paper
          variant="outlined"
          sx={{
            bgcolor: theme.palette.background.default,
            mb:2,
          }}
        >
          <Alert severity="info" sx={{ py: 0, alignItems: 'center' }}>
            La anamnesis de este tratamiento ya fue guardada y no es editable.
          </Alert>
        </Paper>
      )}

      {/* Entidades NER */}
      {hasNer && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: theme => theme.palette.background.default }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Entidades detectadas
          </Typography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            {Object.entries(groupedSections).map(([label, items]) => (
              <>
                <Box key={label} display={'flex'} gap={2} borderLeft={1} borderRight={1} p={1} borderRadius={2}>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                    {labelEs(label)}
                  </Typography>
                  <Stack direction="row" gap={1} flexWrap="wrap">
                    {items.map((t, i) => (
                      <Chip key={`${label}-${i}`} label={t} color={NER_COLORS[label] || "default"} size="small" />
                    ))}
                  </Stack>
                </Box>
              </>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Campos */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Antecedentes Personales"
            multiline fullWidth
            value={view.personales}
            onFocus={() => setActive('personales')}
            onChange={(e) => setStore((p) => ({ ...p, personales: e.target.value }))}
            helperText={isLocked ? 'Bloqueado' : (dictationEnabled ? "Dictado en curso, no se puede editar" : "Editable")}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{ input: { readOnly: dictationEnabled || readOnly} }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Antecedentes Familiares"
            multiline fullWidth
            value={view.familiares}
            onFocus={() => setActive('familiares')}
            onChange={(e) => setStore((p) => ({ ...p, familiares: e.target.value }))}
            helperText={isLocked ? 'Bloqueado' : (dictationEnabled ? "Dictado en curso, no se puede editar" : "Editable")}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{ input: { readOnly: dictationEnabled || readOnly} }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Condición Actual"
            multiline fullWidth
            value={view.condicion}
            onFocus={() => setActive('condicion')}
            onChange={(e) => setStore((p) => ({ ...p, condicion: e.target.value }))}
            helperText={isLocked ? 'Bloqueado' : (dictationEnabled ? "Dictado en curso, no se puede editar" : "Editable")}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{ input: { readOnly: dictationEnabled || readOnly} }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Intervención Clínica"
            multiline fullWidth
            value={view.intervencion}
            onFocus={() => setActive('intervencion')}
            onChange={(e) => setStore((p) => ({ ...p, intervencion: e.target.value }))}
            helperText={isLocked ? 'Bloqueado' : (dictationEnabled ? "Dictado en curso, no se puede editar" : "Editable")}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{ input: { readOnly: dictationEnabled || readOnly} }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Diagnóstico"
            multiline fullWidth
            value={view.diagnostico}
            onFocus={() => setActive('diagnostico')}
            onChange={(e) => setStore((p) => ({ ...p, diagnostico: e.target.value }))}
            helperText={isLocked ? 'Bloqueado' : (dictationEnabled ? "Dictado en curso, no se puede editar" : "Editable")}
            sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
            slotProps={{ input: { readOnly: dictationEnabled || readOnly} }}
          />
        </Grid>
      </Grid>

      {/* Acciones */}
      {!isLocked && !readOnly && (
        <Stack mt={2} spacing={1}>
          <Button
            variant="contained"
            fullWidth
            color="success"
            disabled={!canSave}
            onClick={onSaveOnce}
          >
            Guardar Información (una sola vez)
          </Button>
        </Stack>
      )}
    </Box>
  );

}
