import { Box, Button, Container } from "@mui/material";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { useState } from "react";
import Modal from "../components/Modal";
import LoginModal from "../components/LoginModal";

interface AppLayoutProps{
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
    const [openLoginModal, setOpenLoginModal] = useState(false);
    const [userLogged, setUserLogged] = useState(false);

    const handleOpenLoginModalClick = () => {
    setOpenLoginModal(true);
    }

    const handleCloseLoginModalClick = () => {
    setOpenLoginModal(false);
    }

    return(
        <Box sx={{minHeight: '100vh', bgcolor:'background.default', color:'text.primary'}}>
            <NavBar handleLoginClick={!userLogged ? handleOpenLoginModalClick : null}/>
            <Container maxWidth="md" sx={{pt:4}}>
                {children}
            </Container>
            <Footer />
            <LoginModal openLoginModal={openLoginModal} handleLoginModalClose={handleCloseLoginModalClick} handleLoginSuccess={() => {}}/>
        </Box>
    );
};

export default AppLayout;