import api from "../config/benedetta.api.config";
import type { User } from "./userService";

export interface Paciente{
    id: string;
    nombre: string;
    apellido: string;
    tipo_sangre: string;
    fecha_nacimiento: string;
    telefono: string;
}

export interface PacienteWithUser{
    user: Partial<User>,
    paciente: Partial<Paciente>,
}

export interface PacienteAutoCreate {
    user_id: string 
    nombre: string
    apellido: string
    fecha_nacimiento: string
    tipo_sangre: string
    telefono: string
}

const PACIENTES_ROUTE = 'pacientes/'

export async function createPacienteAdmin(data: Partial<PacienteWithUser>){
    try{
        const res = await api.post(`${PACIENTES_ROUTE}admin/`, data);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.detail ||
            err?.message ||
            "Ocurrio un error al crear paciente."
        )
        throw new Error('Ocurrio un error al crear paciente.')
    }
}

export async function createPaciente(data: Partial<PacienteAutoCreate>){
    try{
        const res = await api.post(`${PACIENTES_ROUTE}`, data);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.data?.detail ||
            err?.message ||
            "Ocurrio un error al crear paciente."
        )
        throw new Error(
            err?.response?.data?.detail ||
            err?.message ||
            "Ocurrio un error al crear paciente."
        )
    }
}

export async function getPacienteByUserId(user_id: string){
    try{
        const res = await api.get(`${PACIENTES_ROUTE}${user_id}`);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.data?.detail ||
            err?.message ||
            "Ocurrio un error al obtener paciente."
        )
        throw new Error(
            err?.response?.data?.detail ||
            err?.message ||
            "Ocurrio un error al obtener paciente."
        )
    }
}

export async function deletePaciente(user_id: string){
        try{
        const res = await api.delete(`${PACIENTES_ROUTE}${user_id}`);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.detail ||
            err?.message ||
            "Ocurrio un error al eliminar paciente."
        )
        throw new Error("Ocurrio un error al eliminar paciente.")
    }
}

export async function updatePacienteAdmin(user_id: string, data: Partial<PacienteWithUser>){
        try{
        const res = await api.put(`${PACIENTES_ROUTE}admin/${user_id}`, data);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.detail ||
            err?.message ||
            "Ocurrio un error al actualizar paciente."
        )
        throw new Error("Ocurrio un error al actualizar paciente.")
    }
}

export async function getPacienteProfile(){
    try{
        const res = await api.get(`${PACIENTES_ROUTE}perfil`);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.data?.detail ||
            err?.message ||
            "Ocurrio un error al obtener perfil paciente."
        )
        throw new Error(err?.response?.data?.detail ||
            err?.message ||
            "Ocurrio un error al obtener perfil paciente.")
    }
}