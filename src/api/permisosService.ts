import api from "../config/benedetta.api.config";

export interface Permission{
    id: string;
    name: string;
    description: string;
}

const PERMISSION_URL = 'permisos/';

export default async function getPermissions(){
    try{
        const res = await api.get(`${PERMISSION_URL}`);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al obtener los permisos."
        )
        throw new Error('error al obtener permisos')
    }
}