import { Box, Button, Stack, Typography } from "@mui/material"
import { useAuth } from "../../context/AuthContext"
import { useEffect, useRef, useState } from "react";
import { getEspecialistaProfile, updateEspecialista, type Especialista, type EspecialistaWithUser } from "../../api/especialistaService";
import EspecialistaForm from "../../components/admin/EspecialistaForm";
import Swal from "sweetalert2";
import { updateUsuario } from "../../api/userService";
import { getCitasByEspecialista, getMisCitas, type Cita } from "../../api/citaService";
import CalendarioCitas from "../../components/CalendarioCitas";
import { ReplayOutlined } from "@mui/icons-material";
import dayjs from "dayjs";
import { useUserProfile } from "../../context/userProfileContext";

interface InicioEspecialistaProps{

}

const InicioEspecialista: React.FC<InicioEspecialistaProps> = () => {
    const {user} = useAuth();
    const {profile, error: profileError} = useUserProfile() as {profile: EspecialistaWithUser, error: string | null};
    const [openEspecialistaForm, setOpenEspecialistaForm] = useState(false)
    const [loading, setLoading] = useState(false);
    // const [profile, setProfile] = useState<EspecialistaWithUser>();
    const [citas, setCitas] = useState<Cita[]>([]);
    const hasRun = useRef(false);
    

    const obtenerCitasEspecialista = async () => {
        setLoading(true);
        try{
            if(!profile || !profile.especialista || !profile.especialista.id) return;
            const citas = await getCitasByEspecialista(profile.especialista.id || 'adwa') as Cita[];
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
        if(!hasRun.current){
            hasRun.current = true;
            if(profileError){
                Swal.fire(
                    'Error',
                    `${profileError}`,
                    'error'
                )
                // return;
            }
            obtenerCitasEspecialista();
        }
    }, [])
    return (
        <Box>

            <Typography variant="h5" fontWeight={600} color="primary" mb={7} textAlign='center'>
                    Bienvenid@, especialista: {user?.name}
            </Typography>
                {/* {!profile?.user?.isVerified  ? (
                    <Stack display={'flex'} alignItems={'center'}>
                        <Typography textAlign={'center'} variant="h5">
                            Es necesario verificar tus datos personales!
                        </Typography>
                        <Button 
                            sx={{maxWidth: '50%', mt: 2}} 
                            variant="contained" 
                            color="primary" 
                            size="large"
                            onClick={() => setOpenEspecialistaForm(true)}
                        >
                            Verificar Datos
                        </Button>
                    </Stack>
                ) : ( */}
                    <>
                        <CalendarioCitas
                            citas={citas}
                            defaultView="day"
                            onCancelCita={async () => await obtenerCitasEspecialista()}
                            onConfirmCita={() => obtenerCitasEspecialista()}
                        />
                    </>
                {/* )} */}
    
             {/* <EspecialistaForm
                open={openEspecialistaForm}
                initialData={profile}
                onClose={handleEspecialistaFormClose}
                onSubmit={handleEspecialistaFormSubmit}
                loading={loading}
            /> */}
        </Box>
    )
}

export default InicioEspecialista;