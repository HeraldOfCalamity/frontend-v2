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
            {type: 'button', text: 'Especialistas', path:'/admin/especialistas'},
            {type: 'button', text: 'Pacientes', path:'/admin/pacientes'},
            {type: 'button', text: 'Usuarios', path:'/admin/usuarios'},
        ]
    },
    {
        type: 'menu',
        text: 'Gestion Administrativa',
        options: [
            {type: 'button', text: 'Roles y Permisos', path: '/admin/roles'},
            {type: 'button', text: 'Especialidades', path: '/admin/especialidades'},
        ]
    }
]

export const PATIENT_OPTIONS: NavBarConfig = [
    {type: 'button', text: 'Mi Perfil', path: '/perfil/paciente'},
    {type: 'button', text: 'Mis Citas', path: '/citas'},
    {type: 'button', text: 'Inicio', path: '/inicio/paciente'}
]

export const ESPECIALIST_OPTIONS: NavBarConfig = [
    {type: 'button', text: 'Mi Perfil', path: '/perfil/especialista'},
    {type: 'button', text: 'Pacientes Asignados', path: '/pacientes'},
    {type: 'button', text: 'Agenda', path: '/agenda'},
]