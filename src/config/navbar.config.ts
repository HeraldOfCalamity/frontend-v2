export type NavBarConfig = Array<NavBarButton | NavBarMenu>;

export interface NavBarButton {
    type: 'button';
    text: string;
    path: string;
    icon?: React.ReactNode;
}


export interface NavBarMenu {
    type: 'menu';
    text: string;
    options: NavBarButton[];
}

export const ADMIN_OPTIONS: NavBarConfig = [
    {type: 'button', text: 'Panel Admin', path: '/admin'},
    {
        type: 'menu', 
        text: 'Gestion Usuarios', 
        options: [
            {type: 'button', text: 'Usuarios', path: '/admin/usuarios'},
            {type: 'button', text: 'Pacientes', path: '/admin/pacientes'},
            {type: 'button', text: 'Especialistas', path: '/admin/especialistas'},
        ]
    },
    {
        type: 'menu',
        text: 'Gestion Administrativa',
        options: [
            {type: 'button', text: 'Roles y Permisos', path: '/admin/roles'},
            {type: 'button', text: 'Especialidades', path: '/admin/especialidades'},
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