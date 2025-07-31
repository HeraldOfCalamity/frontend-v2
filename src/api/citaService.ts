import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";
import type { Especialidad } from "./especialidadService";
import type { Especialista } from "./especialistaService";
import type { Paciente } from "./pacienteService";

export interface Cita {
    id: string;
    paciente: Paciente;
    especialista: Especialista;
    especialidad: Especialidad;
    fecha_inicio: string;
    fecha_fin: string;
    duration_minutes: number;
    estado: {
        id: string;
        nombre: string;
        descripcion: string;
    }
    motivo: string;
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