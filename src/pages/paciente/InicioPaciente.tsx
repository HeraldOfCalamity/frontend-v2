import { Box, Button, Card, CardActionArea, CardContent, CardMedia, CircularProgress, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import PacienteForm from "../../components/admin/PacienteForm";
import { createPaciente, getPacienteByUserId, getPacienteProfile, updatePaciente, type Paciente, type PacienteWithUser } from "../../api/pacienteService";
import { LocalDiningOutlined } from "@mui/icons-material";
import { updateUsuario } from "../../api/userService";
import { getEspecialidades, type Especialidad } from "../../api/especialidadService";
import ReservaCita from "../../components/ReservarCita/ReservaCita";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { BASE_URL } from "../../config/benedetta.api.config";

interface InicioPacienteProps{

}

const InicioPaciente: React.FC<InicioPacienteProps> = ({

}) => {
    const {user, isLoading} = useAuth();
    const [openPacienteForm, setOpenPacienteForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<PacienteWithUser>();
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [openReservaCitaModal, setOpenReservaCitaModal] = useState(false);
    const [selectedEspecialidad, setSelectedEspecialidad] = useState<Partial<Especialidad>>()
    const hasRun = useRef(false);

    
    const handlePacienteFormClose = () => {
        setOpenPacienteForm(false);
    }
    
    const handlePacienteFormSubmit = async (data: Partial<PacienteWithUser>) => {
        setLoading(true);

        let newDataPaciente: Partial<Paciente> = {};
        try{
            if(Object.keys(profile?.paciente || {}).length > 0){
                console.log('hay datos de paciente', profile);
                newDataPaciente = await updatePaciente(profile?.paciente.id || '', {
                    ...data.paciente
                })
            }else{
                console.log('no hay datos de paciente', profile)
                newDataPaciente = await createPaciente({
                    ...data.paciente,
                    user_id: profile?.user?.id
                })
            }

            const updatedUser = await updateUsuario(profile?.user?.id || '', {
                ...data.user,
                isVerified: true,
                role: 'paciente'
            })

            setProfile({
                ...profile,
                user: updatedUser,
                paciente: newDataPaciente
            })

            if(!newDataPaciente || !updatedUser){
                Swal.fire('Error', 'Error al crear usuario', 'error');
                return;
            }

            Swal.fire('Exito', 'Datos verificados exitosamente!', 'success');
            


        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error');
        }finally{
            setLoading(false);
            handlePacienteFormClose()
        }
    }
    const checkUserVerified = async () => {
        setLoading(true);
        try{
            const perfil: PacienteWithUser = await getPacienteProfile();
            if(!perfil || !perfil?.user){
                Swal.fire('Error', 'No se pudo obtener el perfil del paciente', 'error');
                return;
            }

            setProfile({
                paciente: perfil?.paciente,
                user: perfil?.user
            });
            
            if(!perfil?.paciente! || !perfil?.user.isVerified){
                const result = await Swal.fire({
                    title: 'Atención, datos no verificados!',
                    text: 'Por favor verifique sus datos personales.',
                    icon: 'warning',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false, 
                    allowEscapeKey: false     
                });

                if (result.isConfirmed) {
                    setOpenPacienteForm(true);
                }
            }         
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error')
        }finally{
            setLoading(false);
        }
    }

    const handleReservarCita = (especialidad: Especialidad) => {
        // Aquí puedes abrir un modal, navegar a otra ruta, etc.
        // Por ejemplo:
        // navigate(`/reservar-cita/${especialidad.id}`);
        // Swal.fire("Reservar cita", `Iniciar reserva para ${JSON.stringify(especialidad)}`, "info");
        setSelectedEspecialidad(especialidad);
        setOpenReservaCitaModal(true);
    };

    const handleReservaCitaModalClose = () => {
        setOpenReservaCitaModal(false);
        setSelectedEspecialidad(undefined);
    }

    

    useEffect(() => {
        const obtenerEspecialidades = async () => {
            try{
                const especialidades = await getEspecialidades();
                setEspecialidades(especialidades);
            }catch{
                console.error('Error al obtener las especialidades');
            }
        }
        if (!hasRun.current && user) {
            hasRun.current = true;
            checkUserVerified();
            obtenerEspecialidades();
        }
    }, []);

    return(
        <Box display={'flex'} flexDirection={'column'} flexGrow={1}>
            <Typography variant="h4" fontWeight={600} mb={7} textAlign='center'>
                Bienvenid@ de nuevo: {user?.name}  {user?.lastname}
            </Typography>
            <Box display={'flex'} flexDirection={'column'} flexGrow={1} justifyContent={'center'}>
                {/* {(loading || isLoading) && } */}
                {!profile?.user?.isVerified && !loading ? (
                    <Stack display={'flex'} alignItems={'center'}>
                        <Typography textAlign={'center'} variant="h5">
                            Es necesario verificar tus datos personales!
                        </Typography>
                        <Button 
                            sx={{maxWidth: '50%', mt: 2}} 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            onClick={() => setOpenPacienteForm(true)}
                        >
                            Verificar Datos
                        </Button>
                    </Stack>
                ):(
                    <>
                        <Typography variant="h5" mb={4} bgcolor={'palette.secondary.main'}>
                            Elige una especialidad y reserva tu cita ahora!
                        </Typography>
                        <Grid container spacing={2} mb={5}>
                            {especialidades.map((esp) => (
                                <Grid size={{xs:12, sm:6, md:4}} key={esp.id}>
                                    <Card>
                                        <CardActionArea onClick={() => handleReservarCita(esp)}>
                                            <CardMedia
                                                sx={{height:140}}
                                                image={`${BASE_URL}${esp.image}`}
                                            >
                                                {!esp.image && <Skeleton variant="rectangular" height={140} sx={{pb: 2}}/>}
                                            </CardMedia>
                                            <CardContent>
                                                <Typography variant="h6" textAlign="center">
                                                    {esp.nombre}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Box>

            <PacienteForm
                open={openPacienteForm}
                initialData={profile}
                onClose={handlePacienteFormClose}
                onSubmit={handlePacienteFormSubmit}
                loading={loading}
                invisibleFields={['isActive']}
            />
            <ReservaCita
                open={openReservaCitaModal}
                onClose={handleReservaCitaModalClose}
                especialidad={selectedEspecialidad || {}}
                paciente={profile || {}}
            />
        </Box>
    );
}

export default InicioPaciente;