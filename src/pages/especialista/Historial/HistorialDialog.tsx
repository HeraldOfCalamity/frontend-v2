import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    InputLabel,
    Paper,
    Stack,
    TextField,
    Typography,
    useTheme,
} from "@mui/material";
import { benedettaPink } from "../../../config/theme.config";
import Anamnesis from "./Anamnesis";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Mic } from "@mui/icons-material";
import Swal from "sweetalert2";
import { useSpeech } from "../../../context/SpeechContext";
import Evolucion from "./Evolucion";
import type { PacienteWithUser } from "../../../api/pacienteService";
import {
  actualizarAnamnesis,
  addTratamiento,
  crearHistorial,
  getHistorialesPorPaciente,
  type HistorialClinico,
} from "../../../api/historialService";
import dayjs from "dayjs";
import { attendCita } from "../../../api/citaService";
import { fmt, makeClinicHeaderHTML, openPrintWindow } from "../../../utils/printUtils";
import { BASE_URL } from "../../../config/benedetta.api.config";

interface HistorialDialogProps {
  open: boolean;
  onClose: () => void;
  pacienteProfile: PacienteWithUser;
  citaId?: string;
  showEndAttention?: boolean;
  readonly?: boolean;
}
interface Tab {
  name: string;
  component: React.ReactNode;
}

const CLINIC_INFO = {
  logoUrl: "/benedetta-bellezza.svg",
  name: "Benedetta Bellezza",
  phone: "",
  // usando \n para forzar multilínea
  address: "Av. América #459 entre Av. Santa Cruz y Calle Pantaleón Dalence.\n Edif. Torre Montreal piso 1, of. 3. Frente al Paseo Aranjuez.",
  city: "",
  // sub1 y sub2 pueden omitirse; vienen por defecto con los textos que pediste
};
export default function HistorialDialog({
  onClose,
  open,
  pacienteProfile,
  citaId,
  showEndAttention,
  readonly=false
}: HistorialDialogProps) {
  const {
    listening,
    resetAllTranscripts,
    browserSupportsSpeechRecognition,
    dictationEnabled,
    disableDictation,
    start,
    stop, hardStop
  } = useSpeech();

  // Id del paciente estabilizado (evita capturar undefined en handlers)
  const pacienteId = useMemo(
    () =>
      pacienteProfile?.paciente?.id ??
      (pacienteProfile as any)?.paciente?._id ??
      "",
    [pacienteProfile]
  );

  const [historial, setHistorial] = useState<HistorialClinico | undefined>();
  const [uiMode, setUiMode] = useState<'list' | 'detail'>('list');
  const [selectedTratamientoId, setSelectedTratamientoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const tratamientos = useMemo(() => historial?.tratamientos ?? [], [historial]);
  const theme = useTheme()

  const handleCrearHistorial = useCallback(
    async () => {
      try {
        if (!pacienteId) {
          Swal.fire("Atención", "No se encontró el ID del paciente.", "warning");
          return;
        }

        const payload = {
          paciente_id: pacienteId,
        };

        const created = await crearHistorial(payload);
        if (created) {
          setHistorial(created);
          Swal.fire(
            "Éxito",
            "Historial para el paciente creado exitosamente",
            "success"
          );
        }
      } catch (err: any) {
        Swal.fire("Error", `${err}`, "error");
      }
    },
    [pacienteId]
  );

  const obtenerHistorialByPacienteId = useCallback(async () => {
    try {
      if (!pacienteId) return;
      const hist = await getHistorialesPorPaciente(pacienteId);
      // console.log("historial historialdialog", hist);
      if (hist) {
        setHistorial(hist);
        return;
      }
      if(!readonly){
        await Swal.fire(
          "Paciente Nuevo",
          "Se creará un historial para el paciente.",
          "info"
        );
        await handleCrearHistorial();
      }
    } catch (err: any) {
      Swal.fire("Error", `${err}`, "error");
    }
  }, [pacienteId]);

  // const handleEditarHistorial = async (payload: {
  //   condActual: string,
  //   intervencionClinica: string
  // }) => {
  //   try{
  //     const res = await actualizarAnamnesis(historial?._id || '', payload);
  //     if(res){
  //       setHistorial(res)
  //       await Swal.fire("Éxito", "Cambios guardados correctamente", "success");
  //     }

  //   }catch(err: any){
  //     Swal.fire(
  //       'Error',
  //       `${err}`,
  //       'error'
  //     )
  //   }
  // }

  const HISTORIAL_TABS: Tab[] = useMemo(
    () => [
      {
        name: "anamnesis",
        component: (
          <Anamnesis
            tratamientoId={selectedTratamientoId || undefined}
            historial={historial as HistorialClinico}
            onSaved={(h) => setHistorial(h)}
            forceReadonly={readonly}
          />
        ),
      },
      {
        name: "evolución",
        component: <Evolucion 
          tratamientoId={selectedTratamientoId || undefined}
          onAddImage={(hist) => setHistorial(hist)}
          onAddEntry={(hist) => setHistorial(hist)}
          historial={historial as HistorialClinico} 
          readonly={readonly}
        />,
      },
    ],
    [historial, selectedTratamientoId, readonly]
  );

  const [selectedTab, setSelectedTab] = useState<Tab>(HISTORIAL_TABS[0]);

  // Si cambia el array de tabs (p.ej. al crearse el historial), mantenemos selección coherente
  useEffect(() => {
    setSelectedTab((prev) => {
      const found = HISTORIAL_TABS.find((t) => t.name === prev.name);
      return found ?? HISTORIAL_TABS[0];
    });
  }, [HISTORIAL_TABS]);


  useEffect(() => {
    if (!open) return;
    if (!readonly && !browserSupportsSpeechRecognition) {
      Swal.fire("Atención", "El navegador no soporta el dictado!", "warning");
      return;
    }
    obtenerHistorialByPacienteId();    
  }, [open, readonly, browserSupportsSpeechRecognition, obtenerHistorialByPacienteId, pacienteId]);


  const [openNewTrat, setOpenNewTrat] = useState(false);
  const [motivoNew, setMotivoNew] = useState('');

  const doAddTratamiento = useCallback(async () => {
    setLoading(true)
    try{
      if(!historial?._id){
        const created = await crearHistorial({paciente_id: pacienteId});
        if(!created?._id) throw new Error('No se pudo crear el historial');
        setHistorial(created);
      }
      const hId = (historial?._id) || (await getHistorialesPorPaciente(pacienteId))?._id;
      if(!hId) throw new Error('No se encotró el historial');

      await addTratamiento(hId, {
        motivo: motivoNew || '',
        antFamiliares: '',
        antPersonales: '',
        condActual: '',
        intervencionClinica: '',
        diagnostico: ''
      });

      const fresh = await getHistorialesPorPaciente(pacienteId);
      setHistorial(fresh)
      setOpenNewTrat(false)
      setMotivoNew('');
      Swal.fire('Exito', 'Consulta agregada', 'success');
    }catch (err: any){
      Swal.fire('Error', `${err}`, 'error');
    }finally{
      setLoading(false)
    }
  }, [historial?._id, pacienteId, motivoNew]);

  const handleVolverTratamientos = async () => {
    if(!readonly){
      const result = await Swal.fire({
        title: 'Volver a consultas',
        text: 'Está seguro de volver? La información no guardada se perderá.',
        icon: 'warning',
        showCancelButton: true,
        showConfirmButton: true,
        confirmButtonText: 'Si, volver',
        cancelButtonText: 'No',
      })

      if(!result.isConfirmed) return;
    }

    setUiMode('list'); 
    setSelectedTratamientoId(null);
  }

  const marcarCitaAtendida = async () => {
    if(!citaId) return;
    try{
      const cita = await attendCita(citaId)
      if(cita){
        Swal.fire('Exito', 'Se ha completado la atención', 'success')
      }
      console.log(cita)
    }catch(err: any){
      Swal.fire(
        'Error',
        `${err}`,
        'error'
      )
    }
  }

  const handleEndAttention = useCallback(async () => {
    const res = await Swal.fire({
      title: 'Terminar Atención?',
      text: 'Está seguro de terminar la atención? Los cambios NO guardados se perderán.',
      icon: 'warning',
      showCancelButton: true,
      cancelButtonColor: theme.palette.error.main,
      confirmButtonText: 'Si, terminar',
      confirmButtonColor: theme.palette.primary.main,
      cancelButtonText: 'Cancelar'
    });

    if(!res.isConfirmed) return;

    try{
        try { disableDictation?.(); } catch {}
        try { hardStop?.(); } catch { try { stop(); } catch {} }
        try { resetAllTranscripts?.(); } catch {}

        setHistorial(undefined)
        setSelectedTab(HISTORIAL_TABS[0])
        marcarCitaAtendida()

        onClose();

    }catch{
      onClose()
    }
  }, [disableDictation, hardStop, stop, resetAllTranscripts, onClose, HISTORIAL_TABS])

  const handleCancelModal = useCallback(() => {
    try { disableDictation?.(); } catch {}
    try { hardStop?.(); } catch { try { stop(); } catch {} }
    try { resetAllTranscripts?.(); } catch {}

    setHistorial(undefined);
    setSelectedTab(HISTORIAL_TABS[0]);

    onClose();
  }, [])
function buildHeaderPaciente() {
  const u = pacienteProfile?.user;
  const p = pacienteProfile?.paciente;

  return `
    ${makeClinicHeaderHTML({ ...CLINIC_INFO, historialId: (historial as any)?._id || "" })}

    <div class="section">
      <div class="section-head">Identificación del paciente</div>
      <div class="section-body">
        <div class="kv small">
          <div>Nombre completo</div><div>${u?.name ?? ""} ${u?.lastname ?? ""}</div>
          <div>C.I.</div><div>${u?.ci ?? "—"}</div>
          <div>Teléfono</div><div>${u?.phone ?? "—"}</div>
          <div>Fecha nac.</div><div>${fmt(p?.fecha_nacimiento)}</div>
        </div>
      </div>
    </div>
  `;
}

function buildTablaTratamientos() {
  const trats = Array.isArray(historial?.tratamientos) ? historial!.tratamientos : [];
  const rows = trats.map((t: any, i: number) => {
    const entradas = Array.isArray(t.entradas) ? t.entradas : [];
    const fInicio = entradas[0]?.createdAt || t.created_at || historial?.createdAt;
    const fFin = entradas[entradas.length - 1]?.createdAt || fInicio;
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${t.motivo || "—"}</td>
        <td>${fmt(t.created_at || historial?.createdAt)}</td>
        <td class="right">${entradas.length}</td>
        <td>${fmt(fInicio)} – ${fmt(fFin)}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="section">
      <div class="section-head">Consultar realizadas</div>
      <div class="section-body">
        <table class="table">
          <thead>
            <tr>
              <th>#</th><th>Motivo</th><th>Creado</th><th class="right">Entradas</th><th>Rango de fechas</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="5">Sin consultas.</td></tr>`}</tbody>
        </table>
      </div>
    </div>
  `;
}


  function handlePrintResumen() {
    try {
      const html = `${buildHeaderPaciente()}${buildTablaTratamientos()}`;
      if (!html || !html.trim()) throw new Error("Documento vacío");
      openPrintWindow(html, "Historial - Resumen");
    } catch (e: any) {
      Swal.fire("Error al preparar la impresión", e?.message || String(e), "error");
    }
  }


  function handlePrintTreatment(){
    if (!historial?._id || !selectedTratamientoId) return;
    const url = `${BASE_URL}/historiales/${historial._id}/tratamientos/${selectedTratamientoId}/print`;
    window.open(url, "?download=1");
  }

  return (
    <>
      <Dialog open={open} onClose={handleEndAttention} fullWidth fullScreen>
        {/* Header fijo */}
        <Box
          component="header"
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: (t) => t.zIndex.drawer + 1,
            bgcolor: 'background.paper',
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          <Container maxWidth="lg" sx={{ py: 1.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Stack gap={0.5}>
                <Typography variant="h5" fontWeight={700}>Historial Clínico</Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip label={`Paciente: ${pacienteProfile?.user.name} ${pacienteProfile?.user.lastname}`} size="small" />
                  <Chip label={`HC: ${historial ? historial._id : 'Paciente Nuevo: sin historial'}`} size="small" color="info" />
                  {pacienteProfile?.user?.phone && <Chip label={`Tel: ${pacienteProfile?.user.phone}`} size="small" variant="outlined" />}
                </Stack>
              </Stack>

              <Stack direction="row" spacing={1} justifyContent="flex-start" sx={{ mb: 1 }}>
                {/* Botón volver en modo detalle */}
                {uiMode === 'detail' && (
                  <Button variant="contained" onClick={() => handleVolverTratamientos()}>
                    ← Volver a consultas
                  </Button>
                )}
                {showEndAttention && citaId && (
                  <Button color="secondary" variant="contained" onClick={handleEndAttention}>
                    Terminar Atención
                  </Button>
                )}
                <Button color="error" variant="contained" onClick={handleCancelModal}>  
                  Cerrar
                </Button>
              </Stack>
            </Stack>
          </Container>
        </Box>

        {/* Body */}
        <DialogContent sx={{ px: 0 }}>
          <Container maxWidth="lg" sx={{ py: 2 }}>
            {/* Identificación */}
            <Paper elevation={4}  sx={{ p: 2, mb: 2, /*bgcolor: theme => theme.palette.primary.main*/ }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Identificación del Usuario/Paciente
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <InputLabel>N° de HC</InputLabel>
                  <TextField variant="outlined" size="small" fullWidth value={historial?._id || 'Paciente Nuevo: Sin Historial'} slotProps={{ input: { readOnly: true } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <InputLabel>Nombres y Apellidos</InputLabel>
                  <TextField variant="outlined" size="small" fullWidth
                    value={`${pacienteProfile?.user.name} ${pacienteProfile?.user.lastname}`}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <InputLabel>Edad</InputLabel>
                  <TextField variant="outlined" size="small" fullWidth
                    value={dayjs().year() - dayjs(pacienteProfile?.paciente.fecha_nacimiento).year()}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <InputLabel>F. Nacimiento</InputLabel>
                  <TextField variant="outlined" size="small" fullWidth
                    value={dayjs(pacienteProfile?.paciente.fecha_nacimiento).format('DD/MM/YYYY')}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <InputLabel>C.I.</InputLabel>
                  <TextField variant="outlined" size="small" fullWidth value={pacienteProfile?.user.ci} slotProps={{ input: { readOnly: true } }} />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <InputLabel>Teléfono</InputLabel>
                  <TextField variant="outlined" size="small" fullWidth value={pacienteProfile?.user.phone} slotProps={{ input: { readOnly: true } }} />
                </Grid>
              </Grid>
            </Paper>
            {/* LISTA DE TRATAMIENTOS */}
            {uiMode === 'list' && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Stack direction={{ xs:'column', sm:'row' }} gap={1} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>Consultas</Typography>
                  <Button color="secondary" variant="outlined" onClick={handlePrintResumen}>Imprimir resumen</Button>
                  {!readonly && (
                    <Button
                      variant="contained"
                      onClick={() => setOpenNewTrat(true)}
                      disabled={!historial?._id && !pacienteId}
                    >
                      Agregar consulta
                    </Button>
                  )}
                </Stack>
                <Stack mt={2} gap={1}>
                  {tratamientos.length === 0 ? (
                    <Alert severity="info">No hay consultar. Usa “Agregar consulta”.</Alert>
                  ) : (
                    tratamientos.map((t: any) => (
                      <Paper key={t.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid size={{ xs:12, sm:4 }}>
                            <InputLabel sx={{ fontSize: 12 }}>Fecha</InputLabel>
                            <Typography variant="body2">
                              {dayjs(t.created_at || t.createdAt).format('DD/MM/YYYY HH:mm')}
                            </Typography>
                          </Grid>
                          <Grid size={{ xs:12, sm:4 }}>
                            <InputLabel sx={{ fontSize: 12 }}>Motivo</InputLabel>
                            <Typography variant="body2">{t.motivo || "—"}</Typography>
                          </Grid>
                          <Grid size={{ xs:12, sm:2 }}>
                            <InputLabel sx={{ fontSize: 12 }}>Entradas</InputLabel>
                            <Typography variant="body2">{Array.isArray(t.entradas) ? t.entradas.length : 0}</Typography>
                          </Grid>
                          <Grid size={{ xs:12, sm:2 }}>
                            <Stack direction="row" gap={1} justifyContent={{ xs:'flex-start', sm:'flex-end' }} flexWrap="wrap">
                              <Button size="small" variant="contained" onClick={() => {
                                setSelectedTratamientoId(t.id);
                                setUiMode('detail');
                                setSelectedTab(HISTORIAL_TABS[0]); // abre en Anamnesis
                              }}>
                                Ver detalles
                              </Button>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Paper>
            )}

            {/* Tabs estilo botones (solo detalle) */}
            {uiMode === 'detail' && (
            <Stack direction="row" gap={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
              {HISTORIAL_TABS.map((tab) => {
                const active = tab.name === selectedTab.name;
                return (
                  <Button
                    key={tab.name}
                    onClick={() => setSelectedTab(tab)}
                    variant={active ? "contained" : "outlined"}
                    color={active ? "primary" : "inherit"}
                    sx={{
                      textTransform: 'capitalize',
                      display: !historial && tab.name !== "anamnesis" ? "none" : "inline-flex",
                    }}
                  >
                    {tab.name}
                  </Button>
                );
              })}
              <Stack direction={'row'} flexGrow={1} justifyContent={'end'}>
                <Button
                  color={'secondary'}
                  variant={'contained'}
                  onClick={() => {
                    handlePrintTreatment()
                  }}
                >
                  Imprimir historia clínica
                </Button>
              </Stack>
            </Stack>
            )}

            {/* Contenido tab (solo en detalle) con marco de estado de dictado solo en anamnesis */}
            {uiMode === 'detail' && (
            <Paper
              variant="outlined"
              sx={(t) => ({
                p: 2,
                borderWidth: selectedTab.name === "anamnesis" ? 2 : 1,
                borderColor:
                  selectedTab.name === "anamnesis"
                    ? (dictationEnabled ? t.palette.success.main : t.palette.error.main)
                    : t.palette.divider,
              })}
            >
              {selectedTab.component}
            </Paper>
            )}
          </Container>
        </DialogContent>
      </Dialog>
      {/* Nuevo Tratamiento */}
      <Dialog open={openNewTrat} onClose={() => setOpenNewTrat(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nueva consulta</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Motivo (opcional)"
            fullWidth
            value={motivoNew}
            onChange={(e) => setMotivoNew(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button loading={loading} variant="contained" onClick={doAddTratamiento}>Agregar</Button>
          <Button loading={loading} color="error" variant="contained" onClick={() => setOpenNewTrat(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </>
  );

}
