import { Box, CircularProgress, Container } from "@mui/material";
import Footer from "../components/common/Footer";
import { useState } from "react";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";
import NavBar from "../components/common/NavBar";


interface AppLayoutProps{
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
    const [openLoginModal, setOpenLoginModal] = useState(false);

    const {login} = useAuth();


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
            <LoginModal 
                openLoginModal={openLoginModal} 
                handleLoginModalClose={handleCloseLoginModalClick} 
                handleLoginSuccess={handleLoginSuccess}
            />
        </Box>
    );
};

export default AppLayout;