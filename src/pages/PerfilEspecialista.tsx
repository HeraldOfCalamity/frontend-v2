import { Box, Button, Stack, Typography } from "@mui/material"
import { useAuth } from "../context/AuthContext"
import { useEffect, useRef, useState } from "react";
import { getEspecialistaProfile, updateEspecialista, type Especialista, type EspecialistaWithUser } from "../api/especialistaService";
import EspecialistaForm from "../components/admin/EspecialistaForm";
import Swal from "sweetalert2";
import { updateUsuario } from "../api/userService";

interface PerfilEspecialistaProps{

}

const PerfilEspecialista: React.FC<PerfilEspecialistaProps> = () => {
    const {user} = useAuth();
    const [openEspecialistaForm, setOpenEspecialistaForm] = useState(false)
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<EspecialistaWithUser>();
    const hasRun = useRef(false);
    
    const handleEspecialistaFormClose = () => {
        setOpenEspecialistaForm(false);
    };
    
    const handleEspecialistaFormSubmit = async (data: Partial<EspecialistaWithUser>) => {
        setLoading(true);
        let newDataEspecialista: Partial<Especialista> = {};
        try{
            if(Object.keys(profile?.especialista || {}).length > 0){
                console.log('hay datos del especialista', profile);
                newDataEspecialista = await updateEspecialista(profile?.especialista.id || '', {
                    ...data.especialista
                })
            }else{
                console.log('no hay datos del especialista')
            }

            const updatedUser = await updateUsuario(profile?.user?.id || '', {
                ...data.user,
                isVerified: true,
                role: 'especialista'
            })

            setProfile({
                ...profile,
                user: updatedUser,
                especialista: newDataEspecialista
            })

            if(!newDataEspecialista || !updatedUser){
                Swal.fire('Error', 'Error al crear usuario', 'error');
                return;
            }

            Swal.fire('Exito', 'Datos verificados exitosamente!', 'success');
            
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error')
        }finally{
            setLoading(false);
            handleEspecialistaFormClose();
        }
    }

    const checkUserVerified = async () => {
        setLoading(true);
        try{
            const perfil: EspecialistaWithUser = await getEspecialistaProfile();
            if(!perfil || !perfil?.user){
                Swal.fire('Error', 'No se pudo obtener el perfil del especialista', 'error');
                return;
            }

            setProfile({
                especialista: perfil?.especialista,
                user: perfil?.user
            });
            
            if(!perfil?.especialista! || !perfil?.user.isVerified){
                const result = await Swal.fire({
                    title: 'Atención, datos no verificados!',
                    text: 'Por favor verifique sus datos personales.',
                    icon: 'warning',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false, 
                    allowEscapeKey: false     
                });

                if (result.isConfirmed) {
                    setOpenEspecialistaForm(true);
                }
            }         
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error')
        }finally{
            setLoading(false);
        }
    }
    useEffect(() => {
        if(!hasRun.current){
            hasRun.current = true;
            checkUserVerified();
        }
    }, [])
    return (
        <Box>

            <Typography variant="h5" fontWeight={600} color="primary" mb={7} textAlign='center'>
                    Bienvenid@, especialista: {user?.name}
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
                            onClick={() => setOpenEspecialistaForm(true)}
                        >
                            Verificar Datos
                        </Button>
                    </Stack>
                )}
    
             <EspecialistaForm
                open={openEspecialistaForm}
                initialData={profile}
                onClose={handleEspecialistaFormClose}
                onSubmit={handleEspecialistaFormSubmit}
                loading={loading}
            />
        </Box>
    )
}

export default PerfilEspecialista;