import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material"

interface NavBarProps{

}

const NavBar: React.FC<NavBarProps> = () => {
    return(
        <AppBar position="static" color="primary" elevation={1}>
            <Toolbar>
                <Typography variant="h6" component={"div"} sx={{flexGrow: 1}}>
                    Consultorio Benedetta Bellezza
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, p: 2 }}>
                    <Button variant="contained" color="info" sx={{ minWidth: 120 }}>
                        Iniciar sesión
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    )
}

export default NavBar;