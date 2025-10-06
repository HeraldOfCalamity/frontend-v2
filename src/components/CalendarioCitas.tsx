import { useEffect, useMemo, useRef, useState } from "react";
import { cancelCita, confirmCita, getCitas, getCitasByEspecialista, getCitasByPaciente, type Cita } from "../api/citaService";
import dayjs from "dayjs";
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Paper, Stack, Switch, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
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

function LegendItem({color, label, strike = false, note,}: {color: string; label: string; strike?: boolean; note?: string}){
    return(
        <Stack direction={'row'} alignItems={'center'} spacing={1} sx={{pr: 1}}>
            <Box sx={{width:14, height: 14, borderRadius: 1, bgcolor: color, border: '1px solid rgba(0,0,0,0.18)'}}/>
            <Typography variant="body2" sx={{fontWeight:600, textDecoration: strike ? 'line-through' : 'none', opacity: strike ? 0.9 : 1}}>
                {label}
                {note && (
                    <Typography
                        component={'span'}
                        variant="caption"
                        sx={{ml: 0.5, opacity: 0.7, fontWeight: 400}}
                    >
                        • {note}
                    </Typography>
                )}
            </Typography>
        </Stack>
    )
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
    const [openCancelMotivo, setOpenCancelMotivo] = useState(false)
    const [cancelMotivo, setCancelMotivo] = useState('')
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const calendarViews = isMobile ? (['day','agenda'] as View[]) : (['month', 'week', 'day', 'agenda'] as View[]);
    const formats = useMemo(() => ({
        timeGutterFormat: 'HH:mm',
        eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }, culture: any, loc: any) =>
            `${loc.format(start, 'HH:mm', culture)} - ${loc.format(end, 'HH:mm', culture)}`,
    }), [])

    

    const min = useMemo(() => dayjs().hour(8).minute(0).second(0).toDate(), []);
    const max = useMemo(() => dayjs().hour(18).minute(0).second(0).toDate(), []);

    const eventPropGetter = (event: Cita) => {
        let bg = '#90caf9';
        let tc = theme.palette.text.primary;
        let extra: React.CSSProperties = {boxShadow: '0 7px 7px rgba(0,0,0,0.15)', padding: '2px 6px'};

        if (event.estado.nombre === 'confirmada') {
            bg = theme.palette.success.main;
            tc = theme.palette.success.contrastText;
        }
        if (event.estado.nombre === 'pendiente'){
            bg = theme.palette.warning.main;
            tc = theme.palette.warning.contrastText;
        }
        if (event.estado.nombre === 'atendida') {
            bg = theme.palette.info.main;
            tc = theme.palette.info.contrastText;
        }
        if (event.estado.nombre === 'cancelada') {
            bg = theme.palette.error.main;
            tc = theme.palette.error.contrastText;
            extra = {
                opacity: 0.45,
                textDecoration: 'line-through',
                filter: 'greyscale(0.2)'
            }
        }

        return {
            style: {
                backgroundColor: bg, 
                borderRadius: 8, 
                border:'1px solid #777',
                color: tc, 
                fontSize: '0.9rem',
                ...extra
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



    const handleCancelCitaClick = async () => {
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
                await Swal.fire(
                    'Atención',
                    'Es necesario proporcionar un motivo de cancelación.',
                    'warning'
                )
                setOpenCancelMotivo(true)
            }

        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }
    const cancelarCita = async () => {
        if(cancelMotivo.trim() === '' || !selectedEvent){
            await Swal.fire(
                'Atención',
                'Debe ingresar un motivo válido, el campo es requerido.',
                'warning'
            )
            return;
        }

    const canceled = await cancelCita(selectedEvent.id as string, cancelMotivo);
        if(onCancelCita){
            await onCancelCita(selectedEvent);
        }

        await Swal.fire(
            'Operacion Exitosa',
            'Cita cancelada con exito, en un momento recibira un correo de confirmación.',
            'success'
        )

        setOpenCancelMotivo(false)
        setOpenDialog(false)
        setCancelMotivo('')
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

    const [hideCanceled, setHideCanceled] = useState(false)

    return(
        <>
            <Paper 
                variant="outlined"
                sx={{

                    bgcolor: theme => theme.palette.background.default, 
                    p: 2, 
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    overflowY: 'auto',
                    fontSize: '1.2em'
                }}>
                <Box
                    sx={{
                        mb: 2,
                        p: 1.5,
                        borderRadius: 2,
                        border: (t) => `1px solid ${t.palette.divider}`,
                        bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.25)',
                        backdropFilter: 'blur(3px)',
                    }}
                >
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        justifyContent="space-between"
                        spacing={1.5}
                    >
                        {/* Título */}
                        <Stack spacing={0}>
                        <Typography variant="h5" sx={{ lineHeight: 1.2 }}>Citas del consultorio</Typography>
                        <Typography variant="caption" sx={{ opacity: .75 }}>Vista del calendario y agenda</Typography>
                        </Stack>

                        {/* Toggle Ocultar canceladas */}
                        <FormControlLabel
                        control={
                            <Switch
                                checked={hideCanceled}
                                onChange={() => setHideCanceled(v => !v)}
                                size="small"
                            />
                        }
                        label={hideCanceled ? 'Mostrar canceladas' : 'Ocultar canceladas'}
                        sx={{
                            m: 0,
                            '& .MuiFormControlLabel-label': { fontSize: 13, opacity: .9 }
                        }}
                        />
                    </Stack>

                    {/* Leyenda */}
                    <Stack
                        direction="row"
                        flexWrap="wrap"
                        rowGap={1}
                        columnGap={2}
                        mt={1.25}
                    >
                        <LegendItem color={theme.palette.success.main} label="Confirmada" />
                        <LegendItem color={theme.palette.warning.main} label="Pendiente" />
                        <LegendItem color={theme.palette.info.main} label="Atendida" />
                        <LegendItem
                        color={theme.palette.error.main}
                        label="Cancelada"
                        strike
                        note="no bloquea cupos"
                        />
                    </Stack>
                    </Box>

                <Box
                    sx={{
                        height: isMobile ? '75vh' : '70vh',
                        bgcolor: theme.palette.background.default, 
                        p: isMobile ? 1 : 2,
                        borderRadius: 2,
                        '& .rbc-toolbar': { gap: 1, flexWrap: 'wrap' },
                        '& .rbc-toolbar .rbc-btn-group button': { px: 1 },
                        '& .rbc-toolbar-label': { fontWeight: 600 },
                        '& .rbc-event': { borderRadius: 1.5 },
                        '& .rbc-time-view': { borderRadius: 2 },
                        '& .rbc-timeslot-group': { minHeight: 40 },
                        '& .rbc-day-slot .rbc-time-slot': { borderTopStyle: 'dashed' },
                        '& .rbc-today': { backgroundColor: 'rgba(0, 172, 193, 0.08)' }, 
                    }}  
                >
                    <Calendar
                        localizer={localizer}
                        date={date}
                        onNavigate={setDate}
                        view={view as View}
                        onView={setView}
                        events={hideCanceled ? citas.filter(c => c.estado.nombre !== 'cancelada') : citas}
                        startAccessor={cita => new Date(cita.fecha_inicio)}
                        endAccessor={cita => new Date(cita.fecha_fin)}
                        titleAccessor={getEventTitleFromCita}
                        defaultView={isMobile ? 'agenda' : defaultView}
                        views={calendarViews}
                        step={15}
                        timeslots={2}
                        selectable
                        popup
                        tooltipAccessor={(ev) => `${ev.especialidad} • ${ev.pacienteName ?? ''} • ${dayjs(ev.fecha_inicio).format('DD/MM HH:mm')}`}
                        formats={formats}
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
                            {selectedEvent.estado.nombre === 'cancelada' && selectedEvent.cancel_motivo && (
                                <p><b>Motivo de cancelación:</b> {selectedEvent.cancel_motivo}</p>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    {(selectedEvent?.estado.nombre === 'confirmada' || selectedEvent?.estado.nombre === 'pendiente') && user?.role==='admin' && (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={async () => await handleCancelCitaClick()}
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
            <Dialog
                open={openCancelMotivo}
                onClose={() => {setOpenCancelMotivo(false); setCancelMotivo('')}}
            >
                <DialogTitle>
                    Agregar motivo de cancelación
                </DialogTitle>
                <DialogContent>
                    <TextField
                        value={cancelMotivo}
                        onChange={e => setCancelMotivo(e.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                        label={'Ingrese el motivo de cancelación'}
                        sx={{mt:1}}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        color="warning"
                        variant="contained"
                        onClick={() => cancelarCita() }
                    >
                        Confirmar Cancelación
                    </Button>
                    <Button
                        color="error"
                        variant="contained"
                        onClick={() => {setOpenCancelMotivo(false); setCancelMotivo('')}}
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