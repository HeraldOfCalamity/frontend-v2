import api from "../config/benedetta.api.config";
import type { User } from "./userService";

export interface Especialista{
    id: string;
    especialidad_ids: string[];
    disponibilidades: Disponibilidad[];
    matricula_profesional: string;
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

export async function createEspecialistaAdmin(data: Partial<EspecialistaWithUser>){
    try{
        const res = await api.post(`${ESPECIALISTA_ROUTE}admin`, data);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.detail ||
            err?.message ||
            "Ocurrio un error al crear especialista."
        )
        throw new Error('Ocurrio un error al crear especialista.')
    }
}

export async function updateEspecialistaAdmin(especialista_id: string, data: Partial<EspecialistaWithUser>){
    try{
        const res = await api.put(`${ESPECIALISTA_ROUTE}admin/${especialista_id}`, data);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.detail ||
            err?.message ||
            "Ocurrio un error al actualizar especialista."
        )
        throw new Error('Ocurrio un error al actualizar especialista.')
    }
}

export async function getEspecialistaByUserId(user_id: string){
    try{
        const res = await api.get(`${ESPECIALISTA_ROUTE}${user_id}`);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.detail ||
            err?.message ||
            "Ocurrio un error al obtener especialista."
        )
        throw new Error('Ocurrio un error al obtener especialista.')
    }
}

export async function deleteEspecialista(especialista_id: string){
    try{
        const res = await api.delete(`${ESPECIALISTA_ROUTE}${especialista_id}`);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.detail ||
            err?.message ||
            "Ocurrio un error al eliminar especialista."
        )
        throw new Error('Ocurrio un error al eliminar especialista.')
    }
}