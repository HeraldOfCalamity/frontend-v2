import { Box, Container } from "@mui/material";
import Footer from "../components/common/Footer";
import { useEffect, useState } from "react";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import NavBar from "../components/common/NavBar";


interface AppLayoutProps{
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
    const [openLoginModal, setOpenLoginModal] = useState(false);

    const {login, user, isAuthenticated} = useAuth();
    const navigate = useNavigate();
    const location  = useLocation();

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
        if(isAuthenticated && user){     
            if(user?.role === 'admin' && location.pathname === '/') navigate('/admin', {replace: true});
            else if(user?.role === 'pacient' && location.pathname === '/') navigate('/perfil/paciente', {replace: true});
            else if(user?.role === 'especialist' && location.pathname === '/') navigate('/perfil/especialista', {replace: true});
            
        } else if(!isAuthenticated && location.pathname !== '/'){
            navigate('/');
        }
    }, [isAuthenticated, user, navigate, location.pathname]);

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
                maxWidth="lg" 
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