import BENEDETTA_API from "../config/benedetta.api.config";
const ESPECIALIDAD_ROUTE = '/especialidades';

export interface Especialidad{
    id: string;
    name: string;
    description: string;
    image?: string;
}

// const especialidades: Especialidad[] = [
//   {id:'1', name: "Fisioterapia Dermatofuncional", description: "Tratamientos para la piel y tejidos subyacentes.", image: 'https://plus.unsplash.com/premium_photo-1673953509975-576678fa6710?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
//   {id:'2', name: "Fisioterapia y kinesiología", description: "Rehabilitación traumatológica y neurológica." },
//   {id:'3', name: "Medicina Estética", description: "Procedimientos médicos para mejorar la apariencia." },
//   {id:'4', name: "Rehabilitación de suelo pélvico femenino", description: "Tratamientos para salud pélvica femenina.", image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
//   {id:'5', name: "Gineco-Estética", description: "Salud y estética ginecológica." },
//   {id:'6', name: "Ginecología y Obstetricia", description: "Salud integral de la mujer.", image: 'https://plus.unsplash.com/premium_photo-1673953510107-d5aee40d80a7?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
//   {id:'7', name: "Nutrición y Dietética", description: "Planificación y orientación alimentaria." },
//   {id:'8', name: "Quiropraxia y Osteopatía", description: "Terapias manuales y manipulación corporal." },
// ];

export async function getEspecialidades(): Promise<Especialidad[]> {
    try{
        const res = await BENEDETTA_API.get(ESPECIALIDAD_ROUTE);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al obtener las especialidades."
        )
        throw new Error('error al obtener especialidades')
    }
}

export async function createEspecialidad(data: {nombre: string, descripcion:string}) {
    try{
        const res = await BENEDETTA_API.post(ESPECIALIDAD_ROUTE, data);
        return res.data;
    }catch(err: any){
        console.error(
            err?.response?.data.detail ||
            err?.message ||
            "Ocurrio un error al crear la especialidad."
        )
        throw new Error('error al obtener especialidades')
    }
}
    
