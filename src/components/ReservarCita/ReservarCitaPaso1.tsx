import { useEffect, useState } from "react";
import { getEspecialistasByEspecialidadId, type Especialista, type EspecialistaWithUser } from "../../api/especialistaService";
import type { Especialidad } from "../../api/especialidadService";
import Swal from "sweetalert2";
import { Box, Card, CardActionArea, CardContent, CardMedia, Divider, Grid, Skeleton, Stack, Typography, useTheme } from "@mui/material";

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
    const theme = useTheme();
    const [especialistas, setEspecialistas] = useState<EspecialistaWithUser[]>([]);


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
        <Box sx={{overflowY: 'scroll'}}>
            <Grid justifyContent={'space-around'} container spacing={1}>
                {especialistas.map(esp => (
                    <Grid size={{lg: 4, md: 6, xs: 12}} key={esp.especialista.id}>
                        <Card variant="outlined" sx={{
                                bgcolor: theme.palette.secondary.main, 
                                color: theme.palette.secondary.contrastText
                            }}>
                            <CardActionArea onClick={() => handleEspecialistaClick(esp.especialista as Especialista)}>
                                <CardContent>
                                    <Typography variant="h6">
                                        {`${esp.user.name} ${esp.user.lastname}`}
                                    </Typography>
                                    <Divider />
                                    <Stack spacing={2} direction={'row'} width={'100%'} mt={1} maxHeight={'350px'} sx={{overflowY:'auto', overflowX: 'hidden'}}>
                                        <Box minWidth={'40%'} height={'200px'}>
                                            <CardMedia  
                                                sx={{ height: '100%', display: esp.especialista.image ? "block" : "none" }}
                                                image={esp.especialista.image}
                                                title={`Imagen ${esp.user.name}`}
                                            />
                                            {!esp.especialista.image && <Skeleton variant="rounded" width={'100%'} height={'100%'}  />}
                                        </Box>
                                        <Box sx={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flexGrow: 1}} m={1}>
                                            {!esp.especialista.informacion && <>
                                                    <Skeleton width={'100%'}/>
                                                    <Skeleton width={'100%'}/>
                                                    <Skeleton width={'100%'}/>
                                                    <Skeleton width={'30%'}/>
                                                    <br />
                                                    <Skeleton width={'100%'}/>
                                                    <Skeleton width={'100%'}/>
                                                    <Skeleton width={'100%'}/>
                                                    <Skeleton width={'40%'}/>
                                                </>
                                            }
                                            <Typography>
                                                {esp.especialista.informacion}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}