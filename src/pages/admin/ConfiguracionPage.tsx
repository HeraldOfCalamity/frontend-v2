import { Box, Grid, IconButton, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getOfficeConfig, type OfficeConfiguration } from "../../api/configService";
import { Button } from "@mui/material";
import { updateOfficeConfig } from "../../api/configService";
import { Edit } from "@mui/icons-material";
import OfficeConfigForm from "./OfficeConfigForm";


export default function ConfiguracionPage() {
    const [config, setConfig] = useState<OfficeConfiguration[]>([]);
    const [openOfficeConfigForm, setOpenOfficeConfigForm] = useState(false);
    const [editData, setEditData] = useState<OfficeConfiguration | null>(null);
    const [loading, setLoading] = useState(false);

    const handleOpenOfficeConfigForm = (data: OfficeConfiguration) => {
        setEditData(data);
        setOpenOfficeConfigForm(true);
    }

    const handleCloseOfficeConfigForm = () => {
        setEditData(null);
        setOpenOfficeConfigForm(false);
    }

    const actualizarOfficeConfig = async (data: Partial<OfficeConfiguration>) => {
        setLoading(true);
        try{
            const updated = await updateOfficeConfig(editData?.id!, data);
            if(updated){
                Swal.fire(
                    'Operacion Exitosa!',
                    'Parametro actualizado con exito',
                    'success'
                )
                obtenerParametros()
            }

        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }finally{
            setLoading(false);
            handleCloseOfficeConfigForm();
        }
    }

    const obtenerParametros = async () => {
        try{
            const config = await getOfficeConfig();
            setConfig(config || []);
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }
    useEffect(() => {
        obtenerParametros();
    }, [])
    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                Configuracion
            </Typography>
            <Grid container spacing={2}>
                {config.map(config => (
                    <Grid key={config.id} size={6}>
                        <Box display={"flex"} justifyContent={'center'} alignItems={'center'}>
                            <TextField 
                                label={config.name} 
                                value={config.value}
                            />
                            <IconButton
                                sx={{ml: 2}}
                                onClick={() => handleOpenOfficeConfigForm(config)}
                            >
                                <Edit />
                            </IconButton>
                        </Box>
                    </Grid>
                ))}
            </Grid>
            <OfficeConfigForm
                open={openOfficeConfigForm}
                initialData={editData || {}}
                loading={loading}
                onSubmit={actualizarOfficeConfig}
                onClose={handleCloseOfficeConfigForm}
                />
        </Box> 
    )
}