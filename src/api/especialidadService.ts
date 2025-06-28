export interface Especialidad{
  name: string;
  description: string;
  image?: string;
}

const especialidades: Especialidad[] = [
  { name: "Fisioterapia Dermatofuncional", description: "Tratamientos para la piel y tejidos subyacentes.", image: 'https://plus.unsplash.com/premium_photo-1673953509975-576678fa6710?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
  { name: "Fisioterapia y kinesiología", description: "Rehabilitación traumatológica y neurológica." },
  { name: "Medicina Estética", description: "Procedimientos médicos para mejorar la apariencia." },
  { name: "Rehabilitación de suelo pélvico femenino", description: "Tratamientos para salud pélvica femenina.", image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { name: "Gineco-Estética", description: "Salud y estética ginecológica." },
  { name: "Ginecología y Obstetricia", description: "Salud integral de la mujer.", image: 'https://plus.unsplash.com/premium_photo-1673953510107-d5aee40d80a7?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
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