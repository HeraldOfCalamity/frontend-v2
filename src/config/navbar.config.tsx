export type NavBarConfig = Array<NavBarButton | NavBarMenu>;
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';

export interface NavBarButton {
    type: 'button';
    text: string;
    path: string;
    icon?: React.ReactNode;
}


export interface NavBarMenu {
    type: 'menu';
    text: string;
    icon?: React.ReactNode;
    options: NavBarButton[];
}

export const ADMIN_OPTIONS: NavBarConfig = [
    {type: 'button', text: 'Dashboard', path: '/admin'},
    {type: 'button', text: 'Panel citas', path: '/admin/citas'},
    {
        type: 'menu', 
        text: 'Gestion Usuarios', 
        icon: <KeyboardArrowDownOutlinedIcon />, 
        options: [
            {type: 'button', text: 'Usuarios', path: '/admin/usuarios'},
            {type: 'button', text: 'Pacientes', path: '/admin/pacientes'},
            {type: 'button', text: 'Especialistas', path: '/admin/especialistas'},
        ]
    },
    {
        type: 'menu', 
        text: 'Especialidades y Tratamientos', 
        icon: <KeyboardArrowDownOutlinedIcon />, 
        options: [
            {type: 'button', text: 'Especialidades', path: '/admin/especialidades'},
            {type: 'button', text: 'Tratamientos', path: '/admin/tratamientos'},
        ]
    },
    {
        type: 'menu',
        text: 'Gestion Administrativa',
        icon: <KeyboardArrowDownOutlinedIcon />, 
        options: [
            {type: 'button', text: 'Roles y Permisos', path: '/admin/roles'},
            {type: 'button', text: 'Configuracion', path: '/admin/configuracion'},
        ]
    }
]

export const PATIENT_OPTIONS: NavBarConfig = [
    {type: 'button', text: 'Inicio', path: '/paciente/inicio'},
    {type: 'button', text: 'Mi Perfil', path: '/paciente/perfil'},
    {type: 'button', text: 'Mis Citas', path: '/paciente/citas'},
]

export const ESPECIALIST_OPTIONS: NavBarConfig = [
    {type: 'button', text: 'Inicio', path: '/especialista/inicio'},
    {type: 'button', text: 'Mi Perfil', path: '/especialista/perfil'},
    {type: 'button', text: 'Pacientes Asignados', path: '/especialista/pacientes'},
]