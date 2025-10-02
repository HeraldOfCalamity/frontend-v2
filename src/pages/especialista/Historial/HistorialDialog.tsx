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
  crearHistorial,
  getHistorialesPorPaciente,
  type HistorialClinico,
} from "../../../api/historialService";
import dayjs from "dayjs";
import { attendCita } from "../../../api/citaService";

interface HistorialDialogProps {
  open: boolean;
  onClose: () => void;
  pacienteProfile: PacienteWithUser;
  citaId: string;
}
interface Tab {
  name: string;
  component: React.ReactNode;
}

export default function HistorialDialog({
  onClose,
  open,
  pacienteProfile,
  citaId
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
  const theme = useTheme()

  const handleCrearHistorial = useCallback(
    async (data: {
      personales: string;
      familiares: string;
      condicion: string;
      intervencion: string;
    }) => {
      try {
        if (!pacienteId) {
          Swal.fire("Atención", "No se encontró el ID del paciente.", "warning");
          return;
        }

        const payload = {
          paciente_id: pacienteId,
          antfamiliares: data.familiares,
          antPersonales: data.personales,
          condActual: data.condicion,
          intervencionClinica: data.intervencion,
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
      console.log("historial historialdialog", hist);
      if (hist) {
        setHistorial(hist);
        return;
      }
      Swal.fire(
        "Paciente Nuevo",
        "El paciente no tiene un historial asociado; al guardar se creará automáticamente.",
        "info"
      );
    } catch (err: any) {
      Swal.fire("Error", `${err}`, "error");
    }
  }, [pacienteId]);

  const handleEditarHistorial = async (payload: {
    condActual: string,
    intervencionClinica: string
  }) => {
    try{
      const res = await actualizarAnamnesis(historial?._id || '', payload);
      if(res){
        setHistorial(res)
        await Swal.fire("Éxito", "Cambios guardados correctamente", "success");
      }

    }catch(err: any){
      Swal.fire(
        'Error',
        `${err}`,
        'error'
      )
    }
  }

  const HISTORIAL_TABS: Tab[] = useMemo(
    () => [
      {
        name: "anamnesis",
        component: (
          <Anamnesis
            handleClickEditar={handleEditarHistorial}
            handleClickGuardar={handleCrearHistorial}
            historial={historial as HistorialClinico}
          />
        ),
      },
      {
        name: "evolución",
        component: <Evolucion 
          onAddImage={(hist) => setHistorial(hist)}
          onAddEntry={(hist) => setHistorial(hist)}
          historial={historial as HistorialClinico} 
        />,
      },
    ],
    [handleCrearHistorial, historial]
  );

  const [selectedTab, setSelectedTab] = useState<Tab>(HISTORIAL_TABS[0]);

  // Si cambia el array de tabs (p.ej. al crearse el historial), mantenemos selección coherente
  useEffect(() => {
    setSelectedTab((prev) => {
      const found = HISTORIAL_TABS.find((t) => t.name === prev.name);
      return found ?? HISTORIAL_TABS[0];
    });
  }, [HISTORIAL_TABS]);

  const handleStartDictaphone = () => start({ language: "es-BO" });
  const handlePauseDictaphone = () => stop();

  useEffect(() => {
    if (!open) return;
    if (!browserSupportsSpeechRecognition) {
      Swal.fire("Atención", "El navegador no soporta el dictado!", "warning");
      return;
    }
    obtenerHistorialByPacienteId();
    console.log("pacienteId (estable):", pacienteId);
  }, [open, browserSupportsSpeechRecognition, obtenerHistorialByPacienteId, pacienteId]);

  const marcarCitaAtendida = async () => {
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

  return (
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
                {historial?._id && <Chip label={`HC: ${historial?._id}`} size="small" color="info" />}
                {pacienteProfile?.user?.phone && <Chip label={`Tel: ${pacienteProfile?.user.phone}`} size="small" variant="outlined" />}
              </Stack>
            </Stack>

            <Stack direction="row" gap={1}>
              <Button color="secondary" variant="contained" onClick={handleEndAttention}>
                Terminar Atención
              </Button>
              <Button color="error" variant="contained" onClick={handleCancelModal}>  
                Cancelar
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
                <TextField variant="outlined" size="small" fullWidth value={historial?._id || ''} slotProps={{ input: { readOnly: true } }} />
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

          {/* Tabs estilo botones */}
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
          </Stack>

          {/* Contenido tab con marco de estado de dictado solo en anamnesis */}
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
            <Typography variant="h6" fontWeight={600} gutterBottom textTransform="capitalize">
              {selectedTab.name}
            </Typography>
            {selectedTab.component}
          </Paper>
        </Container>
      </DialogContent>
    </Dialog>
  );

}
