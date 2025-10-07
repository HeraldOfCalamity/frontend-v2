import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { Disponibilidad, Especialista, Inactividad } from "../../api/especialistaService";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import Swal from "sweetalert2";
import { getCitasByEspecialista, type Cita } from "../../api/citaService";
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
import { useConfig } from "../../context/ParameterContext";
import type { PacienteWithUser } from "../../api/pacienteService";

dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

interface ReservarCitaPaso2Props{
  especialista: Partial<Especialista>;
  paciente: Partial<PacienteWithUser>;
  onSelect: (fecha: string, hora: string) => void;
}
const parseInactAsLocal = (s: string) => dayjs(new Date(s.endsWith("Z") ? s : `${s}Z`));

type Intervalo = { inicio: dayjs.Dayjs; fin: dayjs.Dayjs };

const overlaps = (a: Intervalo, b: Intervalo) =>
  a.inicio.isBefore(b.fin) && a.fin.isAfter(b.inicio);

export default function ReservarCitaPaso2({
  especialista,
  paciente,
  onSelect
}: ReservarCitaPaso2Props) {
  const [fecha, setFecha] = useState<Dayjs | null>(null);
  const [hora, setHora] = useState<Dayjs | null>(null);
  const {getParam} = useConfig();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [_slotsDisponibles, _setSlotsDisponibles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false)
  const [duracionCita, setDuracionCita] = useState(45);

 

  useEffect(() => {
    const citasEspecialista = async () => {
      setLoading(true)
      try{
        const citasEspecialista = await getCitasByEspecialista(especialista.id || '');
        setCitas(citasEspecialista || []);
      }catch(err: any){
        Swal.fire({
          title:'Error',
          text:`${err}`,
          icon:'error',
          topLayer: true
        })
      }finally{
        setLoading(false)
      }
    }

    if(especialista.id) citasEspecialista();
  }, [especialista])

  
  const isInDisponibilidad = (date: Dayjs) => {
    const diaModelo = date.day();
    const diasDisponibles = (especialista.disponibilidades || []).map(d => d.dia);
    return diasDisponibles.includes(diaModelo);
  }

const isDateDisabled = (date: Dayjs): boolean => {
  // si el paciente ya tiene cita ese día (regla tuya), se deshabilita
  if (isInReservedCitas(date)) return true;

  // si no hay ninguna disponibilidad declarada para ese día → deshabilita
  const diaModelo = date.day();
  const hayDispon = (especialista.disponibilidades || []).some((d) => d.dia === diaModelo);
  if (!hayDispon) return true;

  // calcula bloqueadores y slots efectivos
  const blockers = buildBlockersForDay(date, citas, especialista.inactividades);
  const slots = getSlotsFromDisponibilidades(
    date,
    especialista.disponibilidades || [],
    duracionCita,
    blockers
  );

  return slots.length === 0;
};

  const isInReservedCitas = (date: Dayjs) => {
    const targetDate = date.date();
    
    return citas.some(c => 
      c.paciente === paciente.paciente?.id &&
      c.estado.nombre !== 'cancelada' && 
      c.estado.nombre !== 'atendida' &&
      dayjs(c.fecha_inicio).date() === targetDate
    );
  };
  useEffect(() => {
    const getCitaParam = async () => {
      try {
        const param = await getParam("duracion_cita_minutos");
        const intParam = parseInt(param);
        setDuracionCita((value) => (!isNaN(intParam) ? intParam : value));
      } catch (err: any) {
        Swal.fire("Error", `${err}`, "error");
      }
    };
    getCitaParam();
  }, []); // solo al montar
  function buildBlockersForDay(
    fecha: dayjs.Dayjs,
    citas: Cita[],
    inactividades: Inactividad[] | undefined
  ): Intervalo[] {
    const dayStart = fecha.startOf("day");
    const dayEnd = fecha.endOf("day");
    const blocks: Intervalo[] = [];

    // Citas del día (pendiente/confirmada)
    const citasEseDia = citas.filter(
      (c) =>
        (c.estado.nombre === "pendiente" || c.estado.nombre === "confirmada") &&
        dayjs(c.fecha_inicio).isSame(fecha, "day")
    );
    for (const c of citasEseDia) {
      blocks.push({
        inicio: dayjs(c.fecha_inicio),
        fin: dayjs(c.fecha_fin),
      });
    }

    // Inactividades que cruzan el día
    for (const ia of inactividades || []) {
      const iaIni = parseInactAsLocal(ia.desde);
      const iaFin = parseInactAsLocal(ia.hasta);
      // intersección con el día
      const inicio = iaIni.isAfter(dayStart) ? iaIni : dayStart;
      const fin = iaFin.isBefore(dayEnd) ? iaFin : dayEnd;
      if (inicio.isBefore(fin)) {
        blocks.push({ inicio, fin });
      }
    }

    return blocks;
  }

  useEffect(() => {
    if (!fecha || !especialista.disponibilidades) return;

    const blockers = buildBlockersForDay(fecha, citas, especialista.inactividades);
    const slots = getSlotsFromDisponibilidades(
      fecha,
      especialista.disponibilidades,
      duracionCita,
      blockers
    );

    _setSlotsDisponibles(slots);
  }, [fecha, citas, duracionCita, especialista.disponibilidades, especialista.inactividades]);

 return (
    <Box>
      <Typography variant="h5" mb={2}>
        Selecciona fecha y hora
      </Typography>
      <Stack spacing={2} direction="column" alignItems="center">
        <DatePicker
          label="Fecha de cita"
          value={fecha}
          onChange={setFecha}
          disablePast
          loading={loading}
          renderLoading={() => <CircularProgress />}
          shouldDisableDate={data => {
            return isDateDisabled(data)
          }}
        />
        {fecha && (
          <>
            <Typography variant="subtitle1">Horarios disponibles:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {_slotsDisponibles.map((slot) => (
                <Button
                  key={slot}
                  variant={hora?.format("HH:mm") === slot ? "contained" : "outlined"}
                  onClick={() => setHora(dayjs(`${fecha.format("YYYY-MM-DD")}T${slot}`))}
                >
                  {slot}
                </Button>
              ))}
              {_slotsDisponibles.length === 0 && (
                <Typography color="error">No hay horarios disponibles para este día</Typography>
              )}
            </Stack>
          </>
        )}
        <Button
          disabled={!fecha || !hora}
          onClick={() => {
            if (fecha && hora) {
              onSelect(fecha.format("YYYY-MM-DD"), hora.format("HH:mm"));
            }
          }}
          variant="contained"
          color="primary"
        >
          Confirmar fecha y hora
        </Button>
      </Stack>
    </Box>
  );
}

function getSlotsFromDisponibilidades(
  fecha: dayjs.Dayjs,
  disponibilidades: Disponibilidad[],
  duracionMin: number,
  blockers: Intervalo[]
): string[] {
  // d.day(): 0=Domingo,1=Lunes,...,6=Sábado (coincide con tus valores del front)
  const diaModelo = fecha.day();
  const intervalosEseDia = (disponibilidades || []).filter((d) => d.dia === diaModelo);

  const slots: string[] = [];
  const step = duracionMin;

  for (const intervalo of intervalosEseDia) {
    // rango de disponibilidad del día en local
    let cursor = fecha
      .hour(Number(intervalo.desde.split(":")[0]))
      .minute(Number(intervalo.desde.split(":")[1]))
      .second(0)
      .millisecond(0);

    const fin = fecha
      .hour(Number(intervalo.hasta.split(":")[0]))
      .minute(Number(intervalo.hasta.split(":")[1]))
      .second(0)
      .millisecond(0);

    while (cursor.add(step, "minute").isSameOrBefore(fin)) {
      const slotInicio = cursor;
      const slotFin = cursor.add(step, "minute");

      const cand: Intervalo = { inicio: slotInicio, fin: slotFin };
      const choca = blockers.some((b) => overlaps(cand, b));

      if (!choca) slots.push(slotInicio.format("HH:mm"));
      cursor = cursor.add(step, "minute");
    }
  }
  return slots;
}
