import { ArrowCircleRightRounded } from "@mui/icons-material";
import { Box, Button, Card, CardActionArea, CardContent, CardMedia, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import type { Column, TableAction } from "../common/GenericTable";
import GenericTable from "../common/GenericTable";
import Swal from "sweetalert2";
import { getEspecialidades, type Especialidad } from "../../api/especialidadService";
import { BASE_URL } from "../../config/benedetta.api.config";

interface BuscarEspecialidadProps{
    open: boolean;
    onClose: () => void;
    onSelectEspecialidad: (especialidad: Especialidad) => void;
}

export default function BuscarEspecialidad({
    onClose,
    open,
    onSelectEspecialidad
}: BuscarEspecialidadProps){
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [loading, setLoading] = useState(false);

    const obtenerEspecialidades = async () => {
        setLoading(true);
        try{
            const esp = await getEspecialidades();
            setEspecialidades(esp)
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        if(open){
            obtenerEspecialidades()
        }
    }, [open]);

    return(
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='lg'
            fullWidth
        >
            <DialogTitle>
                Seleccionar Especialidad
            </DialogTitle>
            <DialogContent sx={{
                // height: '40vh',
                overflowY: 'scroll',
                // pr:1
            }}>
                <Grid container spacing={2} my={5} display={'flex'} alignItems={'center'} height={'100%'} >
                    {especialidades.map((esp) =>
                        <Grid size={{xs:12, sm:6, md:4}} key={esp.id}>
                            <Card>
                                <CardActionArea onClick={() => onSelectEspecialidad(esp)}>
                                    <CardMedia
                                        sx={{height:140}}
                                        image={`${BASE_URL}${esp.image}`}
                                    >
                                        {!esp.image && <Skeleton variant="rectangular" height={140} sx={{pb: 2}}/>}
                                    </CardMedia>
                                    <CardContent>
                                        <Typography variant="h6" textAlign="center">
                                            {esp.nombre}
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="error"
                    onClick={onClose}
                >Cancelar</Button>
            </DialogActions>
        </Dialog>
    )
}