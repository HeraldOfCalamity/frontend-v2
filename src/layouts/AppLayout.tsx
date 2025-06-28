import { Box, Container } from "@mui/material";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { useState } from "react";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";


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
        <Box sx={{minHeight: '100vh', bgcolor:'background.default', color:'text.primary'}}>
            <NavBar handleOpenLoginModal={handleOpenLoginModalClick}/>
            <Container maxWidth="md" sx={{pt:4}}>
                {children}
            </Container>
            <Footer />
            <LoginModal openLoginModal={openLoginModal} handleLoginModalClose={handleCloseLoginModalClick} handleLoginSuccess={handleLoginSuccess}/>
        </Box>
    );
};

export default AppLayout;