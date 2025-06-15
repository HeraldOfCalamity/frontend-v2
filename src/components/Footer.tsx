import { Box, Typography } from "@mui/material"

const Footer: React.FC = () => {
    return(
        <Box sx={{ width: '100%', py: 3, bgcolor: '#eee', textAlign: 'center', mt: 8 }}>
            <Typography variant="body2">2025</Typography>
        </Box>
    )
}

export default Footer;