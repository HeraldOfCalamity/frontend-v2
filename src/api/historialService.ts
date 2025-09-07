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
  paciente_id: string;
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
  id: string;
  paciente_id: string;
//   cita_id?: string;
  antfamiliares: string;
  antPersonales: string;
  condActual: string;
  intervencionClinica: string;
  entradas: Entrada[];
  createdAt: string;
}

export interface Entrada {
  id: string;
  createdAt: string;
  recursosTerapeuticos: string;
  evolucionText: string;
  imagenes: string[]; // ids de ImageAsset
}

const HISTORIAL_ROUTE = "historiales/";

/** ===== Historial ===== */
export async function crearHistorial(data: CreateHistorialReq) {
  try {
    const res = await api.post(`${HISTORIAL_ROUTE}`, data);
    return res.data as { ok: boolean; id: string };
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
    return res.data as { ok: boolean; entradaId?: string };
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
  historialId?: string;
  entradaId?: string | null;
  filename: string;
  contentType: string; // "image/webp" o "application/octet-stream"
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
    return res.data as { ok: boolean; imageId: string; key: string };
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
