import { AppBar, Button, Toolbar, Typography } from "@mui/material"
import { useAuth } from "../context/AuthContext";

interface NavBarProps{
    handleOpenLoginModal: () => void;
}

const NavBar: React.FC<NavBarProps> = ({handleOpenLoginModal}) => {
    const {user, isAuthenticated, logout} = useAuth();
    
    return(
        <AppBar color="transparent" position="static" elevation={4}>
            <Toolbar sx={{justifyContent: 'space-between'}}>
                <Typography variant="h6" component={"div"} sx={{flexGrow: 1}}>
                    Consultorio Benedetta Bellezza
                </Typography>
                {isAuthenticated ? (
                    <>
                        <Typography
                            variant="subtitle1"
                            component='span'
                            color="textPrimary"
                            sx={{mr:2, fontWeight: 600}}
                        >
                            {user?.name || user?.email || user?.user_id}
                        </Typography>
                        <Button
                            color="primary"
                            variant="outlined"
                            onClick={logout}
                            sx={{ml: 1, fontWeight: 700, borderRadius: 10}}
                        >
                            Cerrar Sesion
                        </Button>
                        
                    </>
                ) : (
                    <Button
                        color="primary"
                        variant="contained"
                        onClick={handleOpenLoginModal}
                        sx={{ fontWeight: 700, borderRadius: 10, px: 3 }}
                        >
                        INICIAR SESIÓN
                    </Button>
                    // <Button size="small" variant="contained" onClick={() => handleOpenLoginModal()}>
                    //     <Person/> Iniciar sesión
                    // </Button>
                )}
            </Toolbar>
        </AppBar>
    )
}

export default NavBar;