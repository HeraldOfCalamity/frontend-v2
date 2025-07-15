import { AppBar, Box, Button, Menu, MenuItem, Stack, Toolbar, Typography } from "@mui/material"
import { useNavigate } from 'react-router-dom';
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_OPTIONS, ESPECIALIST_OPTIONS, PATIENT_OPTIONS, type NavBarButton, type NavBarConfig, type NavBarMenu } from "../../config/navbar.config";

interface NavBarProps{
    handleOpenLoginModal: () => void;
}

const NavBar: React.FC<NavBarProps> = ({handleOpenLoginModal}) => {
    const {user, isAuthenticated, logout} = useAuth();
    const [anchorEls, setAnchorEls] = useState<{[key: number]: HTMLElement | null}>({});
    const navigate = useNavigate();

    const handleMenuOpen = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEls((prev) => ({...prev, [index]: event.currentTarget}));
    }

    const handleMenuClose = (index: number) => {
        setAnchorEls((prev) => ({ ...prev, [index]: null }));
    };

    const getOptions = (): NavBarConfig => {
        switch (user?.role) {
            case 'admin':
                return ADMIN_OPTIONS;
            case 'paciente':
                return PATIENT_OPTIONS;
            case 'especialista':
                return ESPECIALIST_OPTIONS;

            default:
                return [];
        }
    };
    
    const renderNavOptions = () => {
        if(!isAuthenticated) return null;
        const options = getOptions();

        return (
            <Stack direction='row' spacing={2}>
                {options.map((option, idx) => {
                    if(option.type === 'button'){
                        const btn = option as NavBarButton;
                        return(
                            <Button
                                key={btn.text}
                                color="inherit"
                                onClick={() => navigate(btn.path)}
                                startIcon={btn.icon ?? null}
                                sx={{
                                    fontWeight: 500,
                                    opacity: 0.8,
                                    letterSpacing: 0.5
                                }}
                            >
                                {btn.text}
                            </Button>
                        );
                    }else if(option.type === 'menu'){
                        const menu = option as NavBarMenu;
                        return(
                            <React.Fragment key={menu.text}>
                                <Button
                                    color="inherit"
                                    onClick={(e) => handleMenuOpen(idx, e)}
                                    sx={{
                                        fontWeight: 500,
                                        opacity: 0.8,
                                        letterSpacing: 0.5
                                    }}
                                >
                                    {menu.text}
                                </Button>
                                <Menu
                                    anchorEl={anchorEls[idx]}
                                    open={Boolean(anchorEls[idx])}
                                    onClose={() => handleMenuClose(idx)}
                                >
                                    {menu.options.map((sub) => (
                                        <MenuItem
                                            key={sub.text}
                                            onClick={() => {
                                                navigate(sub.path);
                                                handleMenuClose(idx);
                                            }}
                                        >
                                            {sub.text}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </React.Fragment>
                        );
                    }
                    return null;
                })}
            </Stack>
        )
    }

    return(
        <AppBar color="transparent" position="static" elevation={2}>
            <Toolbar sx={{justifyContent: 'space-between'}}>
                <Typography variant="h6" component={"div"} sx={{flexGrow: 1}}>
                    Consultorio Benedetta Bellezza
                </Typography>
                <Box display='flex' alignItems='center' gap={2}>
                    {renderNavOptions()}
                    {isAuthenticated ? (
                        <>
                            <Typography
                                variant="subtitle1"
                                component='span'
                                color="primary"
                                sx={{
                                    mr:2, 
                                    fontWeight: 700,
                                    fontSize: '1.15rem',
                                    bgcolor: 'background.paper',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 2,
                                    boxShadow: 1,
                                    letterSpacing: 0.5
                                }}
                            >
                                {user?.name || user?.email || user?.user_id}
                            </Typography>
                            <Button
                                color="primary"
                                variant="outlined"
                                onClick={logout}
                                size="small"
                                sx={{ 
                                    ml: 1,
                                    fontWeight: 600, 
                                    borderRadius: 10,
                                    borderColor: 'primary.light',
                                    color: 'primary.light',
                                    background: 'transparent'
                                }}
                            >
                                Cerrar Sesion
                            </Button>
                            
                        </>
                    ) : (
                        <Button
                            color="primary"
                            variant="contained"
                            size="small"
                            onClick={handleOpenLoginModal}
                            sx={{ fontWeight: 700, borderRadius: 10, px: 3 }}
                            >
                            INICIAR SESIÓN
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    )
}

export default NavBar;