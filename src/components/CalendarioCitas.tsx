import { useEffect, useMemo, useRef, useState } from "react";
import { cancelCita, confirmCita, getCitas, getCitasByEspecialista, getCitasByPaciente, type Cita } from "../api/citaService";
import dayjs from "dayjs";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography, useTheme } from "@mui/material";
import { Calendar, Views, type View } from "react-big-calendar";
import { localizer } from "../utils/calendarLocalazer";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isBetween from "dayjs/plugin/isBetween";
import { useConfig } from "../context/ParameterContext";

dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

interface CalendarioCitaProps {
    defaultView?: View;
    citas: Cita[],
    onCancelCita?: (cita?: Cita) => Promise<void> | void;
    onConfirmCita?: (cita?: Cita) => Promise<void>| void;
    onAtenderCita?: (cita?: Cita) => Promise<void>| void;
}


export default function CalendarioCitas({
    defaultView = 'month',
    citas,
    onCancelCita,
    onConfirmCita,
    onAtenderCita,
}: CalendarioCitaProps) {
    const {user} = useAuth();
    // const [eventos, setEventos] = useState<Cita[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{start: Date, end: Date} | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Cita | null>(null);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(defaultView);
    const [loadingAttention, setLoadingAttention] = useState(false);
    const hasRun = useRef(false);
    const theme = useTheme()
    const {getParam} = useConfig()
    const [canAttend, setCanAttend] = useState(false);

    

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
                fontSize: '0.9rem'
                // marginBottom: 0, 
                // display: 'block'
            }
        };
    }

    const dayPropGetter = (date: Date) => {
        const isToday = dayjs(date).isSame(dayjs(), 'day');
        if(isToday){
            return {style: {
                // backgroundColor: theme.palette.background.default,
                backgroundColor: '#e0f7fa',
                border: `2px solid #00acc1`,
                // border: `2px solid ${theme.palette.secondary.main}`,
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
        const title = `${dayjs(cita.fecha_inicio).format('HH:mm')} - ${cita.estado.nombre}`; 
        return title;
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
                if(onCancelCita){
                    await onCancelCita(cita);
                }
                // await getEvents();
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
                if(onConfirmCita){
                    await onConfirmCita(cita)
                }
                // await getEvents();
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

    const handleAtenderCitaClick = async (cita: Cita) => {
        try{
            if(onAtenderCita){
                onAtenderCita(cita);
            }
            console.log('atendiendo cita', cita)
            
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }finally{

        }
    }

    const isBetweenInicioFin = async (inicio: string| Date, fin: string|Date) => {
        setLoadingAttention(true)
        const param = await getParam('restringir_atencion_horario')
        const strictAttentionOn = param === '1'
        const canAttend = strictAttentionOn ? dayjs().isBetween(dayjs(inicio), dayjs(fin)) : true;
        setCanAttend(canAttend);
        setLoadingAttention(false);
    }

    

    useEffect(() => {
        if (selectedEvent?.estado.nombre === 'confirmada' && user?.role === 'especialista') {
            isBetweenInicioFin(selectedEvent.fecha_inicio, selectedEvent.fecha_fin);
        }
        else{
            setCanAttend(false)
        }
    }, [selectedEvent, user]);

    return(
        <>
            <Paper 
                variant="outlined"
                sx={{

                    bgcolor: theme => theme.palette.background.paper, 
                    p: 2, 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    overflowY: 'auto',
                    fontSize: '1.2em'
                }}>
                <Stack direction={'row'} mb={1}>
                    {/* {addCitaForPaciente && <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddCircleOutline />}
                        onClick={() => setOpenSearchEspecialidad(true)}
                    >
                        Reservar Cita
                    </Button>} */}
                    <Typography variant="h4">
                        Citas del consultorio
                    </Typography>
                </Stack>
                <Box
                    sx={{
                        height: '70vh', 
                        bgcolor: theme.palette.background.paper, 
                        p: 2
                    }}  
                >

                    <Calendar
                        localizer={localizer}
                        date={date}
                        onNavigate={setDate}
                        view={view as View}
                        onView={setView}
                        events={citas}
                        startAccessor={cita => new Date(cita.fecha_inicio)}
                        endAccessor={cita => new Date(cita.fecha_fin)}
                        titleAccessor={getEventTitleFromCita}
                        defaultView={defaultView}
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
                            noEventsInRange: 'No se tienen citas en el rango de tiempo seleccionado.',
                            showMore: (total) => `+${total} más`,
                        }}
                        
                    />
                </Box>
            </Paper>
            <Dialog open={openDialog && !!selectedEvent} onClose={() => {setOpenDialog(false); setSelectedSlot(null); setSelectedEvent(null)}} maxWidth={"sm"} fullWidth>
                <DialogTitle>Detalle</DialogTitle>
                <DialogContent>
                    {selectedEvent && (
                        <>
                            <p><b>Título:</b> {selectedEvent.especialidad}</p>
                            <p><b>Inicio:</b> {dayjs(selectedEvent.fecha_inicio).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Fin:</b> {dayjs(selectedEvent.fecha_fin).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Estado:</b> {selectedEvent.estado.nombre}</p>
                            <p><b>Paciente:</b> {selectedEvent.pacienteName}</p>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    {(selectedEvent?.estado.nombre === 'confirmada' || selectedEvent?.estado.nombre === 'pendiente') && user?.role==='admin' && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={async () => await handleCancelCitaClick(selectedEvent)}
                        >
                            Cancelar Cita
                        </Button>
                    )}
                    {selectedEvent?.estado.nombre === 'pendiente' && user?.role==='admin' && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={async () => await handleConfirmCitaClick(selectedEvent)}
                        >
                            Confirmar Cita
                        </Button>
                    )}
                    {selectedEvent && canAttend && (
                        loadingAttention ? <Button>
                                <CircularProgress />
                            </Button>
                        : (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={async () => await handleAtenderCitaClick(selectedEvent)}
                            >
                                Comenzar Atencion
                            </Button>
                        )
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
            {/* <BuscarEspecialidad
                open={openSearchEspecialidad}
                onClose={() => {
                    setSelectedEspecialidad(null);
                    setOpenSearchEspecialidad(false);
                }}
                onSelectEspecialidad={(especialidad) =>{
                    setSelectedEspecialidad(especialidad)
                    setOpenReservaCitaDialog(true);
                }}
            /> */}
            {/* <ReservaCita
                open={openReservaCitaDialog}
                especialidad={selectedEspecialidad || {}}
                paciente={addCitaForPaciente || {}}
                onClose={async () => {
                    await getEvents();
                    setOpenReservaCitaDialog(false);
                }}
            /> */}
        </>
    )
  
}