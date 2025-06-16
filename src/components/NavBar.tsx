import { Person } from "@mui/icons-material";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material"

interface NavBarProps{
    handleLoginClick: null | (() => void);
}

const NavBar: React.FC<NavBarProps> = ({handleLoginClick}) => {
    return(
        <AppBar color="secondary" position="static" elevation={4}>
            <Toolbar>
                <Typography variant="h6" component={"div"} sx={{flexGrow: 1}}>
                    Consultorio Benedetta Bellezza
                </Typography>
                {handleLoginClick ? <Box sx={{ display: 'flex', justifyContent: 'flex-end',  gap: 2, p: 2 }}>
                    <Button size="small"  variant="contained" onClick={handleLoginClick}>
                        <Person/> Iniciar sesión
                    </Button>
                </Box>:null}
            </Toolbar>
        </AppBar>
    )
}

export default NavBar;