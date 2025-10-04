import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";
// import type { Especialidad } from "./especialidadService";
// import type { Especialista } from "./especialistaService";
// import type { Paciente, PacienteWithUser } from "./pacienteService";

export interface Cita {
    id: string;
    paciente: string;
    pacienteName: string;
    duration_minutes: number;
    especialidad: string;
    especialista: string;
    fecha_inicio: string | Date;
    fecha_fin: string | Date;
    estado: {
        id: string;
        nombre: string;
        descripcion: string;
    }
    motivo: string;
    cancel_motivo: string;
}

export interface CreateCita{
    paciente_id: string;
    especialista_id: string;
    especialidad_id: string;
    fecha_inicio: string;
    motivo: string;
}

const CITA_ROUTE = 'citas/';

export async function reservarCita(data: CreateCita){
    try{
        const res  = await api.post(`${CITA_ROUTE}`, data)        ;
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al reservar cita')
    }
}

export async function getCitasByPaciente(id: string){
    try{
        const res = await api.get(`${CITA_ROUTE}paciente/${id}`)        ;
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al obtener citas por paciente')
    }
}

export async function getCitasByEspecialista(id: string){
    try{
        const res = await api.get(`${CITA_ROUTE}especialista/${id}`)        ;
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al obtener citas por especialista')
    }
}

export async function getMisCitas(){
    try{
        const res = await api.get(`${CITA_ROUTE}mis-citas`)        ;
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al obtener citas del perfil')
    }
}

export async function getCitas(){
    try{
        const res = await api.get(`${CITA_ROUTE}admin`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al obtener citas')
    }
}

export async function confirmCita(id: string){
    try{
        const res = await api.put(`${CITA_ROUTE}confirmar/${id}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al confirmar cita')
    }
}

export async function cancelCita(id: string, motivo: string){
    try{
        const res = await api.put(`${CITA_ROUTE}cancelar/${id}/${motivo}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al confirmar cita')
    }
}

export async function attendCita(id: string){
    try{
        const res = await api.put(`${CITA_ROUTE}attend/${id}`);
        return res.data;
    }catch(err: any){
        handleError(err, 'Error al marcar cita como atendida')
    }
}