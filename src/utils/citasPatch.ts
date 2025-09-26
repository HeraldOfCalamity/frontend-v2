// src/utils/citasPatch.ts
import dayjs from "dayjs";
import type { Cita } from "../api/citaService";

export type CitaEvent =
  | { entity: "cita"; action: "created";   data: Cita }
  | { entity: "cita"; action: "confirmed"; data: Cita }
  | { entity: "cita"; action: "canceled";  data: Cita }
  | { entity: "cita"; action: "finished";  data: Cita }
  | { entity: "cita"; action: "updated";   data: Cita }; // por si lo usas

export function applyCitaEvent(prev: Cita[], evt: CitaEvent): Cita[] {
  if (evt.entity !== "cita" || !evt.data) return prev;
  const incoming = evt.data;
  const incomingId = String(incoming.id);

  // si ya existe → reemplazar; si no existe y es "created" → insertar
  const idx = prev.findIndex(c => String(c.id) === incomingId);
  let next: Cita[];

  if (idx >= 0) {
    next = [...prev];
    next[idx] = { ...prev[idx], ...incoming }; // merge por si faltan campos
  } else {
    if (evt.action === "created") {
      next = [...prev, incoming];
    } else {
      // si no existe y no es "created", lo ignoramos silenciosamente
      return prev;
    }
  }

  // ordena (ajusta a tu preferencia)
  next.sort((a, b) => dayjs(a.fecha_inicio).valueOf() - dayjs(b.fecha_inicio).valueOf());
  return next;
}
