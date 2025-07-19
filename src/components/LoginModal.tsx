import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { Email, Key, Person4, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { loginApi } from "../api/authService";
import Swal from "sweetalert2";
import UserForm from "./UserForm";
import { createUsuario, type User } from "../api/userService";

interface LoginModalProps{
    openLoginModal: boolean;
    handleLoginModalClose: () => void;
    handleLoginSuccess: (token: string) => void;
}

interface Credentials{
    email: string;
    password: string;
}

const LoginModal: React.FC<LoginModalProps> = ({
    handleLoginModalClose, 
    openLoginModal, 
    handleLoginSuccess,
}) => {
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [openRegisterForm, setOpenRegisterForm] = useState(false);
    const [credentials, setCredentials] = useState<Credentials>({
        email: '',
        password: ''
    });
    

    const handleRegisterFormClose = () => {
        setOpenRegisterForm(false);
    }

    const handleRegisterSubmit = async(data: Partial<User>) => {
        setLoading(true);
        try {
            const resUser = await createUsuario(data);
            if(resUser.user){
                await Swal.fire('Operacion Exitosa', 'Usuario registrado con exito', 'success');
            }else{
                Swal.fire('Error', 'Ocurrio un error al registrar el usuario', 'error');
            }
        } catch (err: any) {
            Swal.fire('Error', `${err ? err : 'Ocurrio un error al registrar el usuario'}`, 'error');
        }finally{
            setLoading(false);
            setOpenRegisterForm(false);
        }
    }

    const handleLoginSubmit = async () => {
        setLoginError('');
        setLoading(true);
        try{
            const response = await loginApi(credentials.email, credentials.password);
            handleLoginSuccess(response.access_token);
            setCredentials({email: '', password: ''});
        }catch(err: any){
            setLoginError(err?.response?.data?.detail || 'Error al iniciar Sesion')

        }finally{
            setLoading(false);
        }
    }

    return(
        <>
            <Dialog open={openLoginModal} onClose={handleLoginModalClose} maxWidth='xs' fullWidth>
                <DialogTitle variant="h5" fontWeight={600} color="primary">
                    Iniciar Sesion
                </DialogTitle>
                <form>
                    <DialogContent>
                        <Stack direction={'row'} alignItems={'center'}>
                            <Person4 sx={{fontSize: 70}}/>
                            <Typography variant="body1" color="textPrimary">
                                Ingresa tus credenciales para continuar
                            </Typography>
                        </Stack>
                        <Stack my={2} spacing={2}>
                            <TextField 
                                type="email"
                                value={credentials.email}
                                label="Correo"
                                required
                                slotProps={{
                                    input: {
                                        startAdornment:(
                                            <InputAdornment position="start">
                                                <Email color="primary"/>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                                fullWidth
                                onChange={e => setCredentials({...credentials, email: e.target.value})}
                            />
                            <TextField 
                                type={showPass ? 'text' : 'password'}
                                value={credentials.password}
                                label="Contraseña"
                                required
                                fullWidth
                                slotProps={{
                                    input: {
                                        startAdornment:(
                                            <InputAdornment position="start">
                                                <Key color="primary"/>
                                            </InputAdornment>
                                        ),
                                        endAdornment:(
                                            <IconButton color="primary" onClick={() => setShowPass(v => !v)}>
                                                {showPass ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        )
                                    }
                                }}
                                onChange={e => setCredentials({...credentials, password: e.target.value})}
                                
                            />
                        </Stack>
                        {loginError && (
                            <Alert severity='error' sx={{mt: 1}}>
                                {loginError}
                            </Alert>
                        )}
                        <DialogActions>
                            <Box display={'flex'} flexDirection={'column'} flexGrow={1} gap={1}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    size="large"
                                    sx={{borderRadius: 2, fontWeight:700, fontSize:'1.1rem',pt:1.2}}
                                    onClick={() => setOpenRegisterForm(v => !v)}
                                    loading={loading}
                                >
                                    Registrate!
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    type="submit"
                                    size="large"
                                    sx={{borderRadius: 2, fontWeight:700, fontSize:'1.1rem',pt:1.2}}
                                    disabled={!credentials.email || !credentials.password || loading}
                                    onClick={handleLoginSubmit}
                                    endIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
                                >
                                    {loading ? "Ingresando..." : "Ingresar"}
                                </Button>
                            </Box>
                        </DialogActions>
                    </DialogContent>
                </form>
            </Dialog>
            <UserForm
                open={openRegisterForm}
                onClose={handleRegisterFormClose}
                onSubmit={handleRegisterSubmit}
                loading={loading}
            />
        </>
    )
}

export default LoginModal;