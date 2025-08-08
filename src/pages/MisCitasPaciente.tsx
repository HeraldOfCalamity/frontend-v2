import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCitasByPaciente, type Cita } from "../api/citaService";
import Swal from "sweetalert2";
import type { Paciente } from "../api/pacienteService";
import dayjs from "dayjs";
import { Box, Button, Card, CardContent, Chip, CircularProgress, Stack, Typography, useTheme } from "@mui/material";
import { useUserProfile } from "../context/userProfileContext";

interface MisCitasPacienteProps{
    
}

export default function MisCitasPaciente({
    
}:MisCitasPacienteProps) {
    const {profile: paciente} = useUserProfile();
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    const obtenerCitasPaciente = async () => {
        setLoading(true);
        try{
            const citas = await getCitasByPaciente(paciente!.id) as Cita[];
            console.log('citas', citas);
            setCitas(citas.sort((a, b) => dayjs(b.fecha_inicio).valueOf() - dayjs(a.fecha_inicio).valueOf()));
        }catch(err: any){
            Swal.fire({
                title: 'Error',
                text: `${err}`,
                icon: 'error'
            })
        }finally{
            setLoading(false)
        }
    }
    useEffect(() => {
        console.log('perfilpaciente',paciente)
        if(paciente && paciente.id){
            obtenerCitasPaciente()
        }
    }, [paciente])

    const puedeCancelar = (cita: Cita) => {
        if(!cita || cita.estado.nombre === 'cancelada') return false;
        const ahora = dayjs();
        const fechaCita = dayjs(cita.fecha_inicio);
        return fechaCita.diff(ahora, 'hour') >= 24;
    }

    const handleCancelar = async (cita: Cita) => {
        const confirm = await Swal.fire({
            title: "¿Cancelar cita?",
            text: "Solo puedes cancelar con 1 día de anticipación. Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, cancelar",
            cancelButtonText: "No",  
        });

        if(!confirm.isConfirmed) return;
        try{
            // await cancelCita(cita.id);
            // obtenerCitasPaciente()
            Swal.fire("Cita cancelada", "La cita fue cancelada exitosamente.", "success");
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error');
        }
    };

    return(
        <Box sx={{maxHeight: '70vh', overflowY: 'auto', pr: 1}} flexGrow={1}>
            <Typography variant="h5" mb={3}>
                Mis Citas
            </Typography>
            {loading ? (
                <Typography>Cargando citas...</Typography>
                // <CircularProgress />
            ) : citas.length === 0 ? (
                <Typography>No tienes citas registradas.</Typography>
            ) : (
                <Stack spacing={2}>
                    {citas.map(cita => (
                        <Card key={cita.id} variant="elevation" elevation={7} sx={{
                            border: `1px solid ${theme.palette.primary.main}`
                        }}>
                            <CardContent>
                                <Stack direction={{xs: 'column', sm:'row'}} spacing={2} alignItems={'center'} justifyContent={'space-between'}>
                                    <Box flex={1}>
                                        <Typography fontWeight={600}>
                                          {dayjs(cita.fecha_inicio).format("DD/MM/YYYY HH:mm")} — {dayjs(cita.fecha_fin).format("HH:mm")}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Especialidad: {cita.especialidad?.nombre || "-"}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Especialista: {cita.especialista?.nombre} {cita.especialista?.apellido}
                                        </Typography>
                                        {cita.motivo && (
                                            <Typography variant="body2" color="text.secondary">
                                                Motivo: {cita.motivo}
                                            </Typography>
                                        )}
                                    </Box>
                                    <Stack direction={'row'} spacing={2} alignItems={'center'}>
                                        <Chip
                                            label={cita.estado.nombre}
                                            color={
                                                cita.estado?.nombre === 'confirmada'
                                                    ? 'success'
                                                    : cita.estado?.nombre === 'cancelada'
                                                    ? 'error'
                                                    : 'warning'
                                            }
                                            variant="outlined"
                                        />
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            disabled={!puedeCancelar(cita)}
                                            onClick={() => handleCancelar(cita)}
                                        >
                                            {puedeCancelar(cita) ? 'Cancelar' : 'No se puede cancelar'}
                                        </Button>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            )}
        </Box>
    )
}