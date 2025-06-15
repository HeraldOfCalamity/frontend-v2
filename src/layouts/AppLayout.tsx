import { Box, Container } from "@mui/material";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

interface AppLayoutProps{
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
    return(
        <Box sx={{minHeight: '100vh', bgcolor:'background.default', color:'text.primary'}}>
            <NavBar />
            <Container maxWidth="md" sx={{pt:4}}>
                {children}
            </Container>
            <Footer />
        </Box>
    );
};

export default AppLayout;