import { Box, Button, Stack, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import PacienteForm from "../components/admin/PacienteForm";
import { getPacienteByUserId, getPacienteProfile, type Paciente, type PacienteWithUser } from "../api/pacienteService";
import { LocalDiningOutlined } from "@mui/icons-material";

interface PerfilPacienteProps{

}

const PerfilPaciente: React.FC<PerfilPacienteProps> = ({

}) => {
    const {user} = useAuth();
    const [openPacienteForm, setOpenPacienteForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<PacienteWithUser>();
    const hasRun = useRef(false);

    
    const handlePacienteFormClose = () => {
        setOpenPacienteForm(false);
    }
    
    const handlePacienteFormSubmit = async (data: Partial<PacienteWithUser>) => {
        setLoading(true);
        try{
            console.log('profile', profile)
            console.log('data', data)
        }catch(err: any){
            Swal.fire('Error', `${err || 'Ocurrio un error al editar.'}`, 'error');
        }finally{
            setLoading(false);
            handlePacienteFormClose()
        }
    }
    const checkUserVerified = async () => {
        try{
            // const paciente = await getPacienteByUserId(user?.user_id!);
            const perfil: PacienteWithUser | null = await getPacienteProfile();

            if (perfil?.paciente) {
                setProfile({
                    paciente: perfil.paciente,
                    user: perfil.user
                });
            } else {
                setProfile(v => ({ user: perfil?.user!, paciente: {} }));

                setLoading(true);
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
                setLoading(false);
            }
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error')
        }
    }

    useEffect(() => {
        if (!hasRun.current && user) {
            hasRun.current = true;
            checkUserVerified();
        }
    }, []);

    return(
        <Box>
            <Typography variant="h5" fontWeight={600} color="primary" mb={7} textAlign='center'>
                Bienvenido: {user?.name}
            </Typography>
            {!profile?.user?.isVerified && (
                loading ? (
                    null
                ) : (
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
                )
            )}
            <PacienteForm
                open={openPacienteForm}
                initialData={profile}
                onClose={handlePacienteFormClose}
                onSubmit={handlePacienteFormSubmit}
                loading={loading}
            />
        </Box>
    );
}

export default PerfilPaciente;