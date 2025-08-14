import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";
import type { User } from "./userService";

export interface Especialista{
    id: string;
    ci: string;
    image?: string;
    especialidad_ids: string[];
    disponibilidades: Disponibilidad[];
    informacion?: string;
    telefono: string;
    nombre: string;
    apellido: string;
}

export interface Disponibilidad{
    dia: number;
    desde: string;
    hasta: string;
}

export interface EspecialistaWithUser {
    user: Partial<User>;
    especialista: Partial<Especialista>;
}

const ESPECIALISTA_ROUTE = 'especialistas/';

export async function createEspecialistaPerfil(data: Partial<EspecialistaWithUser>){
    try{
        const res = await api.post(`${ESPECIALISTA_ROUTE}perfil`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al crear perfil de especialista')
    }
}

export async function updateEspecialistaPerfil(especialista_id: string, data: Partial<EspecialistaWithUser>){
    try{
        const res = await api.put(`${ESPECIALISTA_ROUTE}perfil/${especialista_id}`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al actualizar especialista.')
    }
}

export async function getEspecialistaByUserId(user_id: string){
    try{
        const res = await api.get(`${ESPECIALISTA_ROUTE}${user_id}`);
        return res.data;
    }catch(err: any){
        console.log('error service', err)
        handleError(err, 'Error al obtener especialista')
    }
}

export async function deleteEspecialista(especialista_id: string){
    try{
        const res = await api.delete(`${ESPECIALISTA_ROUTE}${especialista_id}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al eliminar especialista.');
    }
}

export async function updateEspecialista(especialista_id: string, data: Partial<Especialista>){
    try{
        const res = await api.put(`${ESPECIALISTA_ROUTE}${especialista_id}`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al eliminar especialista.');
    }
}

export async function getEspecialistaProfile(){
    try{
        const res = await api.get(`${ESPECIALISTA_ROUTE}perfil`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al obtener perfil de especialista.')
    }
}

export async function getEspecialistasByEspecialidadId(especialidad_id: string){
    try{
        const res = await api.get(`${ESPECIALISTA_ROUTE}by/especialidad/${especialidad_id}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al obtener especialistas por especialidad.')
    }
}