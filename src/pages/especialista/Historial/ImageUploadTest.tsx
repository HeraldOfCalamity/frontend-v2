import { useEffect, useRef, useState } from "react";
import {
  Container, TextField, Button, Stack, Typography, Grid, Box,
  Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { compressToWebp } from "../../../utils/evoImage";
// 👇 nuevo: usamos el service
import {
  crearHistorial,
  presignUploadImagen,
  registrarImagen,
  getSignedImageUrl,
  agregarEntrada as agregarEntradaService,
} from "../../../api/historialService";

export default function ImageUploadTest() {
  const [paciente_id, setPacienteId] = useState("");
  const [historialId, setHistorialId] = useState<string>("");

  // Campos macro
  const [antfamiliares, setAntfamiliares] = useState("");
  const [antPersonales, setAntPersonales] = useState("");
  const [condActual, setCondActual] = useState("");
  const [intervencionClinica, setIntervencionClinica] = useState("");

  // Entrada
  const [recursos, setRecursos] = useState("");
  const [evolucion, setEvolucion] = useState("");
  const [imageIds, setImageIds] = useState<string[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // ---- Cámara in-app (getUserMedia) ----
  const [openCam, setOpenCam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function crearHistorialHandler() {
    const res = await crearHistorial({
      paciente_id,
      antfamiliares,
      antPersonales,
      condActual,
      intervencionClinica,
    });
    if (res?.ok) setHistorialId(res.id);
  }

  // Reusa la lógica de subida para archivos y blobs
  async function processAndUpload(fileOrBlob: File | Blob, filename = "photo.jpg") {
    if (!historialId) { alert("Primero crea el historial"); return; }

    const file = fileOrBlob instanceof File
      ? fileOrBlob
      : new File([fileOrBlob], filename, { type: (fileOrBlob as Blob).type || "image/jpeg" });

    const { blob, width, height, type } = await compressToWebp(file);

    // 1) presigned URL (Axios vía service)
    const pres = await presignUploadImagen({
      paciente_id,
      historialId,
      entradaId: null,
      filename: file.name,
      contentType: type, // "image/webp"
    });
    if (!pres?.url || !pres.key) { alert("No se pudo obtener URL firmada"); return; }

    // 2) PUT directo a R2 (sigue siendo fetch al endpoint externo presignado)
    const put = await fetch(pres.url, {
      method: "PUT",
      headers: { "Content-Type": type },
      body: blob,
    });
    if (!put.ok) { alert("Error subiendo a R2"); return; }

    // 3) registrar imagen en backend (Axios vía service)
    const reg = await registrarImagen({
      paciente_id,
      historialId,
      entradaId: null,
      key: pres.key,
      width, height,
      size: blob.size,
      originalName: file.name,
      originalType: type,
    });
    if (!reg?.ok) { alert("No se pudo registrar la imagen"); return; }

    setImageIds(prev => [...prev, reg.imageId]);

    // 4) preview temporal firmado (Axios vía service)
    const sg = await getSignedImageUrl(pres.key);
    if (sg?.url) setPreviewUrls(prev => [...prev, sg.url]);
  }

  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    for (const f of files) await processAndUpload(f, f.name);
    e.target.value = ""; // permite volver a seleccionar la misma foto
  }

  // ---- Cámara dentro de la app ----
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
      // fallback a cámara frontal
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
    if (!video || !canvas) return;

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
      await processAndUpload(blob, "camera.jpg");
      handleCloseCam();
    }, "image/jpeg", 0.92);
  }

  async function agregarEntrada() {
    if (!historialId) return;
    const res = await agregarEntradaService(historialId, {
      recursosTerapeuticos: recursos,
      evolucionText: evolucion,
      imageIds,
    });
    if (res?.ok) {
      alert("Entrada agregada");
      setRecursos(""); setEvolucion("");
      setImageIds([]); setPreviewUrls([]);
    }
  }

  // Limpieza al desmontar
  useEffect(() => () => stopCamera(), []);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Historial clínico (demo)</Typography>

      <Stack spacing={2}>
        <TextField label="Paciente ID (ObjectId)" value={paciente_id} onChange={e=>setPacienteId(e.target.value)} fullWidth />

        <Grid container spacing={2}>
          <Grid size={{xs:12, md:6}}><TextField label="Antecedentes Familiares" value={antfamiliares} onChange={e=>setAntfamiliares(e.target.value)} fullWidth multiline minRows={2} /></Grid>
          <Grid size={{xs:12, md:6}}><TextField label="Antecedentes Personales" value={antPersonales} onChange={e=>setAntPersonales(e.target.value)} fullWidth multiline minRows={2} /></Grid>
          <Grid size={{xs:12, md:6}}><TextField label="Condición Actual" value={condActual} onChange={e=>setCondActual(e.target.value)} fullWidth multiline minRows={2} /></Grid>
          <Grid size={{xs:12, md:6}}><TextField label="Intervención Clínica" value={intervencionClinica} onChange={e=>setIntervencionClinica(e.target.value)} fullWidth multiline minRows={2} /></Grid>
        </Grid>

        <Button variant="contained" onClick={crearHistorialHandler} disabled={!paciente_id}>
          Crear historial
        </Button>

        <>
          <Typography variant="h6" mt={2}>Nueva entrada</Typography>
          <TextField label="Recursos terapéuticos" value={recursos} onChange={e=>setRecursos(e.target.value)} fullWidth />
          <TextField label="Evolución (dictado)" value={evolucion} onChange={e=>setEvolucion(e.target.value)} fullWidth multiline minRows={3} />

          <Stack direction="row" spacing={2} flexWrap="wrap">
            {/* Galería / archivos */}
            <Button variant="outlined" component="label">
              Adjuntar imágenes
              <input hidden accept="image/*" multiple type="file" onChange={onPickImages} />
            </Button>

            {/* Cámara del sistema (móvil) */}
            <Button variant="outlined" component="label">
              Cámara (sistema móvil)
              <input hidden accept="image/*" capture="environment" type="file" onChange={onPickImages} />
            </Button>

            {/* Cámara dentro de la app (webcam/móvil) */}
            <Button variant="outlined" onClick={handleOpenCam}>
              Cámara en la app
            </Button>
          </Stack>

          {previewUrls.length > 0 && (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
              {previewUrls.map((u, i) => (
                <img key={i} src={u} alt="" style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 8 }} />
              ))}
            </Box>
          )}

          <Button variant="contained" color="success" onClick={agregarEntrada} disabled={!recursos && !evolucion}>
            Agregar entrada
          </Button>
        </>
      </Stack>

      {/* Dialog de cámara in-app */}
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
    </Container>
  );
}
