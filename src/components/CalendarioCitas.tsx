import { useEffect, useMemo, useRef, useState } from "react";
import { cancelCita, confirmCita, getCitas, getCitasByEspecialista, getCitasByPaciente, type Cita } from "../api/citaService";
import dayjs from "dayjs";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, useTheme } from "@mui/material";
import { Calendar, Views, type View } from "react-big-calendar";
import { localizer } from "../utils/calendarLocalazer";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../context/userProfileContext";
import type { Especialista } from "../api/especialistaService";
import { AddCircleOutline, ReplayOutlined } from "@mui/icons-material";
import type { Paciente, PacienteWithUser } from "../api/pacienteService";
import BuscarEspecialidad from "./admin/BuscarEspecialidad";
import type { Especialidad } from "../api/especialidadService";
import ReservaCita from "./ReservarCita/ReservaCita";

interface CalendarioCitaProps {
    defaultView?: View;
    citas: Cita[],
    onCancelCita: (cita: Cita) => Promise<void>;
    onConfirmCita: (cita: Cita) => Promise<void>;
}


export default function CalendarioCitas({
    defaultView = 'month',
    citas,
    onCancelCita,
    onConfirmCita
}: CalendarioCitaProps) {
    const {user} = useAuth();
    // const {profile, loading:loadingProfile} = useUserProfile();
    // const [eventos, setEventos] = useState<Cita[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{start: Date, end: Date} | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Cita | null>(null);
    const [date, setDate] = useState(new Date());
    const [view, setView] = useState(defaultView);
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
//region cambiar
    const getEventTitleFromCita = (cita: Cita) => {
        const title = `${cita.especialidad?.nombre}: ${cita.especialista?.id} ${cita.especialista?.id}`; 
        return title;
    }
//endregion


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
                await onCancelCita(cita);
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
                await onConfirmCita(cita)
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

    // useEffect(() => {
    //     if(!hasRun.current){
    //         hasRun.current = true;
    //         getEvents();
    //     }
        
    // }, [])
    
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
                </Stack>
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
                    views={['agenda', 'month', 'week', 'day']}
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
            <Dialog open={openDialog && !!selectedEvent} onClose={() => {setOpenDialog(false); setSelectedSlot(null); setSelectedEvent(null)}} maxWidth={"sm"} fullWidth>
                <DialogTitle>Detalle</DialogTitle>
                <DialogContent>
                    {selectedEvent && (
                        <>
                            <p><b>Título:</b> {selectedEvent.especialidad.nombre}</p>
                            <p><b>Inicio:</b> {dayjs(selectedEvent.fecha_inicio).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Fin:</b> {dayjs(selectedEvent.fecha_fin).format('DD/MM/YYYY HH:mm')}</p>
                            <p><b>Estado:</b> {selectedEvent.estado.nombre}</p>
                            <p><b>Paciente:</b> {selectedEvent.paciente.id} {selectedEvent.paciente.id}</p>
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