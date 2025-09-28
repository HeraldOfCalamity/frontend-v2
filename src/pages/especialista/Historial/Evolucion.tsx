import { AddCircleOutline, AddPhotoAlternate, Mic, MicOff } from "@mui/icons-material";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, Stack, Typography, useMediaQuery, useTheme, InputLabel,
  DialogContentText,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  TextField
} from "@mui/material";
import GenericTable, { type Column, type TableAction } from "../../../components/common/GenericTable";
import dayjs from "dayjs";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSpeech, useSpeechCommands } from "../../../context/SpeechContext";
import type { Entrada, HistorialClinico, NerSpan } from "../../../api/historialService";
import {
  presignUploadImagen,
  registrarImagen,
  getSignedImageUrl,
  agregarEntrada as agregarEntradaService,
  groupNer,
  NER_COLORS,
} from "../../../api/historialService";
import { compressToWebp } from "../../../utils/evoImage";
import Swal from "sweetalert2";
import { labelEs } from "../../../utils/nerLabels";

/* ========= Campos y estado de dictado en el diálogo ========= */
type EvoField = 'recursos' | 'evolucion';
type Store = Record<EvoField, string>;

async function hasVideoInput(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(d => d.kind === "videoinput");
  } catch {
    return false;
  }
}

/* ===== Limpieza “post” (no en vivo) ===== */
function cleanCommandsLater(text: string): string {
  const patterns: RegExp[] = [
    /(?:^|\s)silenciar\s+micr[oó]f?o?no?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)activar\s+micr[oó]f?o?no?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:recursos(?:\s+terap[eé]uticos)?)?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:evoluci[oó]n(?:\s+del\s+tratamiento)?)?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)(?:terminar|detener|finalizar|parar)\s+dictado(?=\s|[.,;:!?]|$)/giu,
  ];
  let out = text;
  for (const re of patterns) out = out.replace(re, "");
  return out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
}

/* ===== Gate opcional por silencio (espera interino vacío) ===== */
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

/* ===== Regex de comandos (anclados al final y esperando resultado final) ===== */
const END = String.raw`[\s.,;:!?]*$`;
const RE_SILENCIAR = new RegExp(String.raw`(?:^|\s)silenciar\s+micr(?:o|ó)fono${END}`, 'i');
const RE_ACTIVAR   = new RegExp(String.raw`(?:^|\s)activar\s+micr(?:o|ó)fono${END}`, 'i');
const RE_TERMINAR  = new RegExp(String.raw`(?:^|\s)(terminar|detener)\s+dictado${END}`, 'i');

const RE_DICTAR_RECURSOS = new RegExp(
  String.raw`(?:^|\s)dictar\s+(?:recursos(?:\s+terap[eé]uticos)?)${END}`, 'i'
);
const RE_DICTAR_EVOLUCION = new RegExp(
  String.raw`(?:^|\s)dictar\s+(?:evoluci(?:o|ó)n(?:\s+del\s+tratamiento)?)${END}`, 'i'
);

const LABEL_COLOR: Record<string, "default"|"primary"|"secondary"|"success"|"warning"|"error"|"info"> = {
  SYMPTOM: "error",
  BODY_PART: "primary",
  LATERALITY: "secondary",
  DIAGNOSIS: "warning",
  TEST: "info",
  TREATMENT: "success",
  EXERCISE: "success",
  ROM: "info",
  SCALE: "info",
  PHASE: "default",
  DURATION: "default",
  FREQUENCY: "default",
  PAIN_QUALITY: "default",
  PAIN_INTENSITY: "default",
  MOVEMENT: "default",
  FUNCTIONAL_LIMITATION: "default",
};

interface EvolucionProps{
  historial: HistorialClinico;
  onAddEntry: (hist: HistorialClinico) => void;
  onAddImage: (hist: HistorialClinico) => void;
}

export default function Evolucion({
  historial,
  onAddEntry,
  onAddImage
}: EvolucionProps){
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [detailText, setDetailText] = useState('');
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [nerEntry, setNerEntry] = useState<Entrada | null>(null)
  const [nerField, setNerField] = useState<'recursos'|'evolucion'>('recursos')
  const [openNerDialog, setOpenNerDialog] = useState(false)

  function openNer(entry: Entrada) {
    setNerEntry(entry);
    setNerField('recursos');
    setOpenNerDialog(true);
  }
  function closeNer() {
    setOpenNerDialog(false);
    setNerEntry(null);
  }

  // Estado tabla (partimos de las entradas del historial)
  const [rows, setRows] = useState<Entrada[]>(historial?.entradas ?? []);
  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
    [rows]
  );

  // Modal “ver imágenes de la entrada”
  const [openImage, setOpenImage] = useState(false);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Diálogo para agregar entrada (solo texto)
  const [openAddEntry, setOpenAddEntry] = useState(false);

  // ===== Speech =====
  const {
    listening, dictationEnabled, start, stop,
    transcript, interimTranscript,
    enableDictation, disableDictation, resetAllTranscripts,
    hardStop
  } = useSpeech();

  // Campo activo
  const [active, setActive] = useState<EvoField>('recursos');
  const [store, setStore] = useState<Store>({ recursos: "", evolucion: "" });

  // anclas por campo
  const anchorsRef = useRef<Record<EvoField, number>>({
    recursos: transcript.length,
    evolucion: transcript.length
  });

  // detectar ON->OFF para consolidar lo hablado en curso
  const prevDictRef = useRef(dictationEnabled);
  useEffect(() => { prevDictRef.current = dictationEnabled }, [dictationEnabled]);

  // re-sync anclas si cambia la longitud por reset
  useEffect(() => {
    (Object.keys(anchorsRef.current) as EvoField[]).forEach(k => {
      if (anchorsRef.current[k] > transcript.length) anchorsRef.current[k] = transcript.length;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript.length]);

  // Consolida el tramo del campo activo (no se limpia en vivo)
  const commitActive = useCallback(() => {
    const startIdx = anchorsRef.current[active];
    const chunk = transcript.slice(startIdx);
    if (chunk) setStore(prev => ({ ...prev, [active]: prev[active] + chunk }));
    anchorsRef.current[active] = transcript.length;
  }, [active, transcript]);

  // Seleccionar campo (por comando o UI)
  const selectField = useCallback((next: EvoField) => {
    commitActive();
    setActive(next);
    anchorsRef.current[next] = transcript.length; // evita arrastrar la orden
  }, [commitActive, transcript.length]);

  // ON -> OFF: consolidar
  useEffect(() => {
    const prev = prevDictRef.current;
    if (prev && !dictationEnabled) commitActive();
  }, [dictationEnabled, commitActive]);

  // Vista del texto por campo (el activo muestra base + slice “en vivo” + interim)
  const view = useMemo(() => {
    const liveSlice = dictationEnabled ? transcript.slice(anchorsRef.current[active]) : '';

    return {
      recursos:  active === 'recursos'  ? (store.recursos  + liveSlice) : store.recursos,
      evolucion: active === 'evolucion' ? (store.evolucion + liveSlice) : store.evolucion,
    } as Store;
  }, [store, active, dictationEnabled, transcript]);

  // ===== Registrar comandos locales =====
  const execFinal = useExecuteWhenFinal(interimTranscript, 450);

  const evoCommands = useMemo(() => ([
    { command: RE_SILENCIAR, matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => disableDictation()) },
    { command: RE_ACTIVAR,   matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => {
      enableDictation();
      anchorsRef.current[active] = transcript.length;
    }) },
    { command: RE_TERMINAR,  matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => { commitActive(); hardStop() }) },

    // Cambiar campo por voz:
    { command: RE_DICTAR_RECURSOS,  matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => selectField('recursos')) },
    { command: RE_DICTAR_EVOLUCION, matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => selectField('evolucion')) },

    // Limpieza total por voz
    {
      command: 'limpiar dictado',
      matchInterim: false,
      callback: () => execFinal.schedule(() => {
        resetAllTranscripts();
        setStore({ recursos: "", evolucion: "" });
        anchorsRef.current.recursos = transcript.length;
        anchorsRef.current.evolucion = transcript.length;
      })
    },
  ]), [active, commitActive, disableDictation, enableDictation, execFinal, resetAllTranscripts, selectField, stop, transcript.length]);

  useSpeechCommands(evoCommands, [evoCommands]);

  /* ============ Subida de imágenes (desde acción de la tabla) ============ */
  const pacienteId = historial?.paciente_id || (historial as any)?.pacienteId || "";
  const historialId = (historial as any)?._id || historial?._id || "";

  // Modal para “Agregar imagen” a una entrada concreta
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [targetEntry, setTargetEntry] = useState<Entrada | null>(null);

  // Caché de URLs firmadas
  const signedUrlCacheRef = useRef<Record<string, string>>({});
  const getSignedUrlCached = useCallback(async (key: string) => {
    if (!key) return "";
    if (signedUrlCacheRef.current[key]) return signedUrlCacheRef.current[key];
    const res = await getSignedImageUrl(key);
    const url = res?.url || "";
    if (url) signedUrlCacheRef.current[key] = url;
    return url;
  }, []);

  // Cámara in-app (solo dentro del modal de imágenes)
  const [openCam, setOpenCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

async function startCamera() {
  if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
    throw new Error("getUserMedia no está soportado en este navegador/contexto.");
  }

  const trials: (MediaStreamConstraints)[] = [
    { video: { facingMode: { ideal: "environment" } }, audio: false },
    { video: { facingMode: "user" }, audio: false },
    { video: true, audio: false },
  ];

  let lastErr: any = null;
  for (const c of trials) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(c);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return; // ✅ listo
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr; // si todas fallan, propagamos el último error
}
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }
async function handleOpenCam() {
  try {
    const hasCam = await hasVideoInput();
    if (!hasCam) {
      await Swal.fire(
        "Cámara no disponible",
        "No se detectó ningún dispositivo de cámara. Conecta una cámara o prueba desde un móvil.",
        "warning"
      );
      return;
    }
    await startCamera();
    setOpenCam(true);
  } catch (err: any) {
    const name = err?.name || "";
    if (name === "NotAllowedError") {
      Swal.fire(
        "Permiso denegado",
        "Concede acceso a la cámara (ícono del candado → Permisos) y vuelve a intentarlo.",
        "info"
      );
    } else if (name === "NotFoundError") {
      Swal.fire(
        "Cámara no encontrada",
        "No se encontró un dispositivo de video compatible. Prueba con otra cámara o dispositivo.",
        "warning"
      );
    } else if (location.protocol !== "https:" && location.hostname !== "localhost") {
      Swal.fire(
        "Contexto no seguro",
        "El acceso a la cámara requiere HTTPS (o localhost). Abre la app en HTTPS.",
        "info"
      );
    } else {
      Swal.fire("Error al iniciar cámara", `${err}`, "error");
    }
    // aseguramos estado limpio
    stopCamera();
    setOpenCam(false);
  }
}
  function handleCloseCam() {
    stopCamera();
    setOpenCam(false);
  }
  async function handleTakePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !targetEntry) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w === 0 || h === 0) return;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await processAndUploadToEntry(blob, "camera.jpg", targetEntry.id);
      handleCloseCam();
    }, "image/jpeg", 0.92);
  }
  useEffect(() => () => stopCamera(), []);

  // Subida + registro al backend
  async function processAndUploadToEntry(fileOrBlob: File | Blob, filename = "photo.jpg", entryId?: string) {
    try {
      if (!historialId || !pacienteId || !entryId) { alert("Falta historial, paciente o entrada"); return; }

      const file = fileOrBlob instanceof File
        ? fileOrBlob
        : new File([fileOrBlob], filename, { type: (fileOrBlob as Blob).type || "image/jpeg" });

      const { blob, width, height, type } = await compressToWebp(file);

      // 1) presign
      const pres = await presignUploadImagen({
        paciente_id: pacienteId,
        historial_id: historialId,
        entrada_id: entryId,
        filename: file.name,
        content_type: type,
      });
      if (!pres?.url || !pres.key) { alert("No se pudo obtener URL firmada"); return; }

      // 2) PUT a R2
      const put = await fetch(pres.url, {
        method: "PUT",
        headers: { "Content-Type": type },
        body: blob,
      });
      if (!put.ok) { alert("Error subiendo a R2"); return; }

      // 3) Registrar en backend (ahora empuja la KEY y puede devolver historial)
      const reg = await registrarImagen({
        pacienteId,
        historialId,
        entradaId: entryId,
        key: pres.key,
        width, height,
        size: blob.size,
        originalName: file.name,
        originalType: type,
      });

      if (!reg?.ok) { alert("No se pudo registrar la imagen"); return; }

      // a) Si el backend devuelve el historial, refrescamos desde ahí
      if (reg.historial?.entradas) {
        setRows(reg.historial.entradas as Entrada[]);
        onAddImage?.(reg.historial as HistorialClinico);
      } else {
        // b) Si no, actualizamos localmente empujando la KEY
        setRows(prev => prev.map(e =>
          e.id === entryId
            ? ({ ...e, imagenes: Array.isArray((e as any).imagenes) ? [ ...(e as any).imagenes, pres.key ] : [ pres.key ] })
            : e
        ));
      }

      // Firma y cachea para no refirmar luego (y mostrar en el modal “agregar”)
      const sg = await getSignedUrlCached(pres.key);
      if (sg) setImagePreviewUrls(prev => [...prev, sg]);

    } catch (err: any) {
      Swal.fire('Error', `${err}`, 'error');
    }
  }

  async function onPickImagesForEntry(e: React.ChangeEvent<HTMLInputElement>) {
    if (!targetEntry) return;
    const files = Array.from(e.target.files || []);
    for (const f of files) await processAndUploadToEntry(f, f.name, targetEntry.id);
    e.target.value = ""; // permite volver a seleccionar la misma foto
  }

  function openImageModalFor(entry: Entrada) {
    setTargetEntry(entry);
    setImagePreviewUrls([]);
    setImageModalOpen(true);
  }

  function closeImageModal() {
    setImageModalOpen(false);
    setTargetEntry(null);
    setImagePreviewUrls([]);
    if (openCam) handleCloseCam();
  }

  // Ver TODAS las imágenes de una entrada (firma todas las keys con cache)
  async function openViewImages(keys?: string[]) {
    setImagePreviewUrls([]);
    setOpenImage(true);
    if (!keys || keys.length === 0) return;
    const urls = await Promise.all(keys.map(k => getSignedUrlCached(k)));
    setImagePreviewUrls(urls.filter(Boolean));
  }

  /* ============ Guardar entrada (texto) ============ */
  async function onGrabarEntrada() {
    try{
      if (!historialId) return;
      commitActive();

      const payload = {
        recursosTerapeuticos: cleanCommandsLater(view.recursos),
        evolucionText:        cleanCommandsLater(view.evolucion),
        imageIds: [], // ← ahora las imágenes se agregan a posteriori por acción de tabla
      };

      const res = await agregarEntradaService(historialId, payload);
      if (res) {
        await Swal.fire('Éxito','Se agregó una nueva entrada al historial','success');
        setStore({ recursos: "", evolucion: "" });
        anchorsRef.current.recursos = transcript.length;
        anchorsRef.current.evolucion = transcript.length;

        onAddEntry(res);
        setOpenAddEntry(false);
      }
    }catch(err: any){
      Swal.fire('Error', `${err}`, 'error');
    }
  }

  /* ===== UI ===== */

  function EntitiesView({ner}: {ner?: Record<string, string[]>}){
    if(!ner || Object.keys(ner).length === 0) return <Typography>Sin entidades.</Typography>;
    return(
      <Stack spacing={1}>
        {Object.entries(ner).map(([label, values])=>(
          <Box key={label}>
            <Typography variant="subtitle2" gutterBottom>
              {label}
            </Typography>
            <Stack direction={'row'} gap={1} flexWrap={'wrap'}>
              {values.map((v, i) => (
                <Chip key={label+i} label={v} color={LABEL_COLOR[label] ?? 'default'} size="medium" />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    )
  }

  const columns: Column<Entrada>[] = [
    {
      field: 'createdAt',
      headerName: 'Fecha',
      align: 'center',
      render: (v) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      field: 'recursosTerapeuticos',
      headerName: 'Recursos Terapeuticos',
      align: 'center',
      render: (v) => (
          <Box maxHeight={'14vh'}>
            { v 
              ? isMobile 
                ? (
                <Button
                  onClick={() => {
                    setDetailText(v);
                    setOpenDetailDialog(true)
                  }}>
                  Leer
                </Button>
              ) : v
              : 'Sin Información.'
            }
          </Box>
      )
    },
    {
      field: 'evolucionText',
      headerName: 'Evolución del tratamiento',
      align: 'center',
      render: (v) => (
        <Box maxHeight={'14vh'}>
          { v 
            ? isMobile 
              ? (
              <Button
                onClick={() => {
                  setDetailText(v);
                  setOpenDetailDialog(true)
                }}>
                Leer
              </Button>
            ) : v
            : 'Sin Información.'
          }
        </Box>
      )
    },
    // 👇 Importante: el campo ahora es 'imagenes' (array de KEYS)
    {
      field: 'imagenes',
      headerName: 'Imágenes',
      align: 'center',
      render: (keys?: string[]) =>
        (Array.isArray(keys) && keys.length > 0)
          ? (
            <Button onClick={() => openViewImages(keys)} variant="text">
              Ver imágenes ({keys.length})
            </Button>
          )
          : 'Sin imagen'
    },
  ];

  // 👉 Acción en la tabla: abrir modal para agregar imágenes a esa entrada
  const actions: TableAction<Entrada>[] = [
    {
      icon: <AddPhotoAlternate />,
      label: 'Agregar Imagen',
      color: 'secondary',
      onClick: (entry) => openImageModalFor(entry),
    },
    {
      icon: <MicOff />,
      label: 'Ver entidades',
      color: 'primary',
      onClick: (entry) => openNer(entry)
    }
  ];

  const boxSx = (isActive: boolean) => ({
    height: '20vh',
    border: 2,
    borderColor: isActive ? 'success.main' : 'divider',
    borderRadius: 1,
    p: 1,
    whiteSpace: 'pre-wrap',
  });

  useEffect(() => {
    if (!historial) return;
    setRows(historial?.entradas || [])
  }, [historial])


  // +++ NUEVO: safe-highlight: usa offsets si existen; si no, busca por texto (case-insensitive)
function highlightText(text: string, ents?: NerSpan[]) {
  if (!text) return text;
  const spans = (ents || []).slice();

  // a) si hay offsets válidos y dentro del rango, úsalos
  const offsetSpans = spans
    .filter(s => typeof s.start === "number" && typeof s.end === "number" && s.start! >= 0 && s.end! <= text.length && s.end! > s.start!)
    .map(s => ({ start: s.start!, end: s.end!, label: s.label }));

  // b) si no hay offsets, hacemos matching por texto (case-insensitive, prefiriendo spans largos)
  let textLower = text.toLowerCase();
  const byText: { start: number; end: number; label: string }[] = [];
  if (offsetSpans.length === 0) {
    const entsByLen = spans
      .filter(s => s.text && s.text.trim().length > 0)
      .sort((a,b) => (b.text.length - a.text.length));
    const used: boolean[] = new Array(text.length).fill(false);

    for (const e of entsByLen) {
      const needle = e.text.toLowerCase();
      let from = 0;
      while (true) {
        const idx = textLower.indexOf(needle, from);
        if (idx === -1) break;
        const j = idx + needle.length;
        // evita solapados burdos
        let free = true;
        for (let k = idx; k < j; k++) if (used[k]) { free = false; break; }
        if (free) {
          for (let k = idx; k < j; k++) used[k] = true;
          byText.push({ start: idx, end: j, label: e.label });
        }
        from = j;
      }
    }
  }

  const ranges = (offsetSpans.length ? offsetSpans : byText)
    .sort((a,b) => a.start - b.start);

  if (ranges.length === 0) return text;

  const out: React.ReactNode[] = [];
    let cursor = 0;
    ranges.forEach((r, i) => {
      if (r.start > cursor) {
        out.push(<span key={`t-${i}-plain`}>{text.slice(cursor, r.start)}</span>);
      }
      out.push(
        <mark
          key={`t-${i}-hl`}
          style={{ padding: "0 2px", background: "rgba(255,235,59,0.6)", borderRadius: 3 }}
          title={r.label}
        >
          {text.slice(r.start, r.end)}
        </mark>
      );
      cursor = r.end;
    });
    if (cursor < text.length) out.push(<span key="t-last">{text.slice(cursor)}</span>);
    return <>{out}</>;
  }


  return (
    <>
      <Box>
        <Stack direction={'row'} justifyContent={'end'} mb={2}>
          <Button
            startIcon={<AddCircleOutline />}
            fullWidth
            color="secondary"
            variant="contained"
            onClick={() => setOpenAddEntry(true)}
          >
            Agregar Entrada
          </Button>
        </Stack>
        <GenericTable
          columns={columns}
          data={sortedRows}
          actions={actions}
        />
      </Box>

      {/* Modal: ver imágenes de la entrada (todas las keys firmadas) */}
      <Dialog maxWidth="md" fullWidth open={openImage} onClose={() => setOpenImage(false)}>
        <DialogTitle>Imágenes guardadas</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} flexWrap="wrap" justifyContent={'space-around'}>
            {imagePreviewUrls.length === 0 ? (
              <Typography variant="body2">Sin imágenes.</Typography>
            ) : imagePreviewUrls.map((u, i) => (
              <img key={i} src={u} alt="" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 8 }} />
            ))}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear una entrada (SOLO TEXTO) */}
      <Dialog maxWidth={"md"} fullWidth open={openAddEntry} onClose={() => setOpenAddEntry(false)}>
        <DialogTitle>Agregar Registro de Evolución</DialogTitle>
        <DialogContent>

          {/* Estado del dictado */}
          <Stack mb={2} direction="row" spacing={2} alignItems="center">
            <div>
              <InputLabel>Dictado (interim):</InputLabel>
              <Typography>{interimTranscript}</Typography>
            </div>
            <Button
              variant="outlined"
              onClick={() => {
                setStore(prev => ({
                  recursos:  cleanCommandsLater(prev.recursos),
                  evolucion: cleanCommandsLater(prev.evolucion),
                }));
              }}
            >
              Limpiar comandos (post)
            </Button>
          </Stack>

          <Box sx={{
            border:4,
            borderRadius:2,
            p: 2,
            borderColor: theme =>
              listening && dictationEnabled
                ?  theme.palette.success.main
                : theme.palette.error.main
          }}>
            <Stack direction={'row'} mb={2} spacing={2}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                startIcon={<Mic />}
                onClick={() => {
                  enableDictation();
                  anchorsRef.current[active] = transcript.length;
                  start({ language: 'es-BO' })
                }}
              >
                Iniciar Dictado
              </Button>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="secondary"
                startIcon={<MicOff />}
                onClick={() => {
                  commitActive();
                  hardStop();
                }}
              >
                Detener Dictado
              </Button>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{xs: 12, md:6}}>
                <Typography variant="h6">Recursos Terapéuticos</Typography>
                {/* <Box sx={boxSx(active === 'recursos')}>
                  {view.recursos}
                </Box> */}
                <TextField
                  multiline
                  minRows={6}
                  fullWidth
                  value={view.recursos}
                  onFocus={() => setActive('recursos')}
                  onChange={(e) => setStore((p) => ({ ...p, recursos: e.target.value }))}
                  sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
                  slotProps={{
                    input:{
                      readOnly: dictationEnabled
                    }
                  }}
                />
              </Grid>

              <Grid size={{xs: 12, md:6}}>
                <Typography variant="h6">Evolución del Tratamiento</Typography>
                {/* <Box sx={boxSx(active === 'evolucion')}>
                  {view.evolucion}
                </Box> */}
                <TextField
                  multiline
                  minRows={6}
                  fullWidth
                  value={view.evolucion}
                  onFocus={() => setActive('evolucion')}
                  onChange={(e) => setStore((p) => ({ ...p, evolucion: e.target.value }))}
                  sx={{ "& .MuiInputBase-input": { maxHeight: "24vh", overflowY: "auto" } }}
                  slotProps={{
                    input:{
                      readOnly: dictationEnabled
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="success" onClick={onGrabarEntrada}>
            Grabar
          </Button>
          <Button variant="contained" color="error" onClick={() => {
              hardStop();
              setOpenAddEntry(false);
            }}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo: Agregar imágenes a una entrada (desde acción de tabla) */}
      <Dialog maxWidth="sm" fullWidth open={imageModalOpen} onClose={closeImageModal}>
        <DialogTitle>
          Agregar imágenes {targetEntry ? `a la entrada #${targetEntry.id}` : ""}
        </DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} flexWrap="wrap" mb={1}>
            <Button variant="outlined" component="label">
              Adjuntar imágenes
              <input hidden accept="image/*" multiple type="file" onChange={onPickImagesForEntry} />
            </Button>

            <Button variant="outlined" component="label">
              Cámara (sistema móvil)
              <input hidden accept="image/*" capture="environment" type="file" onChange={onPickImagesForEntry} />
            </Button>

            <Button variant="outlined" onClick={handleOpenCam}>
              Cámara en la app
            </Button>
          </Stack>

          {imagePreviewUrls.length > 0 && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
              {imagePreviewUrls.map((u, i) => (
                <img key={i} src={u} alt="" style={{ width: 140, height: 100, objectFit: "cover", borderRadius: 8 }} />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImageModal} variant="contained">Listo</Button>
        </DialogActions>
      </Dialog>

      {/* Sub-diálogo: Cámara en la app (invocado desde el modal de imágenes) */}
      <Dialog open={openCam} onClose={handleCloseCam} fullWidth maxWidth="sm">
        <DialogTitle>Tomar foto</DialogTitle>
        <DialogContent>
          <Box sx={{ position: "relative" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", borderRadius: 8, background: "#000" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCam} color="inherit">Cancelar</Button>
          <Button onClick={handleTakePhoto} variant="contained">Tomar</Button>
        </DialogActions>
      </Dialog>

      {/* Detalle para móviles (mostrar textos largos) */}
      <Dialog
        maxWidth={'md'}
        fullWidth
        open={openDetailDialog}
        onClose={() => {setOpenDetailDialog(false); setDetailText('')}}
      >
        <DialogTitle>Detalle</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {detailText ? `${detailText.charAt(0).toUpperCase()}${detailText.toLowerCase().slice(1)}.` : 'Sin información.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            onClick={() => {setOpenDetailDialog(false); setDetailText('')}}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      {/* +++ NUEVO: Diálogo NER por entrada */}
      <Dialog
        maxWidth="md"
        fullWidth
        open={openNerDialog}
        onClose={closeNer}
      >
        <DialogTitle>Entidades detectadas</DialogTitle>
        <DialogContent>
          {nerEntry?.ner && nerEntry.ner.length > 0 ? (
            <>
              {/* Chips por etiqueta */}
              <Stack direction="row" gap={2} flexWrap="wrap" mb={2}>
                {Object.entries(groupNer(nerEntry.ner as unknown as NerSpan[])).map(([label, items]) => (
                  <Stack key={label} gap={1}>
                    <Typography variant="subtitle2">{labelEs(label)}</Typography>
                    <Stack direction="row" gap={1} flexWrap="wrap">
                      {items.map((t, i) => (
                        <Chip
                          key={`${label}-${i}`}
                          size="small"
                          label={t}
                          color={NER_COLORS[label] || "default"}
                        />
                      ))}
                    </Stack>
                  </Stack>
                ))}
              </Stack>

              {/* Toggle para ver recursos / evolución */}
              <ToggleButtonGroup
                exclusive
                size="small"
                value={nerField}
                onChange={(_, v) => v && setNerField(v)}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="recursos">Recursos Terapéuticos</ToggleButton>
                <ToggleButton value="evolucion">Evolución</ToggleButton>
              </ToggleButtonGroup>

              {/* Texto resaltado */}
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                }}
              >
                {highlightText(
                  nerField === 'recursos' ? (nerEntry?.recursosTerapeuticos || '') : (nerEntry?.evolucionText || ''),
                  nerEntry?.ner as unknown as NerSpan[] || []
                )}
              </Box>
            </>
          ) : (
            <Typography variant="body2">Sin entidades detectadas para esta entrada.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={closeNer}>Cerrar</Button>
        </DialogActions>
      </Dialog>

    </>
  );
}
