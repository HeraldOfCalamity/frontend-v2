import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";
import type { User } from "./userService";

export interface Paciente{
    id: string;
    tipo_sangre: string;
    fecha_nacimiento: string;
}

export interface PacienteWithUser{
    user: Partial<User>,
    paciente: Partial<Paciente>,
}

export interface PacienteAutoCreate {
    user_id: string 
    fecha_nacimiento: string
    tipo_sangre: string
}

export interface FilterPaciente {
    ci: string;
    nombre: string;
    apellido: string;
}

const PACIENTES_ROUTE = 'pacientes/'

export async function createPacientePerfil(data: Partial<PacienteWithUser>){
    try{
        const res = await api.post(`${PACIENTES_ROUTE}perfil/`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al crear perfil de paciente')
    }
}

export async function createPaciente(data: Partial<PacienteAutoCreate>){
    try{
        const res = await api.post(`${PACIENTES_ROUTE}`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al crear paciente');
    }
}

export async function getPacienteByUserId(user_id: string){
    try{
        const res = await api.get(`${PACIENTES_ROUTE}${user_id}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al obtener paciente')
    }
}

export async function deletePaciente(user_id: string){
        try{
        const res = await api.delete(`${PACIENTES_ROUTE}${user_id}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al eliminar paciente')
    }
}

export async function updatePacientePerfil(pacienteId: string, data: Partial<PacienteWithUser>){
    try{
        const res = await api.put(`${PACIENTES_ROUTE}perfil/${pacienteId}`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al actualizar perfil')
    }
}

export async function getPacienteProfile(){
    try{
        const res = await api.get(`${PACIENTES_ROUTE}perfil`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al obtener perfil')
    }
}
export async function getPacienteProfileById(pacienteId: string){
    try{
        const res = await api.get(`${PACIENTES_ROUTE}perfil/${pacienteId}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al obtener perfil de paciente.')
    }
}
export async function updatePaciente(paciente_id: string, data: Partial<Paciente>){
    try{
        const res = await api.put(`${PACIENTES_ROUTE}${paciente_id}`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al actualizar paciente');
    }
}

export async function filterPacientes(filter: FilterPaciente){
    try{
        const res = await api.post(`${PACIENTES_ROUTE}filter`, filter);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al filtrar pacientes');
    }
}

export async function getPacientesWithUser(){
    try{
        const res = await api.get(`${PACIENTES_ROUTE}with-user`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al obtener pacientes con usuario')
    }
}