import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";

interface AppLayoutProps{
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({children}) => {
    return(
        <Box sx={{minHeight: '100vh', bgcolor: '#f5f6fa'}}>
            <AppBar position="static" color="primary" elevation={1}>
                <Toolbar>
                    <Typography variant="h6" component={"div"} sx={{flexGrow: 1}}>
                        Consultorio Benedetta Bellezza
                    </Typography>
                </Toolbar>
            </AppBar>
            <Container maxWidth="md" sx={{pt:4}}>
                {children}
            </Container>
        </Box>
    );
};

export default AppLayout;