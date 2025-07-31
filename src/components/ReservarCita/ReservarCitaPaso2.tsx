import { Box, Button, Stack, Typography } from "@mui/material";
import type { Disponibilidad, Especialista } from "../../api/especialistaService";
import { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import Swal from "sweetalert2";
import { getCitasByEspecialista, type Cita } from "../../api/citaService";
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
import { useParams } from "../../context/ParameterContext";

dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

interface ReservarCitaPaso2Props{
  especialista: Partial<Especialista>;
  onSelect: (fecha: string, hora: string) => void;
}

export default function ReservarCitaPaso2({
  especialista,
  onSelect
}: ReservarCitaPaso2Props) {
  const [fecha, setFecha] = useState<Dayjs | null>(null);
  const [hora, setHora] = useState<Dayjs | null>(null);
  const {getParam} = useParams();
  const [citas, setCitas] = useState<Cita[]>([]);

 

  useEffect(() => {
    const citasEspecialista = async () => {
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
      }
    }

    if(especialista.id) citasEspecialista();
  }, [especialista])

  const diasDisponibles = (especialista.disponibilidades || []).map(d => d.dia);

  let slotsDisponibles: string[] = [];
  if(fecha && especialista.disponibilidades){
    const duracionCita = getParam('duracion_cita_minutos');
    slotsDisponibles = getSlotsFromDisponibilidades(fecha, especialista.disponibilidades, duracionCita);

    const diaActual = fecha.format('YYYY-MM-DD');

    const citasEseDia = citas.filter(c => dayjs(c.fecha_inicio).format('YYYY-MM-DD') === diaActual);
    const intervalosOcupados = citasEseDia.map(c => ({
      inicio: dayjs(c.fecha_inicio),
      fin: dayjs(c.fecha_fin)
    }));

    slotsDisponibles = slotsDisponibles.filter(slotStr => {
      const slot = dayjs(`${diaActual}T${slotStr}`);
      return !intervalosOcupados.some(int => 
        slot.isSameOrAfter(int.inicio) && slot.isBefore(int.fin)
      );
    });
  }

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
          shouldDisableDate={data => {
            const diaModelo = data.day();
            return !diasDisponibles.includes(diaModelo);
          }}
        />
        {fecha && (
          <>
            <Typography variant="subtitle1">Horarios disponibles:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {slotsDisponibles.map((slot) => (
                <Button
                  key={slot}
                  variant={hora?.format("HH:mm") === slot ? "contained" : "outlined"}
                  onClick={() => setHora(dayjs(`${fecha.format("YYYY-MM-DD")}T${slot}`))}
                >
                  {slot}
                </Button>
              ))}
              {slotsDisponibles.length === 0 && (
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
  fecha: Dayjs,
  disponibilidades: Disponibilidad[],
  duracionMin: number
): string[]{
  const diaModelo = fecha.day();
  const intervalosEseDia = (disponibilidades || []).filter(d => d.dia === diaModelo);
  let slots: string[] = [];
  intervalosEseDia.forEach(intervalo => {
    let hora = fecha.hour(Number(intervalo.desde.split(':')[0])).minute(Number(intervalo.desde.split(':')[1])).second(0);
    let fin = fecha.hour(Number(intervalo.hasta.split(':')[0])).minute(Number(intervalo.hasta.split(':')[1]))
    while(hora.add(duracionMin, 'minute').isSameOrBefore(fin)){
      const slot = hora.format('HH:mm');

      if(hora.isAfter(fin)) break;
      slots.push(slot);
      hora = hora.add(duracionMin, 'minute');
    }
  });
  return slots;
}
