import { useEffect, useState } from "react";
import { getEspecialistasByEspecialidadId, type Especialista } from "../../api/especialistaService";
import type { Especialidad } from "../../api/especialidadService";
import Swal from "sweetalert2";
import { Box, Card, CardActionArea, CardContent, CardHeader, Typography } from "@mui/material";

interface ReservarCitaPaso1Props {
    especialidad: Partial<Especialidad>
    // especialista: Partial<Especialista>
    handleEspecialistaClick: (especialista: Especialista) => void
}

export default function ReservarCitaPaso1({
    especialidad,
    // especialista,
    handleEspecialistaClick
}: ReservarCitaPaso1Props) {
    const [especialistas, setEspecialistas] = useState<Especialista[]>([]);


    useEffect(() => {
        const obtenerEspecialistasPorEspecialidad = async () => {
            try{
                const especialistas = await getEspecialistasByEspecialidadId(especialidad.id || '');
                setEspecialistas(especialistas);
            }catch(err: any){
                Swal.fire('Error', `${err}`, 'error');
            }
        }
        if(especialidad.id){
            obtenerEspecialistasPorEspecialidad();
        }
    }, [especialidad])

    return (
        <Box display={'flex'} gap={3} justifyContent={'space-around'}>
            {especialistas.map(esp => (
                <Card key={esp.id}>
                    <CardActionArea onClick={() => handleEspecialistaClick(esp)}>
                        <CardContent>
                            <Typography variant="h5">
                                {esp.nombre}
                            </Typography>
                            
                        </CardContent>
                    </CardActionArea>
                </Card>
            ))}
        </Box>
    );
}