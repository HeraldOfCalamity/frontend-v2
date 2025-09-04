import { Box, Grid, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useSpeechRecognition } from "react-speech-recognition";
import { useSpeech, useSpeechCommands } from "../../../context/SpeechContext";

interface AnamnesisProps{
    // transcript: string;
}

export default function Anamnesis({
    // transcript
}: AnamnesisProps){
    const { 
        visibleTranscript,
        transcript,
        interimTranscript,
        resetAllTranscripts,
        enableDictation,
        disableDictation,
        stop
    } = useSpeech()

     const commands = useMemo(() => ([
        {
            command: 'limpiar dictado',
            callback: () => resetAllTranscripts()
        },
        {
            command: ['silenciar microfono', 'silenciar micrófono', 'detener dictado'],
            matchInterim: true,
            callback: () => disableDictation()
        },
        {
            command: ['activar microfono', 'activar micrófono', 'reanudar dictado'],
            matchInterim: true,
            callback: () => enableDictation()
        },
        {
            command: ['terminar dictado', 'detener dictado'],
            matchInterim: true,
            callback: () => stop()
        },
    ]), [disableDictation, enableDictation, resetAllTranscripts]);

    useSpeechCommands(commands, [commands])
    return(
    <Box>
        <Grid container spacing={2}>
            <Grid size={{xs: 12, md: 6 }}>
                <Typography variant="h6">
                    Antecedentes Personales
                </Typography>
                
                <Box height={'20vh'}>
                    { transcript}
                </Box>
                
            </Grid>
            <Grid size={{xs: 12, md: 6 }}>
                <Typography variant="h6">
                    Antecedentes Familiares
                </Typography>
                <Box height={'20vh'}>
                    { interimTranscript}
                </Box>
            </Grid>
            <Grid size={{xs: 12, md: 6 }}>
                <Typography variant="h6">
                    Condicion Actual
                </Typography>
                <Box height={'20vh'}>
                    {visibleTranscript}
                </Box>
            </Grid>
            <Grid size={{xs: 12, md: 6 }}>
                <Typography variant="h6">
                    Intervención Clínica
                </Typography>
                <Box height={'20vh'}>
                </Box>
            </Grid>
        </Grid>
    </Box>
)
}