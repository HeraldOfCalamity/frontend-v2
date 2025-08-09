import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Slide, Stack, Step, StepButton, Stepper, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import React, { useEffect, useState } from "react";
import ReservarCitaPaso1 from "./ReservarCitaPaso1";
import type { Especialidad } from "../../api/especialidadService";
import type { Especialista } from "../../api/especialistaService";
import ReservarCitaPaso2 from "./ReservarCitaPaso2";
import Swal from "sweetalert2";
import type { Paciente } from "../../api/pacienteService";
import { reservarCita, type CreateCita } from "../../api/citaService";
import ReservarCitaPaso3 from "./ReservarCitaPaso3";

interface ReservaCitaProps {
    open: boolean;
    especialidad: Partial<Especialidad>
    paciente: Partial<Paciente>
    onClose: () => void;
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement<any, any>;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function ReservaCita({
    onClose,
    open,
    especialidad,
    paciente
}: ReservaCitaProps){
    const [activeStep, setActiveStep] = React.useState(0);
    const [shouldGoNext, setShouldGoNext] = useState(false);

    const [especialista, setEspecialista] = useState<Especialista | null>(null)
    const [fechaCita, setFechaCita] = useState('');
    const [motivoCita, setMotivoCita] = useState('');
    const [createCita, setCreateCita] = useState<CreateCita>({
        paciente_id: paciente.id || '',
        especialidad_id: especialidad.id || '',
        especialista_id: '',
        fecha_inicio: '',
        motivo: '',
    });
    const [completed, setCompleted] = React.useState<{
        [k: number]: boolean;
    }>({});
    
    
    const handleEspecialistaClick = async (especialista: Especialista) => {
        const alert = await Swal.fire({
            title: 'Seleccionando Especialista',
            text: `Esta seleccionando al especialista ${especialista.nombre} ${especialista.apellido}, desea continuar?`,
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No',
            icon: 'info',
        })

        if(alert.isConfirmed){
            setEspecialista(especialista);
            handleComplete()
        }
    }

    const handlePaso2Complete = async (fecha: string, hora: string) => {
        const alert = await Swal.fire({
            title: 'Seleccionando Fecha y Hora',
            text: `Su cita sera reservada el dia ${fecha} a las ${hora}, desea continuar?`,
            showCancelButton: true,
            confirmButtonText: 'Si',
            cancelButtonText: 'No',
            icon: 'info',
        })

        if(alert.isConfirmed){
            setFechaCita(`${fecha}T${hora}`)
            handleComplete()
        }
    }

    const APPOINTMENT_STEPS = [
        {
            title:'Seleccion de Especialista', 
            component: <ReservarCitaPaso1
                especialidad={especialidad}
                handleEspecialistaClick={handleEspecialistaClick}
            />
        },
        {
            title:'Seleccion de fecha y hora', 
            component: <ReservarCitaPaso2 
                especialista={especialista || {}}
                onSelect={handlePaso2Complete}
            />
        },
        {
            title:'Confirmacion de reserva',
            component: <ReservarCitaPaso3
                cita={{
                    especialidad: especialidad.nombre || '',
                    especialista: especialista?.nombre || '',
                    paciente: paciente.nombre || '',
                    fecha: fechaCita
                }}
                motivo={motivoCita}
                setMotivo={setMotivoCita}
            />
        }
    ]

    const crearCita = async () => {
        try{
            const result = await Swal.fire({
                title: 'Reservando Cita',
                text: 'Esta seguro de reservar la cita?',
                icon: 'question',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Reservar',
                cancelButtonText: 'Cancelar',
            })

            if(!result.isConfirmed) return;

            const cita = await reservarCita(createCita);
            if(cita){
                // console.log('cita', cita)
                await Swal.fire({
                    title:'Exito!',
                    text:'Cita reservada con exito!',
                    icon:'success',
                });  
                handleReset();  
                onClose();            
            }

        }catch(err: any){
            await Swal.fire({
                title:'Error!',
                text: `${err}`,
                icon:'error',
            });
            setCompleted({})
            setShouldGoNext(false)
            setActiveStep(0)
        }finally{
            // handleReset()
            // onClose();
        }
    }
    
    const totalSteps = () => {
        return APPOINTMENT_STEPS.length;
    };

    const completedSteps = () => {
        return Object.keys(completed).length;
    };

    const isLastStep = () => {
        return activeStep === totalSteps() - 1;
    };

    const allStepsCompleted = () => {
        return completedSteps() === totalSteps();
    };

    const handleNext = () => {
        let newActiveStep: number;
        if(isLastStep() && !allStepsCompleted()){
            newActiveStep = APPOINTMENT_STEPS.findIndex((step, i) => !(i in completed));
        }else if (isLastStep() && allStepsCompleted()){
            crearCita();
            return;
        }else if (activeStep in completed){
            newActiveStep = activeStep + 1;
        }else {
            Swal.fire({
                title: `${APPOINTMENT_STEPS[activeStep].title}`,
                text: 'Es necesario completar el paso primero.',
                icon: 'warning',
            });
            newActiveStep = activeStep;
            console.log('active step', newActiveStep)
        }

        setActiveStep(newActiveStep);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleStep = (step: number) => () => {
        if(step in completed || step-1 in completed){
            setActiveStep(step);
        }
    };

    const handleComplete = () => {
        setCompleted({
        ...completed,
        [activeStep]: true,
        });
        setCreateCita(prev => ({
            especialidad_id: especialidad?.id || prev.especialidad_id,
            especialista_id: especialista?.id || prev.especialista_id,
            paciente_id: paciente?.id || prev.paciente_id,
            fecha_inicio: fechaCita || prev.fecha_inicio,
            motivo: motivoCita || prev.motivo
        }))
        setShouldGoNext(true);
    };

    useEffect(() => {
        if (shouldGoNext && !isLastStep()) {
            handleNext();
            setShouldGoNext(false);
        }
    }, [completed, shouldGoNext]);

    // useEffect(() => {
    //     console.log('createCita', createCita);
    // }, [createCita])

    const handleReset = () => {
        setShouldGoNext(false);
        setCreateCita({
            paciente_id: paciente.id || '',
            especialidad_id: especialidad.id || '',
            especialista_id: '',
            fecha_inicio: '',
            motivo: '',
        })
        setEspecialista(null)
        setFechaCita('')
        setMotivoCita('')
        setActiveStep(0);
        setCompleted({});
    };

    return(
        <Dialog
            open={open}
            onClose={() => {
                handleReset();
                onClose();
            }}
            fullWidth
            maxWidth="md"
            slots={{
                transition: Transition
            }}
        >
            <DialogTitle variant="h5" color="primary" fontWeight={600}>
                Reserva de Cita
            </DialogTitle>
            <DialogContent>
                <Box>
                    <Stepper activeStep={activeStep} nonLinear>
                        {APPOINTMENT_STEPS.map((appStep, idx)=> (
                            <Step key={appStep.title} completed={completed[idx]}>
                                <StepButton color="secondary" onClick={handleStep(idx)}>
                                    {appStep.title}
                                </StepButton>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
                <Box mt={3}>
                    {activeStep < totalSteps() && APPOINTMENT_STEPS[activeStep].component}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button disabled={activeStep === 0} onClick={handleBack}>Atras</Button>
                <Button onClick={() => {
                    handleReset();
                    onClose();
                }}>Cancelar</Button>
                <Button onClick={allStepsCompleted() ? crearCita : isLastStep() ? handleComplete : handleNext}>
                    {allStepsCompleted() ? 'Reservar' : isLastStep() ? 'Confirmar' : 'Siguiente'}
                </Button>
            </DialogActions>
        </Dialog>
    )
}