import { AddCircleOutline, AddPhotoAlternate, Mic, MicOff } from "@mui/icons-material";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, Stack, Typography, useMediaQuery, useTheme, InputLabel,
  DialogContentText
} from "@mui/material";
import GenericTable, { type Column, type TableAction } from "../../../components/common/GenericTable";
import dayjs from "dayjs";
import ImagePreviewDialog from "../../../components/common/ImagePreviewDialog";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSpeech, useSpeechCommands } from "../../../context/SpeechContext";
import type { Entrada, HistorialClinico } from "../../../api/historialService";
import {
  presignUploadImagen,
  registrarImagen,
  getSignedImageUrl,
  agregarEntrada as agregarEntradaService,
} from "../../../api/historialService";
import { compressToWebp } from "../../../utils/evoImage";
import Swal from "sweetalert2";

/* ========= Campos y estado de dictado en el diálogo ========= */
type EvoField = 'recursos' | 'evolucion';
type Store = Record<EvoField, string>;

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

interface EvolucionProps{
  historial: HistorialClinico;
  onAddEntry: (hist: HistorialClinico) => void;
  onAddImage: (hist: HistorialClinico) => void;
}

export default function Evolucion({ 
  historial , 
  onAddEntry,
  onAddImage
}: EvolucionProps){
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [detailText, setDetailText] = useState('');
  const [openDetailDialog, setOpenDetailDialog] = useState(false)

  // Estado tabla (partimos de las entradas del historial)
  const [rows, setRows] = useState<Entrada[]>(historial?.entradas ?? []);

  // Imagen / preview dialog
  // const [selectedImage, setSelectedImage] = useState('');
  const [openImage, setOpenImage] = useState(false);

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

  // Vista del texto por campo (el activo muestra base + slice “en vivo”)
  const view = useMemo(() => {
    // tramo finalizado desde el ancla
    const baseLive = transcript.slice(anchorsRef.current[active]);
    // si el dictado está habilitado, añadimos además el interino;
    // si está deshabilitado, no mostramos nada “en vivo”
    const liveNow = dictationEnabled ? (baseLive + interimTranscript) : "";

    return {
      recursos:  active === 'recursos'  ? (store.recursos  + liveNow) : store.recursos,
      evolucion: active === 'evolucion' ? (store.evolucion + liveNow) : store.evolucion,
    } as Store;
  }, [store, active, dictationEnabled, transcript, interimTranscript]);

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
  const historialId = historial?._id || (historial as any)?._id || "";

  // Modal para “Agregar imagen” a una entrada concreta
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [targetEntry, setTargetEntry] = useState<Entrada | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  // const [imageKeys, setImageKeys] = useState<string[]>([]);
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    }
  }
  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }
  async function handleOpenCam() {
    setOpenCam(true);
    await startCamera();
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
      console.log('id entrada handle take photo', targetEntry.id)
      await processAndUploadToEntry(blob, "camera.jpg", targetEntry.id);
      handleCloseCam();
    }, "image/jpeg", 0.92);
  }
  useEffect(() => () => stopCamera(), []);

  // Reusa lógica para archivos/blobs → sube a la entrada target
  async function processAndUploadToEntry(fileOrBlob: File | Blob, filename = "photo.jpg", entryId?: string) {
    console.log('entry id', entryId)
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
        entrada_id: entryId,           // <- aquí vinculamos a la entrada
        filename: file.name,
        content_type: type,            // "image/webp"
      });
      if (!pres?.url || !pres.key) { alert("No se pudo obtener URL firmada"); return; }

      // 2) PUT a R2
      const put = await fetch(pres.url, {
        method: "PUT",
        headers: { "Content-Type": type },
        body: blob,
      });
      if (!put.ok) { alert("Error subiendo a R2"); return; }

      // 3) registrar en backend
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
      
      // onAddImage(reg)

      setRows(prev => prev.map(e =>
        e.id === entryId
          ? ({ ...e, imagenes: Array.isArray((e as any).imagenes) ? [ ...(e as any).imagenes, pres.key ] : [ pres.key ] })
          : e
      ));

      // ✅ firma la key y precarga en el cache + previews del modal de "agregar"
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
    // setImageKeys([]);
    setImagePreviewUrls([]);
    setImageModalOpen(true);
  }

  function closeImageModal() {
    setImageModalOpen(false);
    setTargetEntry(null);
    // setImageKeys([]);
    setImagePreviewUrls([]);
    // por si quedó la cámara abierta
    if (openCam) handleCloseCam();
  }

  async function openViewImages(keys?: string[]) {
    setImagePreviewUrls([]);             // limpiamos previews anteriores
    setOpenImage(true);                  // abrimos el modal de vista
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

        // Añade la nueva entrada al inicio
        // const newEntry: Entrada = res.entry ?? {
        //   id: res.entryId ?? `ev_${Date.now()}`,
        //   createdAt: new Date().toISOString(),
        //   recursosTerapeuticos: payload.recursosTerapeuticos,
        //   evolucionText: payload.evolucionText,
        // } as Entrada;

        // setRows(prev => [newEntry, ...prev]);
        onAddEntry(res)
        setOpenAddEntry(false);
      }
    }catch(err: any){
      Swal.fire('Error', `${err}`, 'error');
    }
  }

  /* ===== UI ===== */
  const columns: Column<Entrada>[] = [
    {
      field: 'recursosTerapeuticos',
      headerName: 'Recursos Terapeuticos',
      align: 'center',
      render: (v) => (
        <Box maxHeight={'14vh'}>
          {!isMobile ? v : (
            <Button 
              onClick={() => {
                setDetailText(v); 
                setOpenDetailDialog(true)
              }}>
                Leer
            </Button>
          )}
        </Box>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Fecha',
      align: 'center',
      render: (v) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      field: 'evolucionText',
      headerName: 'Evolución del tratamiento',
      align: 'center',
      render: (v) => (
        <Box maxHeight={'14vh'}>
          {!isMobile ? v : (
            <Button 
              onClick={() => {
                setDetailText(v); 
                setOpenDetailDialog(true)
              }}>
                Leer
            </Button>
          )}
        </Box>
      )
    },
    {
      field: 'images',
      headerName: 'Imagen',
      align: 'center',
      render: (keys?: string[]) => (Array.isArray(keys) && keys.length > 0) ? (
        <Button onClick={() => openViewImages(keys)} variant="text">
          Ver imágenes ({keys.length})
        </Button>
      ) : 'Sin imagen'
    },
  ];

  // 👉 Acción en la tabla: abrir modal para agregar imágenes a esa entrada
  const actions: TableAction<Entrada>[] = [
    {
      icon: <AddPhotoAlternate />,
      label: 'Agregar Imagen',
      color: 'secondary',
      onClick: (entry) => openImageModalFor(entry),
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
    if(!historial) return;
    setRows(historial?.entradas || [])
  }, [historial])

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
          data={rows.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())} 
          actions={actions}
        />
      </Box>

      {/* Preview de imagen (al ver imágenes de la tabla) */}
      <Dialog maxWidth="md" fullWidth open={openImage} onClose={() => setOpenImage(false)}>
        <DialogTitle>Imágenes guardadas</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} flexWrap="wrap">
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
                  enableDictation()
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
                <Box sx={boxSx(active === 'recursos')}>
                  {view.recursos}
                </Box>
              </Grid>

              <Grid size={{xs: 12, md:6}}>
                <Typography variant="h6">Evolución del Tratamiento</Typography>
                <Box sx={boxSx(active === 'evolucion')}>
                  {view.evolucion}
                </Box>
              </Grid>
            </Grid>

            {/* ⛔️ Quitamos los botones de imágenes de aquí */}
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
      <Dialog
        maxWidth={'md'}
        fullWidth
        open={openDetailDialog}
        onClose={() => {setOpenDetailDialog(false); setDetailText('')}}
      >
        <DialogTitle>
          Detalle
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {detailText ? `${detailText.charAt(0).toUpperCase()}${detailText.toLowerCase().slice(1,detailText.length)}.`: 'Sin información.'}
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
    </>
  );
}
