import api from "../config/benedetta.api.config";

export interface Role{
    id: string;
    name: string;
    description: string;
    permissions: string[];
}

const ROLE_URL = 'roles/'


export async function getRoles(): Promise<Role[]>{
    try{
        const res = await api.get(`${ROLE_URL}`);
        return res.data;
    }catch (err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al obtener los roles."
        )
        throw new Error('error al obtener roles')
    }
}

export async function createRol(data: Partial<Role>){
    try{
        const res = await api.post(`${ROLE_URL}`, data);
        return res.data;
    }catch (err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al crear el rol."
        )
        throw new Error('Ocurrio un error al crear el rol.')
    }
}
export async function updateRol(id: string, data: Partial<Role>){
    try{
        const res = await api.put(`${ROLE_URL}${id}`, data);
        return res.data;
    }catch (err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al atualizar el rol."
        )
        throw new Error('Ocurrio un error al actualizar el rol.')
    }
}
export async function deleteRol(id: string){
    try{
        const res = await api.delete(`${ROLE_URL}${id}`);
        return res.data;
    }catch (err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al eliminar el rol."
        )
        throw new Error('Ocurrio un error al eliminar el rol.')
    }
}