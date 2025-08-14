import { useEffect, useMemo, useRef, useState } from "react";
import { cancelCita, confirmCita, getCitas, getCitasByEspecialista, type Cita } from "../api/citaService";
import dayjs from "dayjs";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, useTheme } from "@mui/material";
import { Calendar, Views, type View } from "react-big-calendar";
import { localizer } from "../utils/calendarLocalazer";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../context/userProfileContext";
import type { Especialista } from "../api/especialistaService";
import { ReplayOutlined } from "@mui/icons-material";

interface CalendarioCitaProps {
    // citas: Cita[],
    // handleCancelClick: (cita: Cita) => void;
    // handleConfirmClick: (cita: Cita) => void;
}


export default function CalendarioCitas({
    // handleCancelClick,
    // handleConfirmClick
}: CalendarioCitaProps) {
    const {user} = useAuth();
    const {profile, loading:loadingProfile} = useUserProfile();
    const [eventos, setEventos] = useState<Cita[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{start: Date, end: Date} | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Cita | null>(null);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState('month');
    const [loading, setLoading] = useState(false);
    const hasRun = useRef(false);
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

        return {
            style: {
                backgroundColor: bg, 
                borderRadius: 8, 
                border:'1px solid #fff',
                color: tc, 
                // marginBottom: 0, 
                // display: 'block'
            }
        };
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
        const title = `${cita.especialidad?.nombre}: ${cita.especialista?.nombre} ${cita.especialista?.nombre}`;
        return title;
    }

    const getEvents = async () => {
        setLoading(true);
        let citas: Cita[] = [];
        try{
            if (user?.role === 'admin'){
                citas = await getCitas();
            }else if(user?.role === 'especialista'){
                if(profile){
                    const especialista = profile as Especialista;
                    console.log('especialista profile', profile)
                    citas = await getCitasByEspecialista(especialista.id);
                }
            }
            setEventos(citas);
        }catch (err : any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }finally{
            setLoading(false);
        }
    }

    const handleCancelCitaClick = async (cita: Cita) => {
        try{
            const isConfirmed = await Swal.fire({
                title: 'Cancelar Cita',
                text: 'Esta seguro de cancelar la cita?, esta accion no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Si, cancelar',
                cancelButtonText: 'No',
            })

            if(isConfirmed.isConfirmed){
                const canceled = await cancelCita(cita.id);
                await getEvents();
                Swal.fire(
                    'Operacion Exitosa',
                    'Cita cancelada con exito, en un momento recibira un correo de confirmación.',
                    'success'
                )
                console.log('cita, cancelada', canceled);
            }

        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }
    const handleConfirmCitaClick = async (cita: Cita) => {
        try{
            const isConfirmed = await Swal.fire({
                title: 'Confirmar Cita',
                text: 'Esta seguro de confirmar la cita?, esta accion no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Si, confirmar',
                cancelButtonText: 'No',
            })

            if(isConfirmed.isConfirmed){
                const confirmed = await confirmCita(cita.id);
                await getEvents();
                Swal.fire(
                    'Operacion Exitosa',
                    'Cita confirmada con exito, en un momento recibira un correo de verificacion.',
                    'success'
                )
                console.log('cita, confirmada', confirmed);
            }

        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }
    const handleCitasRefresh = async () => {
        await getEvents();
    }
    useEffect(() => {
        if(!hasRun.current){
            hasRun.current = true;
            getEvents();
        }
    }, [])
    
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
                <Stack direction={'row'} justifyContent={'end'} mb={1}>
                    <Button loading={loading} variant="contained" onClick={handleCitasRefresh} startIcon={<ReplayOutlined />}>
                        Refrescar
                    </Button>
                </Stack>
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
                    defaultView={'month'}
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
            <Dialog open={openDialog && !!selectedEvent} onClose={() => {setOpenDialog(false); setSelectedSlot(null); setSelectedEvent(null)}} maxWidth={"sm"} fullWidth>
                <DialogTitle>Detalle</DialogTitle>
                <DialogContent>
                    {selectedEvent && (
                        <>
                            <p><b>Título:</b> {selectedEvent.especialidad.nombre}</p>
                            <p><b>Inicio:</b> {dayjs(selectedEvent.fecha_inicio).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Fin:</b> {dayjs(selectedEvent.fecha_fin).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Estado:</b> {selectedEvent.estado.nombre}</p>
                            <p><b>Paciente:</b> {selectedEvent.paciente.nombre} {selectedEvent.paciente.apellido}</p>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    {(selectedEvent?.estado.nombre === 'confirmada' || selectedEvent?.estado.nombre === 'pendiente') && user?.role==='admin' && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleCancelCitaClick(selectedEvent)}
                        >
                            Cancelar Cita
                        </Button>
                    )}
                    {selectedEvent?.estado.nombre === 'pendiente' && user?.role==='admin' && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleConfirmCitaClick(selectedEvent)}
                        >
                            Confirmar Cita
                        </Button>
                    )}
                    {user?.role==='especialista' && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => console.log('atenderCita')}
                        >
                            Comenzar Atencion
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            setOpenDialog(false); 
                            setSelectedSlot(null); 
                            setSelectedEvent(null)
                        }}
                    >
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
  
}