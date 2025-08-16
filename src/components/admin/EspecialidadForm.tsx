import { useEffect, useState } from 'react';
import {useForm} from 'react-hook-form'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, InputLabel, Link, Stack, TextField } from '@mui/material';
import InputFileUpload from '../InputFileUpload';

type EspecialidadFormField = 'nombre' | 'descripcion' | 'image';

interface EspecialidadFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {nombre: string; descripcion:string, image?: string}) => void;
    initialData?: {nombre: string; descripcion: string, image?: string};
    loading?: boolean;
}

export default function EspecialidadForm({
    onClose,
    onSubmit,
    open,
    initialData,
    loading
}: EspecialidadFormProps){
    const {register, handleSubmit, reset, setValue} = useForm({
        defaultValues: initialData || {nombre: '', descripcion: '', image: ''},
    });
    const [preview, setPreview] = useState<string | null>(initialData?.image || null);
    const [openImagePreviewDialog, setOpenImagePreviewDialog] = useState(false);

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


    useEffect(() => {
        reset(initialData || {nombre: '', descripcion: '', image: ''});
        setPreview(initialData?.image || '')
    }, [initialData, reset, open]);

    return(
        <>
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>{initialData ? "Editar Especialidad" : "Nueva Especialidad"}</DialogTitle>
                <form onSubmit={handleSubmit(onSubmit)}>
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
                        <Stack mt={1} spacing={1}>
                            <InputLabel>Fotografia Personal</InputLabel>
                            <InputFileUpload 
                                label="Subir Fotografia" 
                                handleChange={handleImageChange} 
                                accept="image/"
                                variant={'outlined'}
                            />
                            {preview && <Link 
                                component={'button'} 
                                type="button"
                                textAlign={'center'} 
                                onClick={() => setOpenImagePreviewDialog(true)}>
                                Ver imagen cargada
                            </Link>}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>Cancelar</Button>
                        <Button type='submit' variant='contained' loading={loading}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
            <Dialog
                open={openImagePreviewDialog}
                onClose={() => setOpenImagePreviewDialog(false)}
            >
                <DialogTitle>
                    Imagen Cargada
                </DialogTitle>
                <DialogContent>
                    <img height={210} src={preview || ''} alt="Especialista Image" style={{ objectFit: 'cover', borderRadius: 8 }}/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenImagePreviewDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}