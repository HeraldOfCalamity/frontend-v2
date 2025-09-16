import {
    Alert,
    Box,
    Button,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    InputLabel,
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

interface HistorialDialogProps {
  open: boolean;
  onClose: () => void;
  pacienteProfile: PacienteWithUser;
}
interface Tab {
  name: string;
  component: React.ReactNode;
}

export default function HistorialDialog({
  onClose,
  open,
  pacienteProfile,
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

        onClose();

    }catch{
      onClose()
    }
  }, [disableDictation, hardStop, stop, resetAllTranscripts, onClose, HISTORIAL_TABS])

  return (
    <Dialog open={open} onClose={handleEndAttention} fullWidth fullScreen>
      <DialogContent>
        <Container>
          <DialogTitle variant="h3">Historial Clinico</DialogTitle>
          <Stack spacing={2}>
            <Box>
              <Typography
                variant="h5"
                fontWeight={500}
                textAlign={"center"}
                bgcolor={benedettaPink}
                p={2}
                border={2}
                borderRadius={2}
              >
                Identificación del Usuario/Paciente
              </Typography>
              <Grid
                spacing={2}
                p={2}
                container
                borderLeft={2}
                borderRight={2}
                borderBottom={2}
              >
                <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>N° de HC</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={historial?._id}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>Nombres y Apellidos</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={`${pacienteProfile?.user.name} ${pacienteProfile?.user.lastname}`}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>Edad</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={
                      dayjs().year() - dayjs(pacienteProfile?.paciente.fecha_nacimiento).year()
                    }
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>Fecha de Nacimiento</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={dayjs(pacienteProfile?.paciente.fecha_nacimiento).format('DD/MM/YYYY')}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                {/* <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>Estado Civil</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={"Casado"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid> */}
                <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>C.I.</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={pacienteProfile?.user.ci}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                {/* <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>Sexo</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={"M"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid> */}
                {/* <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>Domicilio</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={"Hermanos Sejas"}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid> */}
                <Grid size={{ xs: 6, md: 4 }}>
                  <InputLabel>Teléfono</InputLabel>
                  <TextField
                    variant="standard"
                    fullWidth
                    value={pacienteProfile?.user.phone}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Stack direction={"row"} spacing={1} ml={2}>
                {HISTORIAL_TABS.map((tab) => (
                  <Button
                    key={tab.name}
                    onClick={() => setSelectedTab(tab)}
                    variant="text"
                    sx={{
                      borderTop: 2,
                      borderRight: 2,
                      borderLeft: 2,
                      color: (theme) => theme.palette.common.black,
                      bgcolor:
                        tab.name === selectedTab.name ? benedettaPink : "inherit",
                      textTransform: "capitalize",
                      display: !historial && tab.name !== "anamnesis" ? "none" : "",
                    }}
                  >
                    {tab.name}
                  </Button>
                ))}
              </Stack>

              <Box
                border={4}
                borderRadius={2}
                borderColor={(theme) =>
                  selectedTab.name === "anamnesis"
                    ? listening && dictationEnabled
                      ? theme.palette.success.main
                      : theme.palette.error.main
                    : "transparent"
                }
              >
                <Box border={2} flexGrow={1} p={2} borderRadius={2}>
                  <Typography
                    variant="h5"
                    fontWeight={500}
                    textAlign={"center"}
                    bgcolor={benedettaPink}
                    p={2}
                    border={1}
                    gutterBottom
                    textTransform={"capitalize"}
                  >
                    {selectedTab.name}
                  </Typography>

                  {selectedTab.component}
                </Box>
              </Box>
            </Box>
          </Stack>
        </Container>
      </DialogContent>

      <DialogActions>
        <Button color="error" variant="contained" onClick={handleEndAttention}>
          Terminar Atención
        </Button>
      </DialogActions>
    </Dialog>
  );
}
