import { Box, CircularProgress, Typography } from "@mui/material"
import { useAuth } from "../../context/AuthContext"
import { useEffect, useState } from "react";
import { type EspecialistaWithUser } from "../../api/especialistaService";
import Swal from "sweetalert2";
import { getCitasByEspecialista, type Cita } from "../../api/citaService";
import CalendarioCitas from "../../components/CalendarioCitas";
import dayjs from "dayjs";
import { useUserProfile } from "../../context/userProfileContext";
import HistorialDialog from "./Historial/HistorialDialog";
import { SpeechProvider } from "../../context/SpeechContext";
import { getPacienteProfileById, type PacienteWithUser } from "../../api/pacienteService";

interface InicioEspecialistaProps{

}

const InicioEspecialista: React.FC<InicioEspecialistaProps> = () => {
    const {profile, reloadProfile, loading: loadingProfile} = useUserProfile();
    const espProfile = profile as EspecialistaWithUser;
    const [loading, setLoading] = useState(false);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [openAtencion, setOpenAtencion] = useState(false);
    const [selectedPacienteProfile, setSelectedPacienteProfile] = useState<PacienteWithUser>()
    

    const obtenerCitasEspecialista = async () => {
        setLoading(true);
        try{
            const citas = await getCitasByEspecialista(espProfile?.especialista.id || '') as Cita[];
            setCitas(citas.sort((a, b) => 
                dayjs(b.fecha_inicio).valueOf() - dayjs(a.fecha_inicio).valueOf()
            ));
            console.log('citas', citas);
            
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

    const handleAtenderCita = async (pacienteId: string) => {
        try{
            const paciente = await getPacienteProfileById(pacienteId);
            if(!paciente){
                Swal.fire({
                    title: 'Error',
                    text: `Ocurrió un error al obtener datos de la cita.`,
                    icon: 'error'
                })
                return;
            }

            setSelectedPacienteProfile(paciente);
            setOpenAtencion(true)
        }catch(err: any){
            Swal.fire({
                title: 'Error',
                text: `${err}`,
                icon: 'error'
            })
        }
    }

    useEffect(() => {
        if(!loadingProfile && espProfile?.especialista){
            obtenerCitasEspecialista();
        }
    }, [loadingProfile,espProfile])

    return (
        loading || loadingProfile || !espProfile?.especialista ? (
            <Box display={'flex'} justifyContent={'center'} alignItems={'center'} flexGrow={1}>
                <CircularProgress color="secondary"/>
            </Box>
        ) : (
            <Box>

                <Typography variant="h4" fontWeight={600}  mb={7} textAlign='center'>
                        Bienvenid@, especialista: {espProfile?.user.name} {espProfile?.user.lastname}
                </Typography>

                <CalendarioCitas
                    citas={citas}
                    defaultView="day"
                    onAtenderCita={(cita) => {
                        handleAtenderCita(cita?.paciente || '')
                    }}
                />
                <SpeechProvider>
                    <HistorialDialog
                        onClose={() => setOpenAtencion(false)}
                        open={openAtencion}
                        pacienteProfile={selectedPacienteProfile as PacienteWithUser}
                    />
                </SpeechProvider>
            </Box>
        )
    )
}

export default InicioEspecialista;