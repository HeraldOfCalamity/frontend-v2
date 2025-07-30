import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";

export interface OfficeConfiguration {
    id: string;
    name: string;
    value: string;
}

export type ConfigNames = 'duracion_cita_minutos' | 'confirmacion_automatica';

const CONFIG_ROUTE = 'config/'

export async function getOfficeConfig(): Promise<OfficeConfiguration[] | undefined>{
    try{
        const res = await api.get(`${CONFIG_ROUTE}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al obtener la configuracion del consultorio')
    }
}

export async function updateOfficeConfig(config_id: string, data: Partial<OfficeConfiguration>){
    try{
        const res = await api.put(`${CONFIG_ROUTE}${config_id}`, data);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al actualizar la configuracion del consultorio')
    }
}