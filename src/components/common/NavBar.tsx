import { AppBar, Box, Button, Drawer, IconButton, Menu, MenuItem, Stack, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material"
import { useNavigate } from 'react-router-dom';
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import MenuIcon from '@mui/icons-material/Menu'
import { ADMIN_OPTIONS, ESPECIALIST_OPTIONS, PATIENT_OPTIONS, type NavBarButton, type NavBarConfig, type NavBarMenu } from "../../config/navbar.config.tsx";
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined';

interface NavBarProps{
    handleOpenLoginModal: () => void;
}

const NavBar: React.FC<NavBarProps> = ({handleOpenLoginModal}) => {
    const {user, isAuthenticated, logout} = useAuth();
    const [anchorEls, setAnchorEls] = useState<{[key: number]: HTMLElement | null}>({});
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    

    const handleMenuOpen = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEls((prev) => ({...prev, [index]: event.currentTarget}));
        setHoverIndex(index);
    }

    const handleMenuClose = (index: number) => {
        setAnchorEls((prev) => ({ ...prev, [index]: null }));
        setHoverIndex(null);
    };

    const handleLogOutClick = () => {
        logout();
        navigate('/', {replace: true});
    }
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
    
    const renderNavOptions = (vertical: boolean=false) => {
        if(!isAuthenticated) return null;
        const options = getOptions();

        return (
            <Stack direction={vertical ? 'column' : 'row'} spacing={vertical ? 1 : 2}>
                {options.map((option, idx) => {
                    if(option.type === 'button'){
                        const btn = option as NavBarButton;
                        return(
                            <Button
                                key={btn.text}
                                color="inherit"
                                size="large"
                                onClick={() => {
                                    navigate(btn.path);
                                    if (vertical) setMobileOpen(true);
                                }}
                                startIcon={btn.icon ?? null}
                                sx={{
                                    fontWeight: 500,
                                    // fontSize: '0.85rem',
                                    textTransform: 'capitalize',
                                    justifyContent: vertical ? 'flex-start' : 'center',
                                }}
                            >
                                {btn.text}
                            </Button>
                        );
                    }else if(option.type === 'menu'){
                        const menu = option as NavBarMenu;
                        const isOpen = Boolean(anchorEls[idx]);

                        return(
                            <Box
                                key={menu.text}
                                onMouseEnter={(e) => handleMenuOpen(idx, e as any)}
                                onMouseLeave={() => handleMenuClose(idx)}
                            >
                                <Button
                                    color="inherit"
                                    onClick={(e) => handleMenuOpen(idx, e)}
                                    size="large"
                                    sx={{
                                        fontWeight: 500,
                                        // fontSize: '0.85rem',
                                        textTransform: 'none'
                                    }}
                                    endIcon={
                                        option.icon
                                    }
                                >
                                    {menu.text}
                                </Button>
                                <Menu
                                    anchorEl={anchorEls[idx]}
                                    open={isOpen}
                                    onClose={() => handleMenuClose(idx)}
                                    slotProps={{list: {
                                        onMouseLeave: () => handleMenuClose(idx),
                                    }}}
                                >
                                    {menu.options.map((sub) => (
                                        <MenuItem
                                            key={sub.text}
                                            onClick={() => {
                                                navigate(sub.path);
                                                handleMenuClose(idx);
                                                setMobileOpen(false);
                                            }}
                                        >
                                            {sub.text}
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </Box>
                        );
                    }
                    return null;
                })}
            </Stack>
        )
    }

    return(
        <AppBar color="transparent" position="static" elevation={0} sx={{zIndex:3, pt:2}}>
            <Toolbar sx={{justifyContent: 'space-between'}}>
                <Box display={'flex'} alignItems={'center'} gap={2}>
                    <Box
                        component={'img'}
                        src="/benedetta-bellezza-horizontal.svg"
                        alt="Benedetta Bellezza Logo"
                        sx={{height: 70}}
                    />
                    {(!isMobile && isAuthenticated) && <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 600,
                            // fontSize: '0.95rem',
                            bgcolor: 'background.paper',
                            px: 2,
                            py: 0.5,
                            borderRadius: 2,
                            boxShadow: 1,
                            textTransform: 'capitalize'
                        }}
                    >
                        {user?.name || user?.email}
                    </Typography>}
                </Box>
                {isMobile ? (
                    <>
                        <IconButton edge='end' onClick={() => setMobileOpen(!mobileOpen)}>
                            <MenuIcon />
                        </IconButton>
                        <Drawer
                            anchor="right"
                            open={mobileOpen}
                            onClose={() => setMobileOpen(false)}
                        >
                            
                            <Box p={2} width={250}>
                                <Box mb={2} textAlign="center">
                                    <Box
                                        component="img"
                                        src="/benedetta-bellezza-horizontal.svg"
                                        alt="Logo"
                                        sx={{ height: 60, margin: "0 auto" }}
                                    />
                                    <Typography
                                        variant="subtitle2"
                                        // color="primary"
                                        sx={{
                                            fontWeight: 600,
                                            // fontSize: '0.95rem',
                                            bgcolor: 'background.paper',
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 2,
                                            boxShadow: 1,
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {user?.name || user?.email}
                                    </Typography>
                                </Box>
                                {isAuthenticated && renderNavOptions(true)}

                                <Box mt={2}>
                                    {isAuthenticated ? (
                                        <Button
                                            color="error"
                                            variant="outlined"
                                            size="large"
                                            onClick={handleLogOutClick}
                                            fullWidth
                                            startIcon={<PowerSettingsNewOutlinedIcon />}
                                        >
                                            Cerrar Sesión
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={() => {
                                                handleOpenLoginModal();
                                                setMobileOpen(false);
                                            }}
                                            size="large"
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                        >
                                            Iniciar sesión
                                        </Button>
                                    )}
                                </Box>
                            </Box>
                        </Drawer>
                    </>
                ) : (
                    <Box display='flex' alignItems='center' gap={2}>
                        {isAuthenticated && renderNavOptions()}
                        {isAuthenticated ? (
                            <>
                               
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleLogOutClick}
                                    size="large"
                                    startIcon={<PowerSettingsNewOutlinedIcon />}
                                    sx={{ 
                                        textTransform: 'none'
                                    }}
                                >
                                    Cerrar Sesión
                                </Button>
                            </>
                        ) : (
                            <Button
                                
                                variant="contained"
                                size="large"
                                onClick={handleOpenLoginModal}
                                sx={{ textTransform: 'none' }}
                                >
                                Iniciar Sesión
                            </Button>
                        )}
                    </Box>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default NavBar;