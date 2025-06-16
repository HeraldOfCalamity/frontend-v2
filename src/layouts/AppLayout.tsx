import { Box, Button, Container } from "@mui/material";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { useState } from "react";
import Modal from "../components/Modal";

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
            <Modal 
                open={openLoginModal} 
                onClose={handleCloseLoginModalClick}
                title="My Modal"
                text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Officia repellat, laborum a possimus qui sunt sequi modi optio aspernatur, eius minus iusto reiciendis fuga, magnam illum ipsam laboriosam ab! Sit.
            Porro obcaecati ex incidunt dolorum voluptates ipsam repellendus quasi asperiores. Repellat veritatis, totam aspernatur quia autem sequi eveniet non sint quam magni. Delectus eius, tempora aliquam totam itaque maxime deleniti.
            Nesciunt, eligendi? Id natus ad ratione sapiente, magni placeat dolores rerum ullam quas quam facilis ipsum, nihil repellendus eos ex quo! Amet quia ut repellendus fugit veniam voluptatum cum officiis?"
                actions={
                    <Box>
                        <Button size="large" variant="text" onClick={handleCloseLoginModalClick}>Cerrar</Button>
                    </Box>
                }
            />
        </Box>
    );
};

export default AppLayout;