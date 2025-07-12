import { Alert, Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import Modal from "./common/Modal"
import { Email, Key, Person4, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import CustomInput from "./common/CustomInput";
import { loginApi } from "../api/authService";

interface LoginModalProps{
    openLoginModal: boolean;
    handleLoginModalClose: () => void;
    handleLoginSuccess: (token: string) => void;
}

interface Credentials{
    email: string;
    password: string;
}

const LoginModal: React.FC<LoginModalProps> = ({handleLoginModalClose, openLoginModal, handleLoginSuccess}) => {
    const [showPass, setShowPass] = useState(false);
    const [credentials, setCredentials] = useState<Credentials>({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        setLoading(true);
        try{
            const response = await loginApi(credentials.email, credentials.password);
            handleLoginSuccess(response.access_token);
            setCredentials({email: '', password: ''});
        }catch(err: any){
            setError(
                err?.response?.data.detail ||
                err?.message ||
                "Ocurrio un error en el inicio de sesion."
            );
        }finally{
            setLoading(false);
        }
    }

    return(
        <Modal 
            open={openLoginModal} 
            onClose={handleLoginModalClose}
            title="Iniciar Sesion"
            content={
                <Box p={2}>
                    <Box sx={{display: 'flex', gap:2, alignItems:'center', mb:3}}>
                        <Person4 sx={{fontSize: 70}}/>
                        <Typography variant="body1" color="textPrimary">
                            Ingresa tus credenciales para continuar
                        </Typography>
                    </Box>
                    <Box sx={{display: 'flex', flexDirection: "column", gap:3, minWidth: '33vh', width: '50%', mx: 'auto'}}>
                        <CustomInput 
                            id="email-input"
                            type="email"
                            value={credentials.email}
                            handleChange={e => setCredentials({...credentials, email: e.target.value})}
                            placeholder="Correo"
                            startIcon={<Email color="primary" />}
                            required
                            disabled={loading}
                        />
                        <CustomInput
                            id="password-input"
                            type={showPass ? "text" : "password"}
                            value={credentials.password}
                            handleChange={e => setCredentials({...credentials, password: e.target.value})}
                            placeholder="Contraseña"
                            startIcon={<Key color="primary" />}
                            endIcon={<IconButton onClick={() => setShowPass(v => !v)} edge='end' size="small">
                                {showPass ? <VisibilityOff /> : <Visibility />}
                            </IconButton>}
                            required
                            disabled={loading}
                        />
                        {error && (
                            <Alert severity='error' sx={{mt: 1}}>
                                {error}
                            </Alert>
                        )}
                    </Box>
                </Box>
            }
            actions={
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    type="submit"
                    size="large"
                    sx={{borderRadius: 2, fontWeight:700, fontSize:'1.1rem',pt:1.2}}
                    disabled={!credentials.email || !credentials.password || loading}
                    onClick={handleSubmit}
                    endIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
                >
                    {loading ? "Ingresando..." : "Ingresar"}
                </Button>
            }
        />
    )
}

export default LoginModal;