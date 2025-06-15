import { AppBar, Box, Container, Toolbar, Typography, Button } from "@mui/material";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";

interface AppLayoutProps{
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
    return(
        <Box sx={{minHeight: '100vh', bgcolor: '#f5f6fa'}}>
            <NavBar />
            <Container maxWidth="md" sx={{pt:4}}>
                {children}
            </Container>
            <Footer />
        </Box>
    );
};

export default AppLayout;