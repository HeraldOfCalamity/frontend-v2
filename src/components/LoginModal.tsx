import { Box, Button, IconButton, Typography } from "@mui/material";
import Modal from "./Modal"
import { CreateRounded, Email, Password, Person4, Person4Outlined, Visibility, VisibilityOff } from "@mui/icons-material";
import { useState } from "react";
import CustomInput from "./CustomInput";
import { loginUser } from "../services/authService";

interface LoginModalProps{
    openLoginModal: boolean;
    handleLoginModalClose: () => void;
    handleLoginSuccess: () => void;
}

interface Credentials{
    email: string;
    password: string;
}

const LoginModal: React.FC<LoginModalProps> = ({handleLoginModalClose, openLoginModal}) => {
    const [showPass, setShowPass] = useState(false);
    const [credentials, setCredentials] = useState<Credentials>({
        email: '',
        password: ''
    });

    const handleSubmit = async () => {
        const response = await loginUser(credentials.email, credentials.password);
        alert(response);
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
                        />
                        <CustomInput
                            id="password-input"
                            type={showPass ? "text" : "password"}
                            value={credentials.password}
                            handleChange={e => setCredentials({...credentials, password: e.target.value})}
                            placeholder="Contraseña"
                            startIcon={<Password color="primary"/>}
                            endIcon={<IconButton onClick={() => setShowPass(v => !v)} edge='end' size="small">
                                {showPass ? <VisibilityOff /> : <Visibility />}
                            </IconButton>}
                        />
                    </Box>
                </Box>
            }
            actions={
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    sx={{borderRadius: 2, fontWeight:700, fontSize:'1.1rem',pt:1.2}}
                    disabled={!credentials.email || !credentials.password}
                    onClick={handleSubmit}
                >Ingresar</Button>
            }
        />
    )
}

export default LoginModal;