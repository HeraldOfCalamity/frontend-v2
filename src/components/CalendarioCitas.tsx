import { useEffect, useMemo, useState } from "react";
import type { Cita } from "../api/citaService";
import dayjs from "dayjs";
import { Box, Dialog, DialogContent, DialogTitle, useTheme } from "@mui/material";
import { Calendar, Views, type View } from "react-big-calendar";
import { localizer } from "../utils/calendarLocalazer";

interface CalendarioCitaProps {
    citas: Cita[]
}


export default function CalendarioCitas({
    citas,
}: CalendarioCitaProps) {
    // const eventos = useMemo<{title: string, start: Date, end: Date}>(() => 
    //     citas.map(cita => ({
    //         title: `${}`
    //         end: new Date(cita.fecha_fin), 
    //         start: new Date(cita.fecha_inicio)
    //     }))
    // , [citas])
    const [eventos, setEventos] = useState<Cita[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{start: Date, end: Date} | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Cita | null>(null);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState('week');
    const theme = useTheme()
    

    const min = useMemo(() => dayjs().hour(8).minute(0).second(0).toDate(), []);
    const max = useMemo(() => dayjs().hour(18).minute(0).second(0).toDate(), []);

    const eventPropGetter = (event: Cita) => {
        let bg = '#90caf9';
        let tc = theme.palette.text.primary;
        if (event.estado.nombre === 'confirmada') {
            bg = theme.palette.success.main;
            tc = theme.palette.success.contrastText;
        }
        if (event.estado.nombre === 'pendiente'){
            bg = theme.palette.warning.main;
            tc = theme.palette.warning.contrastText;
        }
        if (event.estado.nombre === 'cancelada') {
            bg = theme.palette.error.main;
            tc = theme.palette.error.contrastText;
        }

        return {style: {backgroundColor: bg, borderRadius: 8, border: 'none', color: tc}};
    }

    const dayPropGetter = (date: Date) => {
        const isToday = dayjs(date).date() === dayjs().date();
        if(isToday){
            return {style: {
                backgroundColor: theme.palette.background.default,
            }}
        }
        return {};
    };



    const onSelecting = ({start, end}: {start: Date; end: Date}) => {
        console.log('inicio:',start)
        console.log('end:',end)
        return true;
    }

    const handleSelectEvent = (ev: Cita) => {
        setSelectedEvent(ev);
        setOpenDialog(true);
    }
    
    const handleSelectSlot = ({start, end}: {start: Date; end: Date}) => {
        setSelectedSlot({start, end});
        setOpenDialog(true);
    }

    const getEventTitleFromCita = (cita: Cita) => {
        const title = `${cita.especialidad.nombre}: ${cita.especialista.nombre} ${cita.especialista.nombre}`;
        return title;
    }
    

    useEffect(() => {
        setEventos(citas)
    }, [citas])
    return(
        <>
            <Box 
                boxShadow={14}
                sx={{
                    height: '70vh', 
                    // bgcolor: "#fdcae3ff", 
                    // color: theme.palette.text.primary, 
                    p: 2, 
                    borderRadius: 1,
                    // border: `1px solid ${theme.palette.primary.main}`,
                    
                    fontSize: '1.2em'
                }}>
                <Calendar
                    localizer={localizer}
                    date={date}
                    onNavigate={setDate}
                    view={view as View}
                    onView={setView}
                    events={eventos}
                    startAccessor={cita => new Date(cita.fecha_inicio)}
                    endAccessor={cita => new Date(cita.fecha_fin)}
                    titleAccessor={getEventTitleFromCita}
                    defaultView={'week'}
                    views={['month', 'week', 'day', 'agenda']}
                    step={15}
                    timeslots={2}
                    selectable
                    // onSelecting={onSelecting}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    dayPropGetter={dayPropGetter}
                    eventPropGetter={eventPropGetter}
                    min={min}
                    max={max}
                    culture="es"
                    messages={{
                        next: 'Sig.',
                        previous: 'Ant.',
                        today: 'Hoy',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día',
                        agenda: 'Agenda',
                        date: 'Fecha',
                        time: 'Hora',
                        event: 'Evento',
                        noEventsInRange: 'No hay eventos en este rango.',
                        showMore: (total) => `+${total} más`,
                    }}
                    
                />
            </Box>
            <Dialog open={openDialog} onClose={() => {setOpenDialog(false); setSelectedSlot(null); setSelectedEvent(null)}} maxWidth={"sm"} fullWidth>
                <DialogTitle>{selectedEvent ? 'Detalle Cita' : 'Nueva Cita'}</DialogTitle>
                <DialogContent>
                    {selectedEvent ? (
                        <>
                            <p><b>Título:</b> {selectedEvent.especialidad.nombre}</p>
                            <p><b>Inicio:</b> {dayjs(selectedEvent.fecha_inicio).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Fin:</b> {dayjs(selectedEvent.fecha_fin).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Estado:</b> {selectedEvent.estado.nombre}</p>
                        </>
                    ) : selectedSlot ? (
                        <>
                            <p><b>Inicio:</b> {dayjs(selectedSlot?.start).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Fin:</b> {dayjs(selectedSlot?.end).format('DD/MM/YYYY HH:mm')}</p>
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    )
  
}