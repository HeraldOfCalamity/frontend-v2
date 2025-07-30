import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Slide, Stack, Step, StepButton, Stepper, Typography } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import React, { useState } from "react";
import ReservarCitaPaso1 from "./ReservarCitaPaso1";
import type { Especialidad } from "../../api/especialidadService";
import type { Especialista } from "../../api/especialistaService";
import ReservarCitaPaso2 from "./ReservarCitaPaso2";
interface ReservaCitaProps {
    open: boolean;
    especialidad: Partial<Especialidad>
    setEspecialidad: (especialidad: Especialidad) => void;
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
    setEspecialidad
}: ReservaCitaProps){
    const [activeStep, setActiveStep] = React.useState(0);
    const [especialista, setEspecialista] = useState<Especialista>()
    const [completed, setCompleted] = React.useState<{
        [k: number]: boolean;
    }>({});
    const APPOINTMENT_STEPS = [
        {
            title:'Seleccion de Especialista', 
            component: <ReservarCitaPaso1
                especialidad={especialidad}
                especialista={especialista || {}}
                setEspecialista={setEspecialista}
            />
        },
        {
            title:'Seleccion de fecha y hora', 
            component: <ReservarCitaPaso2 />
        },
        {
            title:'Confirmacion de reserva',
            component: <Box>
                <Typography textAlign={'center'}>
                    ESTA SEGURO DE CONFIRMAR LA CITA?
                </Typography>
            </Box>
        }
    ]
    
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
        const newActiveStep =
        isLastStep() && !allStepsCompleted()
            ? // It's the last step, but not all steps have been completed,
            // find the first step that has been completed
            APPOINTMENT_STEPS.findIndex((step, i) => !(i in completed))
            : activeStep + 1;
        setActiveStep(newActiveStep);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleStep = (step: number) => () => {
        setActiveStep(step);
    };

    const handleComplete = () => {
        setCompleted({
        ...completed,
        [activeStep]: true,
        });
        handleNext();
    };

    const handleReset = () => {
        setActiveStep(0);
        setCompleted({});
    };
    return(
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="lg"
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
                    {APPOINTMENT_STEPS[activeStep].component}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
            </DialogActions>
        </Dialog>
    )
}