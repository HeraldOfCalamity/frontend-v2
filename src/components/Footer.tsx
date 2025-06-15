import { Box, Typography } from "@mui/material"



const Footer: React.FC = () => {
    return(
        <Box component="footer" 
            sx={{ 
                width: '100%', 
                py: 3, 
                textAlign: 'center', 
                mt: 8, 
                bgcolor: theme => theme.palette.mode === 'light' ? theme.palette.secondary.main : theme.palette.background.paper
            }}>
            <Typography variant="body2">
                 © 2025 Consultorio Benedetta Bellezza. Todos los derechos reservados.
            </Typography>
        </Box>
    )
}

export default Footer;