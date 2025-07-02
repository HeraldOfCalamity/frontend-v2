import { Box, Container } from "@mui/material";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


interface AppLayoutProps{
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
    const [openLoginModal, setOpenLoginModal] = useState(false);

    const {login, user, isAuthenticated} = useAuth();
    const navigate = useNavigate();

    const handleOpenLoginModalClick = () => {
        setOpenLoginModal(true);
    }

    const handleCloseLoginModalClick = () => {
        setOpenLoginModal(false);
    }

    const handleLoginSuccess = (token: string) => {
        login(token);
        setOpenLoginModal(false);
    }

    useEffect(() => {
        console.log('iuthenticated', isAuthenticated)
        console.log('user',user)
        console.log('navigate',navigate)
        if(isAuthenticated && user){     
            if(user?.role === 'admin') navigate('/admin', {replace: true});
            else if(user?.role === 'pacient') navigate('/perfil/paciente', {replace: true});
            else if(user?.role === 'especialist') navigate('/perfil/especialista', {replace: true});
            
        } else navigate('/');
    }, [isAuthenticated, user, navigate])

    return(
        <Box sx={{
            minHeight: '100vh', 
            bgcolor:'background.default', 
            color:'text.primary',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <NavBar handleOpenLoginModal={handleOpenLoginModalClick}/>
            <Container 
                maxWidth="md" 
                sx={{
                    pt:4,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {children}
            </Container>
            <Footer />
            <LoginModal openLoginModal={openLoginModal} handleLoginModalClose={handleCloseLoginModalClick} handleLoginSuccess={handleLoginSuccess}/>
        </Box>
    );
};

export default AppLayout;