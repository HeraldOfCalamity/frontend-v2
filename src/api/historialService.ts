// src/services/historialService.ts
import api from "../config/benedetta.api.config";
import { handleError } from "../utils/errorHandler";

/** ===== Tipos ===== */
export interface ImagePresignRes {
  url: string;
  key: string;
  expiresIn: number; // segundos
}

export interface RegisterImageReq {
  pacienteId: string;
  historialId?: string;
  entradaId?: string | null;
  key: string;
  width?: number;
  height?: number;
  size?: number;
  originalName?: string;
  originalType?: string; // ej: "image/webp" o "application/octet-stream"
  aesKeyB64?: string | null; // opcional si cifras
  ivB64?: string | null;     // opcional si cifras
  previewDataUrl?: string | null;
}

export interface CreateHistorialReq {
  paciente_id: string;
  cita_id?: string;
  antfamiliares?: string;
  antPersonales?: string;
  condActual?: string;
  intervencionClinica?: string;
}

export interface AddEntradaReq {
  recursosTerapeuticos: string;
  evolucionText: string;
  imageIds: string[]; // ids de ImageAsset
}

export interface HistorialClinico {
  _id: string;
  paciente_id: string;
//   cita_id?: string;
  antfamiliares: string;
  antPersonales: string;
  condActual: string;
  intervencionClinica: string;
  entradas: Entrada[];
  ner_sections: any;
  createdAt: string;
}

export type NerSpan = {
  text: string;
  label: string;
  start?: number;
  end?: number;
  norm?: string;
  source?: 'rules'|'ml';
  confidence?: number;
};

export const NER_COLORS: Record<string, "default"|"primary"|"secondary"|"success"|"warning"|"error"|"info"> = {
  SYMPTOM: "error",
  PAIN_QUALITY: "warning",
  PAIN_INTENSITY: "warning",
  BODY_PART: "info",
  MOVEMENT: "info",
  FUNCTIONAL_LIMITATION: "secondary",
  DIAGNOSIS: "error",
  TREATMENT: "success",
  EXERCISE: "success",
  FREQUENCY: "secondary",
  SCALE: "primary",
  MEASURE: "primary",
  DURATION: "primary",
  ROM: "primary",
  LATERALITY: "secondary",
  TEST: "info",
};

export function groupNer(raw?: unknown) {
  // 1) aplanar: soporta array de spans o array de { section, ents: NerSpan[] }
  const flat: NerSpan[] = [];
  if (Array.isArray(raw)) {
    for (const it of raw) {
      const maybe = it as any;
      if (maybe && Array.isArray(maybe.ents)) {
        for (const e of maybe.ents) if (e) flat.push(e as NerSpan);
      } else if (maybe) {
        flat.push(maybe as NerSpan);
      }
    }
  }

  // 2) agrupar de forma segura
  const out: Record<string, string[]> = {};
  for (const e of flat) {
    if (!e) continue;
    const label = String((e as any).label ?? "MISC");
    const rawText =
      typeof (e as any).norm === "string"
        ? (e as any).norm
        : typeof (e as any).text === "string"
        ? (e as any).text
        : "";
    const val = rawText.trim();
    if (!val) continue;

    const bucket = (out[label] ||= []);
    if (!bucket.includes(val)) bucket.push(val);
  }
  return out;
}

export interface Entrada {
  id: string;
  createdAt: string;
  recursosTerapeuticos: string;
  evolucionText: string;
  imagenes: string[]; // ids de ImageAsset
  ner: any
}

const HISTORIAL_ROUTE = "historiales/";

/** ===== Historial ===== */
export async function crearHistorial(data: CreateHistorialReq) {
  try {
    const res = await api.post(`${HISTORIAL_ROUTE}`, data);
    return res.data;
  } catch (err: any) {
    handleError(err, "Error al crear historial clínico");
  }
}

export async function getHistorial(id: string) {
  try {
    const res = await api.get(`${HISTORIAL_ROUTE}${id}`);
    return res.data as HistorialClinico;
  } catch (err: any) {
    handleError(err, "Error al obtener historial clínico");
  }
}

export async function getHistorialesPorPaciente(pacienteId: string) {
  try {
    const res = await api.get(`${HISTORIAL_ROUTE}${pacienteId}`);
    return res.data;
  } catch (err: any) {
    handleError(err, "Error al obtener historiales por paciente");
  }
}

/** ===== Entradas ===== */
export async function agregarEntrada(historialId: string, data: AddEntradaReq) {
  try {
    const res = await api.post(`${HISTORIAL_ROUTE}${historialId}/entradas`, data);
    return res.data
  } catch (err: any) {
    handleError(err, "Error al agregar entrada al historial");
  }
}

export async function adjuntarImagenesAEntrada(
  historialId: string,
  entradaId: string,
  imageIds: string[]
) {
  try {
    const res = await api.post(
      `${HISTORIAL_ROUTE}${historialId}/entradas/${entradaId}/attach-images`,
      { imageIds }
    );
    return res.data as { ok: boolean; count: number };
  } catch (err: any) {
    handleError(err, "Error al adjuntar imágenes a la entrada");
  }
}

/** ===== Subida de imágenes (R2) ===== */
export async function presignUploadImagen(params: {
  paciente_id: string;
  historial_id?: string;
  entrada_id?: string | null;
  filename: string;
  content_type: string; // "image/webp" o "application/octet-stream"
}) {
  try {
    const res = await api.post(`${HISTORIAL_ROUTE}upload/presign`, params);
    return res.data as ImagePresignRes;
  } catch (err: any) {
    handleError(err, "Error al solicitar URL firmada de subida");
  }
}

export async function registrarImagen(data: RegisterImageReq) {
  try {
    const res = await api.post(`${HISTORIAL_ROUTE}upload/register`, data);
    return res.data;
  } catch (err: any) {
    handleError(err, "Error al registrar imagen del historial");
  }
}

export async function getSignedImageUrl(key: string) {
  try {
    const res = await api.get(`${HISTORIAL_ROUTE}images/signed-get`, {
      params: { key },
    });
    return res.data as { url: string };
  } catch (err: any) {
    handleError(err, "Error al obtener URL firmada de imagen");
  }
}

export async function actualizarAnamnesis(histId: string, data: {
  condActual: string,
  intervencionClinica: string
}) {
  try {
    const res = await api.put(`${HISTORIAL_ROUTE}${histId}/anamnesis`, data);
    return res.data;
  } catch (err: any) {
    handleError(err, "Error al actualizar anamnesis");
  }
}
