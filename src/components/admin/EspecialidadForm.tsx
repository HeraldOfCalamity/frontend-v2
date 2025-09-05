import { useEffect, useState } from 'react';
import {Controller, useForm} from 'react-hook-form'
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, InputLabel, Link, Stack, TextField } from '@mui/material';
import InputFileUpload from '../InputFileUpload';
import { AddCircleOutline } from '@mui/icons-material';
import type { Especialidad } from '../../api/especialidadService';
import ImagePreviewDialog from '../common/ImagePreviewDialog';
import TratamientoForm from './TratamientoForm';
import { getTratamientos, type Tratamiento } from '../../api/tratamientoService';
import Swal from 'sweetalert2';
import { BASE_URL } from '../../config/benedetta.api.config';

type EspecialidadFormField = 'nombre' | 'descripcion' | 'image';

interface EspecialidadFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Especialidad>) => void;
    initialData?: Partial<Especialidad>;
    loading?: boolean;
}

export default function EspecialidadForm({
    onClose,
    onSubmit,
    open,
    initialData,
    loading
}: EspecialidadFormProps){
    const {register, handleSubmit, reset, setValue, control} = useForm({
        defaultValues: initialData || {nombre: '', descripcion: '', image: '', tratamientos: []},
    });
    const [preview, setPreview] = useState<string | null>(initialData?.image || null);
    const [openImagePreviewDialog, setOpenImagePreviewDialog] = useState(false);
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Aquí puedes guardarlo en el estado, o mandarlo directo en el submit:
                setPreview(base64String);
                setValue("image", base64String);
            };
            reader.readAsDataURL(file);
        }
    };

    const obtenerTratamientos = async () => {
        try{
            const res = await getTratamientos();
            setTratamientos(res);
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error')
        }
    }

    useEffect(() => {
        obtenerTratamientos();
    }, [])

    useEffect(() => {
        reset(initialData || {nombre: '', descripcion: '', image: '', tratamientos: []});
        setPreview(initialData?.image || '')
    }, [initialData, reset, open]);

    return(
        <>
            <Dialog open={open} onClose={onClose} maxWidth={'sm'} fullWidth>
                <DialogTitle>{initialData ? "Editar Especialidad" : "Nueva Especialidad"}</DialogTitle>
                <form onSubmit={handleSubmit((data) => {
                    const submitData = {
                        nombre: data.nombre,
                        descripcion: data.descripcion,
                        image: data.image,
                        tratamientos: data.tratamientos
                    }
                    console.log('submitData especialidad', submitData)
                    onSubmit(submitData)
                })}>
                    <DialogContent>
                        <TextField
                            variant='standard'
                            label='Nombre'
                            fullWidth
                            margin='normal'
                            {...register('nombre', {required: 'Nombre requerido'})}
                        />
                        <TextField
                            variant='filled'
                            label="Descripción"
                            fullWidth
                            margin="normal"
                            multiline
                            rows={5}
                            {...register("descripcion")}
                        />
                        <Stack>
                            <Controller
                                name="tratamientos"
                                control={control}
                                render={({ field }) => (
                                    <Box>
                                        <InputLabel>Tratamientos</InputLabel>
                                        <Box
                                            sx={{
                                                maxHeight: 150, // altura máxima visible
                                                overflowY: 'auto',
                                                p: 1,
                                                bgcolor: 'background.paper',
                                                // Estilos personalizados para la barra de scroll
                                                '::-webkit-scrollbar': {
                                                    width: 8,
                                                    backgroundColor: '#f3e0e8',
                                                    borderRadius: 8,
                                                },
                                                '::-webkit-scrollbar-thumb': {
                                                    backgroundColor: '#e573a7',
                                                    borderRadius: 8,
                                                },
                                                '::-webkit-scrollbar-thumb:hover': {
                                                    backgroundColor: '#d81b60',
                                                },
                                            }}
                                        >
                                            <Stack spacing={1}>
                                                {tratamientos.map((t) => (
                                                    <FormControlLabel
                                                        key={t.id}
                                                        control={
                                                            <Checkbox
                                                                checked={field.value?.includes(t.id)}
                                                                // disabled={isDisabled('tratamientos')}
                                                                color="secondary"
                                                                onChange={(_, checked) => {
                                                                    const newValue = checked
                                                                        ? [...field.value ?? [], t.id]
                                                                        : field.value?.filter((id) => id !== t.id);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                        }
                                                        label={t.nombre}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Box>
                                )}
                            />
                        </Stack>
                        <Stack mt={1} spacing={1}>
                            <InputLabel>Imagen Descriptiva</InputLabel>
                            <InputFileUpload 
                                label="Subir Fotografia" 
                                color='secondary'
                                handleChange={handleImageChange} 
                                accept="image/"
                                variant={'outlined'}
                            />
                            {preview && (
                                <Link 
                                    component={'button'} 
                                    type="button"
                                    color='secondary'
                                    textAlign={'center'} 
                                    onClick={() => setOpenImagePreviewDialog(true)}>
                                    Ver imagen cargada
                                </Link>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button type='submit' variant='contained' loading={loading}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                        <Button onClick={onClose} variant='contained' color='error'>Cancelar</Button>
                    </DialogActions>
                </form>
            </Dialog>
            <ImagePreviewDialog
                open={openImagePreviewDialog}
                onClose={() => setOpenImagePreviewDialog(false)}
                image={initialData?.image === preview ? `${BASE_URL}${preview}` : preview || ''}
                alt='Especialidad Image'
            />
        </>
    )
}