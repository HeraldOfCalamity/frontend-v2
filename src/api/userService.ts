import api from "../config/benedetta.api.config";

export interface User{
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
}

const USERS_ROUTE = 'users/'

export async function getUsuarios(): Promise<User[]>{
    try{
        const res = await api.get(USERS_ROUTE)
        return res.data
    }catch(err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al obtener los usuarios."
        )
        throw new Error('error al obtener usuarios')
    }
}

export async function createUsuario(data: Partial<User>){
    try{
        const res = await api.post(USERS_ROUTE, data);
        return res.data;
    }catch (err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al crear el usuario."
        )
        throw new Error('error al crear usuario')
    }
}

export async function updateUsuario(id: string, data: Partial<User>){
    try{
        const res = await api.put(`${USERS_ROUTE}${id}`, data);
        return res.data;
    }catch (err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al crear el usuario."
        )
        throw new Error('error al crear usuario')
    }
}

export async function deleteUsuario(id: string){
    try{
        const res = await api.delete(`${USERS_ROUTE}${id}`);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al eliminar el usuario."
        )
        throw new Error('error al eliminar usuario') 
    }
}