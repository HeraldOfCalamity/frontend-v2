import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import type { Disponibilidad, Especialista } from "../../api/especialistaService";
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

  const isDateDisabled = (date:  Dayjs): boolean => {
    const inDisponibilidad = isInDisponibilidad(date);
    const inReserved = isInReservedCitas(date);
    return !inDisponibilidad || inReserved;
  }

  const isInReservedCitas = (date: Dayjs) => {
    const targetDate = date.date();
    
    return citas.some(c => 
      c.pacienteProfile?.paciente.id === paciente.paciente?.id &&
      c.estado.nombre !== 'cancelada' && 
      c.estado.nombre !== 'atendida' &&
      dayjs(c.fecha_inicio).date() === targetDate
    );
  };
  const getCitaParam = async () => {
    try{
      const param = await getParam('duracion_cita_minutos');
      const intParam = parseInt(param)
      setDuracionCita(value => !isNaN(intParam) ? intParam : value);
    }catch(err: any){
      Swal.fire(
        'Error',
        `${err}`,
        'error'
      )
    }
  }

  useEffect(() => {
    if(fecha && especialista.disponibilidades){
      getCitaParam()
      const slots = getSlotsFromDisponibilidades(fecha, especialista.disponibilidades, duracionCita);
      // _setSlotsDisponibles(slots);
      

      const diaActual = fecha.format('YYYY-MM-DD');

      const citasEseDia = citas.filter(c => dayjs(c.fecha_inicio).format('YYYY-MM-DD') === diaActual);
      const intervalosOcupados = citasEseDia.map(c => ({
        inicio: dayjs(c.fecha_inicio),
        fin: dayjs(c.fecha_fin)
      }));
      const slotsFiltered = slots.filter(slotStr => {
        const slot = dayjs(`${diaActual}T${slotStr}`);
        return !intervalosOcupados.some(int => 
          slot.isSameOrAfter(int.inicio) && slot.isBefore(int.fin)
        );
      });
      
      _setSlotsDisponibles(slotsFiltered)
    }
  }, [fecha])

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
  fecha: Dayjs,
  disponibilidades: Disponibilidad[],
  duracionMin: number
): string[]{
  const diaModelo = fecha.day();
  const intervalosEseDia = (disponibilidades || []).filter(d => d.dia === diaModelo);
  let slots: string[] = [];
  intervalosEseDia.forEach(intervalo => {
    let hora = fecha.hour(Number(intervalo.desde.split(':')[0])).minute(Number(intervalo.desde.split(':')[1])).second(0);
    let fin = fecha.hour(Number(intervalo.hasta.split(':')[0])).minute(Number(intervalo.hasta.split(':')[1])).second(0);
    while(hora.add(duracionMin, 'minute').isSameOrBefore(fin)){
      const slot = hora.format('HH:mm');
      if(hora.isAfter(fin)) break;

      slots.push(slot);
      hora = hora.add(duracionMin, 'minute');
    }
  });
  return slots;
}
