import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Paper, Typography, TextField, InputAdornment, Chip, IconButton, CircularProgress, Button, useTheme, Grid } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhoneIcon from "@mui/icons-material/Phone";
import EventIcon from "@mui/icons-material/Event";
import dayjs from "dayjs";
import { getPacientesConCitasDelEspecialista, type PacienteCitaResumen } from "../../api/citaService";
import { useUserProfile } from "../../context/userProfileContext";
import type { EspecialistaWithUser } from "../../api/especialistaService";
import { getPacienteProfileById, type PacienteWithUser } from "../../api/pacienteService";
import Swal from "sweetalert2";
import HistorialDialog from "./Historial/HistorialDialog";
import { SpeechProvider } from "../../context/SpeechContext";


export default function PacientesConCitas() {
  const [items, setItems] = useState<PacienteCitaResumen[]>([]);
  const [openHist, setOpenHist] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<PacienteWithUser | null>(null)
  const { profile, loading: loadingProfile } = useUserProfile();
  const espProfile = profile as EspecialistaWithUser; 

  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [estados, setEstados] = useState<string[]>(["confirmada", "pendiente"]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getPacientesConCitasDelEspecialista(espProfile?.especialista?.id || '', estados);
      setItems(res?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [profile, estados.join(",")]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(x => [x.nombre, x.telefono, x.paciente_id].some(v => (v || "").toLowerCase().includes(t)));
  }, [q, items]);

  async function handleVerHistorial(pacienteId: string){
    try{
        const prof = await getPacienteProfileById(pacienteId);
        setSelectedPaciente(prof)
        setOpenHist(true)
    }catch(e: any){
        Swal.fire(
            'Error',
            `${e}`,
            'error'
        )
    }
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1200, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Pacientes con Citas</Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Paper variant="outlined" sx={{ p: 1, mb: 1, minWidth: '100%' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Nombre, teléfono o ID de paciente:"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    slotProps={{
                        input:{
                            startAdornment: <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        }
                    }}
                />
            </Paper>
            {["confirmada", "pendiente"].map(e => (
                <Chip
                key={e}
                label={e}
                color={e === "confirmada" ? "success" : e === "pendiente" ? "warning" : "default"}
                variant={estados.includes(e) ? "filled" : "outlined"}
                onClick={() => setEstados(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])}
                sx={{ textTransform: "capitalize" }}
                />
            ))}
            <IconButton onClick={fetchData} disabled={loading}>
                {loading ? <CircularProgress size={22} /> : <RefreshIcon />}
            </IconButton>
        </Stack>
      </Stack>

      

        <Grid container spacing={1}>
            {filtered.map(p => (
                <Grid key={p.paciente_id} size={{xs: 12, md: 6}}>
                    <Paper variant="outlined" sx={{ p: { xs: 1, sm: 1.5 } }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between">
                        <Stack spacing={0.5}>
                            <Typography variant="subtitle1" fontWeight={600}>{p.nombre || "Paciente sin nombre"}</Typography>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Chip size="small" icon={<EventIcon />} label={p.last_cita ? dayjs(p.last_cita).format("DD/MM/YYYY HH:mm") : "—"} />
                            <Chip size="small" label={p.last_estado || "—"} color={p.last_estado === "confirmada" ? "success" : p.last_estado === "pendiente" ? "warning" : "default"} sx={{ textTransform: "capitalize" }} />
                            <Chip size="small" label={`Citas: ${p.total}`} variant="outlined" />
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            {p.telefono && <Button size="small" startIcon={<PhoneIcon />} component="a" href={`tel:${p.telefono}`}>{p.telefono}</Button>}
                            <Button 
                                size="small" 
                                variant="contained" 
                                onClick={() => handleVerHistorial(p.paciente_id)}
                                color="secondary"
                            >
                                Ver Historial
                            </Button>
                        </Stack>
                        </Stack>
                    </Paper>
                </Grid>
            ))}
            {!loading && filtered.length === 0 && (
                <Grid>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">No se encontraron pacientes para los filtros actuales.</Typography>
                    </Paper>
                </Grid>
            )}
        </Grid>
        {selectedPaciente && (
            <SpeechProvider>
                <HistorialDialog 
                    open={openHist}
                    onClose={() => { setOpenHist(false); setSelectedPaciente(null); }}
                    pacienteProfile={selectedPaciente}
                    showEndAttention={false}
                    readonly
                />
            </SpeechProvider>
        )}
    </Box>
  );
}
