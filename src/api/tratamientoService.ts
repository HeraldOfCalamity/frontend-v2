import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";

const TRATAMIENTOS_URL = 'tratamientos/'

export interface Tratamiento{
    id: string;
    nombre: string;
    descripcion: string;
    image?: string;
}

export async function getTratamientos(){
    try{
        const res = await api.get(`${TRATAMIENTOS_URL}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al obtener tratamientos.')
    }
}

export async function createTratamiento(data: Partial<Tratamiento>){
    try{
        const res = await api.post(`${TRATAMIENTOS_URL}`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al crear tratamiento.')
    }
}

export async function updateTratamiento(idTratanmiento: string, data: Partial<Tratamiento>){
    try{
        const res = await api.put(`${TRATAMIENTOS_URL}${idTratanmiento}`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al crear tratamiento.')
    }
}
export async function deleteTratamiento(tratamientoId: string){
    try{
        const res = await api.delete(`${TRATAMIENTOS_URL}${tratamientoId}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al crear tratamiento.')
    }
}