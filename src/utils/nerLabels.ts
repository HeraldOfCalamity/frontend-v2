// src/utils/nerLabels.ts
export const NER_LABEL_ES: Record<string, string> = {
  SYMPTOM: "Síntoma",
  PAIN_QUALITY: "Cualidad del dolor",
  PAIN_INTENSITY: "Intensidad del dolor",
  BODY_PART: "Zona del cuerpo",
  MOVEMENT: "Movimiento",
  FUNCTIONAL_LIMITATION: "Limitación funcional",
  DIAGNOSIS: "Diagnóstico",
  TREATMENT: "Tratamiento",
  EXERCISE: "Ejercicio",
  FREQUENCY: "Frecuencia",
  SCALE: "Escala (dolor/función)",
  MEASURE: "Medición",
  DURATION: "Duración",
  ROM: "Rango de movimiento",
  LATERALITY: "Lateralidad",
  TEST: "Prueba clínica",
};

export function labelEs(label: string): string {
  return NER_LABEL_ES[label] ?? label; // fallback seguro
}
