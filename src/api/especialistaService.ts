import dayjs from "dayjs";
import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";
import type { User } from "./userService";

export interface Especialista{
    id: string;
    image?: string;
    especialidad_ids: string[];
    disponibilidades: Disponibilidad[];
    informacion?: string;
    inactividades?: Inactividad[]
}

type CrearInactividadResp = {
  inactividad: any;
  citas_en_rango: number;
  citas_canceladas?: number;
  citas_caceladas?: number;    
}

export interface Inactividad{
    desde: string;
    hasta: string;
    motivo?: string;
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

export async function getEspecialistaProfileById(especialistaId: string){
    try{
        const res = await api.get(`${ESPECIALISTA_ROUTE}perfil/${especialistaId}`);
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

export async function getEspecialistasWithUser(){
    try{
        const res = await api.get(`${ESPECIALISTA_ROUTE}with-user`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Ocurrio un error al obtener especialistas con usuario')
    }
}

export async function crearInactividad(
  especialistaId: string,
  inactividad: Inactividad,
  cancelar = false
): Promise<CrearInactividadResp> {
  try {
    const body = {
      desde: new Date(inactividad.desde).toISOString(),
      hasta: new Date(inactividad.hasta).toISOString(),
      motivo: inactividad.motivo ?? ""
    };
    const { data } = await api.post(
      `${ESPECIALISTA_ROUTE}${especialistaId}/inactividades?cancelar=${cancelar}`,
      body
    );
    return data;
  } catch (err: any) {
    handleError(err, 'Error al crear inactividad');
    throw err;
  }
}

/** Re-verifica cuántas citas siguen dentro del rango antes de cancelar */
export async function reverificarInactividad(
  especialistaId: string,
  rango: Pick<Inactividad, 'desde' | 'hasta'>
): Promise<{ citas_en_rango: number }> {
  try {
    const qs = new URLSearchParams({
      desde: new Date(rango.desde).toISOString(),
      hasta: new Date(rango.hasta).toISOString(),
    });
    const { data } = await api.get(
      `${ESPECIALISTA_ROUTE}${especialistaId}/inactividades/reverificar?${qs.toString()}`
    );
    return data;
  } catch (err: any) {
    handleError(err, 'Error al re-verificar inactividad');
    throw err;
  }
}

export async function eliminarInactividad(
  especialistaId: string,
  inactividad: Inactividad
): Promise<{ removed: number }> {
  try {
    const params = new URLSearchParams({
        desde: dayjs(inactividad.desde).format("YYYY-MM-DDTHH:mm:ss"),
        hasta: dayjs(inactividad.hasta).format("YYYY-MM-DDTHH:mm:ss"),
    });
    const { data } = await api.delete(
      `${ESPECIALISTA_ROUTE}${especialistaId}/inactividades?${params.toString()}`
    );
    return data;
  } catch (err: any) {
    handleError(err, "Error al eliminar inactividad");
    throw err;
  }
}