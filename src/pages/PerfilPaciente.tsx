import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import PacienteForm from "../components/admin/PacienteForm";
import { createPaciente, getPacienteByUserId, getPacienteProfile, updatePaciente, type Paciente, type PacienteWithUser } from "../api/pacienteService";
import { LocalDiningOutlined } from "@mui/icons-material";
import { updateUsuario } from "../api/userService";

interface PerfilPacienteProps{

}

const PerfilPaciente: React.FC<PerfilPacienteProps> = ({

}) => {
    const {user, isLoading} = useAuth();
    const [openPacienteForm, setOpenPacienteForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<PacienteWithUser>();
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

    useEffect(() => {
        if (!hasRun.current && user) {
            hasRun.current = true;
            checkUserVerified();
        }
    }, []);

    return(
        <Box>
            <Typography variant="h5" fontWeight={600} color="primary" mb={7} textAlign='center'>
                Bienvenid@, paciente: {user?.name}
            </Typography>
            {!profile?.user?.isVerified && !loading && (
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