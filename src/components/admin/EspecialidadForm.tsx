import { useEffect } from 'react';
import {useForm} from 'react-hook-form'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Modal from '../common/Modal';
import CustomInput from '../common/CustomInput';

interface EspecialidadFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {nombre: string; descripcion:string}) => void;
    initialData?: {nombre: string; descripcion: string};
    loading?: boolean;
}

export default function EspecialidadForm({
    onClose,
    onSubmit,
    open,
    initialData,
    loading
}: EspecialidadFormProps){
    const {register, handleSubmit, reset} = useForm({
        defaultValues: initialData || {nombre: '', descripcion: ''},
    });

    useEffect(() => {
        reset(initialData || {nombre: '', descripcion: ''});
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