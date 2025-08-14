import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";

export interface User{
    id: string;
    name: string;
    lastname: string;
    ci: string;
    phone: string;
    email: string;
    password: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
}

const USERS_ROUTE = 'users/'

export async function getUsuarios(): Promise<User[] | undefined>{
    try{
        const res = await api.get(USERS_ROUTE)
        return res.data
    }catch(err: any){
        handleError(err, 'Error al obtener Usuarios')
    }
}

export async function createUsuario(data: Partial<User>){
    try{
        const res = await api.post(USERS_ROUTE, data);
        return res.data;
    }catch (err: any){
        handleError(err, 'Error al crear usuario')
    }
}

export async function updateUsuario(id: string, data: Partial<User>){
    try{
        const res = await api.put(`${USERS_ROUTE}${id}`, data);
        return res.data;
    }catch (err: any){
        handleError(err, 'Error al actualizar usuario')
    }
}

export async function deleteUsuario(id: string){
    try{
        const res = await api.delete(`${USERS_ROUTE}${id}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al eliminar usuario')
    }
}