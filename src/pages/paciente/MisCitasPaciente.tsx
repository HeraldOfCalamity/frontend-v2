import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { cancelCita, confirmCita, getCitasByPaciente, type Cita } from "../../api/citaService";
import Swal from "sweetalert2";
import type { Paciente, PacienteWithUser } from "../../api/pacienteService";
import dayjs from "dayjs";
import { Box, Button, Card, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, useTheme } from "@mui/material";
import { useUserProfile } from "../../context/userProfileContext";
import { ReplayOutlined } from "@mui/icons-material";
import CancelMotivoDialog from "../../components/common/CancelMotivoDialog";

interface MisCitasPacienteProps{
    
}

export default function MisCitasPaciente({
    
}:MisCitasPacienteProps) {
    const {profile} = useUserProfile();
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(false);
    const [openCancelMotivo, setOpenCancelMotivo] = useState(false);
    // const [cancelMotivo, setCancelMotivo] = useState('');
    const [selectedCita, setSelectedCita] = useState<Cita>()
    const theme = useTheme();

    const obtenerCitasPaciente = async () => {
        setLoading(true);
        try{

            const paciente = profile as PacienteWithUser;
            const citas = await getCitasByPaciente(paciente.paciente.id || '') as Cita[];
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
    const handleCitasRefresh = async () => {
        await obtenerCitasPaciente();
    }
    useEffect(() => {
        const paciente = profile as PacienteWithUser;
        if(paciente && paciente.paciente.id){
            obtenerCitasPaciente()
        }
    }, [profile])

    const puedeCancelar = (cita: Cita) => {
        if(
            !cita 
            || cita.estado.nombre === 'cancelada'
            || cita.estado.nombre === 'confirmada'
        ) return false;
        const ahora = dayjs();
        const fechaCita = dayjs(cita.fecha_inicio);
        return fechaCita.diff(ahora, 'hour') >= 24;
    }

    const puedeConfirmar = (cita: Cita) => {
        return cita.estado?.nombre === 'pendiente';
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

        await Swal.fire(
            'Atención',
            'Es necesario proporcionar un motivo de cancelación.',
            'warning'
        )
        setSelectedCita(cita)
        setOpenCancelMotivo(true);
    };
    const handleConfirmar = async (cita: Cita) => {
        const confirm = await Swal.fire({
            title: "¿Confirmar cita?",
            text: "Solo puedes confirmar con 1 día antes de tu consulta.",
            icon: "info",
            showCancelButton: true,
            confirmButtonText: "Sí, confirmar",
            cancelButtonText: "No",  
        });

        if(!confirm.isConfirmed) return;
        try{
            await confirmCita(cita.id);
            await obtenerCitasPaciente()
            Swal.fire(
                "Cita confirmada", 
                "La cita fue confirmada exitosamente. En un momento recibirá un correo de confirmación", 
                "success"
            );
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error');
        }
    };

    const cancelarCita =  async (cancelMotivo: string) => {
        if(cancelMotivo.trim() === '' || !selectedCita){
            await Swal.fire(
                'Atención',
                'Debe ingresar un motivo válido, el campo es requerido.',
                'warning'
            )
            return;
        }
        
        try{
            await cancelCita(selectedCita.id, cancelMotivo);
            await obtenerCitasPaciente()
            Swal.fire("Cita cancelada", "La cita fue cancelada exitosamente.", "success");
            setOpenCancelMotivo(false)
            setSelectedCita(undefined)
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error');
        }
    }

    return(
        <Box sx={{maxHeight: '70vh', overflowY: 'auto', pr: 1}} flexGrow={1}>
            <Typography variant="h5" mb={3}>
                Mis Citas
            </Typography>
            <Stack direction={'row'} mb={1} justifyContent={'end'}>
                <Button variant="contained" onClick={handleCitasRefresh} startIcon={<ReplayOutlined />}>
                    Refrescar
                </Button>
            </Stack>
            {loading ? (
                <Typography>Cargando citas...</Typography>
                // <CircularProgress />
            ) : citas.length === 0 ? (
                <Typography>No tienes citas registradas.</Typography>
            ) : (
                <>
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
                                                Especialidad: {cita.especialidad || "-"}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Especialista: {cita.especialista}
                                            </Typography>
                                            {cita.motivo && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Motivo: {cita.motivo}
                                                </Typography>
                                            )}
                                            {cita.estado.nombre === 'cancelada' && cita.cancel_motivo && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Motivo Cancelación: {cita.cancel_motivo}
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
                                            <Button
                                                variant="contained"
                                                color="success"
                                                onClick={() => handleConfirmar(cita)}
                                                sx={{
                                                    display: !puedeConfirmar(cita) ? 'none' : ''
                                                }}
                                            >
                                                Confirmar
                                            </Button>
                                        </Stack>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </>
            )}
            <CancelMotivoDialog
                open={openCancelMotivo}
                initial=""
                onClose={() =>{ setOpenCancelMotivo(false); setSelectedCita(undefined);}}
                onConfirm={(m) => cancelarCita(m)}
            />
        </Box>
    )
}