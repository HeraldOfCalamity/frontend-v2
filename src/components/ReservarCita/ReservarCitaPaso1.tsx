import { useEffect, useState } from "react";
import { getEspecialistasByEspecialidadId, type Especialista, type EspecialistaWithUser } from "../../api/especialistaService";
import type { Especialidad } from "../../api/especialidadService";
import Swal from "sweetalert2";
import { Box, Card, CardActionArea, CardContent, CardMedia, CircularProgress, Divider, Grid, Skeleton, Stack, Typography, useTheme } from "@mui/material";
import { BASE_URL } from "../../config/benedetta.api.config";
import { benedettaPink } from "../../config/theme.config";

interface ReservarCitaPaso1Props {
    especialidad: Partial<Especialidad>
    // especialista: Partial<Especialista>
    handleEspecialistaClick: (especialista: EspecialistaWithUser) => void
}

export default function ReservarCitaPaso1({
    especialidad,
    // especialista,
    handleEspecialistaClick
}: ReservarCitaPaso1Props) {
    const theme = useTheme();
    const [especialistas, setEspecialistas] = useState<EspecialistaWithUser[]>([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const obtenerEspecialistasPorEspecialidad = async () => {
            setLoading(true)
            try{
                const especialistas = await getEspecialistasByEspecialidadId(especialidad.id || '');
                setEspecialistas(especialistas);
            }catch(err: any){
                Swal.fire('Error', `${err}`, 'error');
            }finally{
                setLoading(false)
            }
        }
        if(especialidad.id){
            obtenerEspecialistasPorEspecialidad();
        }
    }, [especialidad])

    useEffect(() => {
        console.log('espcialidad', especialidad)
        console.log('especialistas', especialistas)
    }, [especialidad, especialistas])

    return (
        <Box sx={{overflowY: 'scroll'}}>
            <Grid justifyContent={'space-around'} container spacing={1}>
                {loading ? (
                    <Box display={'flex'} justifyContent={'center'} alignItems={'center'} flexGrow={1}>
                        <CircularProgress color="secondary"/>
                    </Box>
                ) : especialistas.map(esp => (
                    <Grid size={{lg: 4, md: 6, xs: 12}} key={esp.especialista.id}>
                        <Card sx={{
                                m:1,
                                bgcolor: benedettaPink
                                // bgcolor: theme.palette.secondary.main, 
                                // color: theme.palette.secondary.contrastText
                            }}>
                            <CardActionArea onClick={() => handleEspecialistaClick(esp)}>
                                <CardContent>
                                    <Typography variant="h6">
                                        {`${esp.user.name} ${esp.user.lastname}`}
                                    </Typography>
                                    <Divider sx={{color: theme => theme.palette.primary.main}} />
                                    <Stack spacing={2} direction={'row'} width={'100%'} mt={1} maxHeight={'350px'} sx={{overflowY:'auto', overflowX: 'hidden'}}>
                                        <Box minWidth={'40%'} height={'200px'} border={1} borderColor={theme => theme.palette.grey[500]} borderRadius={1} bgcolor={theme => theme.palette.common.white}>
                                            <CardMedia  
                                                sx={{ height: '100%', display: esp.especialista.image ? "block" : "none", opacity:1 }}
                                                image={`${BASE_URL}${esp.especialista.image}`}
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
                                            <Typography variant="body2" textAlign={"center"}>
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