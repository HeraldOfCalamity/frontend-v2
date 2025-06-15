import axios from "axios";

export interface Especialidad{
  name: string;
  description: string;
  image?: string;
}

const especialidades: Especialidad[] = [
  { name: "Fisioterapia Dermatofuncional", description: "Tratamientos para la piel y tejidos subyacentes."},
  { name: "Fisioterapia y kinesiología", description: "Rehabilitación traumatológica y neurológica." },
  { name: "Medicina Estética", description: "Procedimientos médicos para mejorar la apariencia." },
  { name: "Rehabilitación de suelo pélvico femenino", description: "Tratamientos para salud pélvica femenina." },
  { name: "Gineco-Estética", description: "Salud y estética ginecológica." },
  { name: "Ginecología y Obstetricia", description: "Salud integral de la mujer." },
  { name: "Nutrición y Dietética", description: "Planificación y orientación alimentaria." },
  { name: "Quiropraxia y Osteopatía", description: "Terapias manuales y manipulación corporal." },
];

export const createEspecialidad = (name: string, description:string, image?:string): Especialidad => {
    return {
        name,
        description,
        image
    };
}

export const getEspecialidades = async (): Promise<Especialidad[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(especialidades.map(e => createEspecialidad(e.name, e.description, e.image)));
        }, 1000);
    });
}