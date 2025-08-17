import { Box, Typography } from "@mui/material"



const Footer: React.FC = () => {
    return(
        <Box component="footer" 
            sx={{ 
                width: '100%', 
                p: 3,  
                zIndex: 2,
                bgcolor: theme => theme.palette.grey[600]
            }}>
            <Typography variant="body2">
                 © 2025 Consultorio Benedetta Bellezza. Todos los derechos reservados.
            </Typography>
        </Box>
    )
}

export default Footer;