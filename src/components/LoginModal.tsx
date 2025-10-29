import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { Email, Key, Person4, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import { loginApi } from "../api/authService";
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
    const [openRegisterForm, setOpenRegisterForm] = useState(false);
    const [loginMessage, setLoginMessage] = useState<{message: string, severity:'error' | 'info' | 'success' | 'warning'}>({
        message: '',
        severity: 'info'
    })
    const [credentials, setCredentials] = useState<Credentials>({
        email: '',
        password: ''
    });
    

    const handleRegisterFormClose = () => {
        setOpenRegisterForm(false);
    }

    const handleRegisterSubmit = async(data: Partial<User>) => {
        setLoginMessage({
          message: ''      ,
          severity: 'info'
        })
        setLoading(true);
        try {
            const resUser = await createUsuario(data);
            if(resUser){
                setLoginMessage({
                    message: 'Credenciales registradas con exito!',
                    severity: 'success'
                })
            }
        } catch (err: any) {
            setLoginMessage({
                message: `${err || 'afewfaw'}`,
                severity: 'error'
            })
        }finally{
            setLoading(false);
            setOpenRegisterForm(false);
        }
    }

    const handleLoginSubmit = async () => {
        setLoginMessage({
            message: '',
            severity: 'info'
        })
        setLoading(true);
        try{
            const response = await loginApi(credentials.email, credentials.password);
            handleLoginSuccess(response.access_token);
            setCredentials({email: '', password: ''});
        }catch(err: any){
            setLoginMessage({
                message: err?.response?.data?.detail || 'Error al iniciar Sesion',
                severity: 'error'
            })

        }finally{
            setLoading(false);
        }
    }

    return(
        <>
            <Dialog open={openLoginModal} onClose={handleLoginModalClose} maxWidth='xs' fullWidth>
                <DialogTitle variant="h5" fontWeight={600} >
                    Iniciar Sesión
                </DialogTitle>
                <form>
                    <DialogContent>
                        <Stack direction={'column'} alignItems={'center'}>
                            <Box
                                component={'img'}
                                src="/benedetta-bellezza.png"
                                alt="Benedetta Bellezza Logo"
                                sx={{height: 240}}
                            />
                            {/* <Typography variant="body1" color="textPrimary">
                                Ingresa tus credenciales para continuar
                            </Typography> */}
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
                                                <Email />
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
                                                <Key />
                                            </InputAdornment>
                                        ),
                                        endAdornment:(
                                            <IconButton  onClick={() => setShowPass(v => !v)}>
                                                {showPass ? <Visibility /> : <VisibilityOff />}
                                            </IconButton>
                                        )
                                    }
                                }}
                                onChange={e => setCredentials({...credentials, password: e.target.value})}
                                
                            />
                        </Stack>
                        {loginMessage.message !== '' && (
                            <Alert severity={loginMessage.severity} sx={{height:50, mt: 1}}>
                                {loginMessage.message}
                            </Alert>
                        )}
                        <DialogActions>
                            <Box display={'flex'} flexDirection={'column'} flexGrow={1} gap={1}>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    fullWidth
                                    size="small"
                                    sx={{borderRadius: 2, fontWeight:700, fontSize:'1.1rem',pt:1.2}}
                                    onClick={() => setOpenRegisterForm(v => !v)}
                                    loading={loading}
                                >
                                    Registrate!
                                </Button>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    type="submit"
                                    size="small"
                                    sx={{borderRadius: 2, fontWeight:700, fontSize:'1.1rem',pt:1.2}}
                                    disabled={!credentials.email || !credentials.password || loading}
                                    onClick={handleLoginSubmit}
                                    loading={loading}
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