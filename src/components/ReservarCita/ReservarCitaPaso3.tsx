import { Box, Button, Card, CardContent, Stack, TextareaAutosize, TextField, Typography } from "@mui/material";
import type { CreateCita } from "../../api/citaService";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

interface ReservarCitaPaso3Props{
    cita: {
        especialidad: string;
        especialista: string;
        paciente: string;
        fecha: string
    };
    motivo: string;
    setMotivo: (motivo: string) => void;    
}

export default function ReservarCitaPaso3({
    cita,
    motivo,
    setMotivo
}: ReservarCitaPaso3Props){
    // useEffect(() => {
    //     if(motivo === ''){
    //         Swal.fire({
    //             title: 'Confirmacion de la cita',
    //             text: 'Por favor, verifique los datos de la cita y escriba el motivo',
    //             icon: 'info',
                
    //         }) 
    //     }
    // }, [])

    return(
        <Box>
            <Typography variant="h5" fontWeight={500} mb={2}>
                Confirmación y motivo de la cita
            </Typography>
            
            <Card >
                <CardContent>
                    <Typography variant="h6">
                        Datos de la Cita
                    </Typography>
                    <Typography variant="body1" mb={1}>
                        Para completar la reserva de cita, por favor verifique los datos y describa brevemente el motivo de la cita.
                    </Typography>
                    {Object.entries(cita).map(([key, value]) => (
    
                        <Stack direction={'row'} key={key}>
                            <Typography mr={2} variant="button" >
                                {`${key}:`}
                            </Typography>
                            <Typography>
                                {value}
                            </Typography>
                        </Stack>
                        
                    ))}
                    <TextField
                        value={motivo} 
                        variant='filled'
                        onChange={(e) => setMotivo(e.target.value)}
                        label="Describa brevemente el motivo de la cita"
                        fullWidth
                        required
                        multiline
                        rows={3}
                        sx={{
                            mt: 1
                        }}
                    />
                </CardContent>
            </Card>
        </Box>
    )
}