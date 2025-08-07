import { useEffect, useState } from 'react';
import {useForm} from 'react-hook-form'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Modal from '../common/Modal';
import CustomInput from '../common/CustomInput';

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
    const [preview, setPreview] = useState<string | null>(null);

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
        setPreview('')
    }, [initialData, reset, open]);

    return(
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
                        variant='standard'
                        label="Descripción"
                        fullWidth
                        margin="normal"
                        {...register("descripcion")}
                    />
                    <input
                        type='file'
                        accept='image/'
                        onChange={handleImageChange}
                        style={{marginTop: 24, marginBottom: 12}}
                        />
                    {preview && (
                        <img
                            src={preview}
                            alt="Vista previa"
                            style={{ width: 120, height: 120, borderRadius: 12, marginTop: 12, objectFit: 'cover' }}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type='submit' variant='contained' loading={loading}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}