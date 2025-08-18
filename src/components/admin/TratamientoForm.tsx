import { AddCircleOutline } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, InputLabel, Link, Stack, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import InputFileUpload from "../InputFileUpload";
import { useEffect, useState } from "react";
import ImagePreviewDialog from "../common/ImagePreviewDialog";
import type { Tratamiento } from "../../api/tratamientoService";

interface TratamientoFormProps{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Tratamiento>) => void;
    initialData?: Partial<Tratamiento>;
    loading?: boolean;
}

export default function TratamientoForm({
    open,
    onClose,
    onSubmit,
    initialData,
    loading
}: TratamientoFormProps){
    
    const [preview, setPreview] = useState<string | null>(initialData?.image || null);
    const [openImagePreviewDialog, setOpenImagePreviewDialog] = useState(false);
    const {handleSubmit, register, setValue, reset} = useForm({
        defaultValues: initialData || {
            nombre: '', 
            descripcion: '', 
            image: ''
        },
    });
    

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
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth={'sm'} 
                fullWidth
            >
                <DialogTitle>{initialData ? "Editar Tratamiento" : "Nuevo Tratamiento"}</DialogTitle>
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
                                <InputLabel>Imagen Descriptiva</InputLabel>
                                <InputFileUpload
                                    label="Subir Fotografía" 
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
                                        onClick={() => setOpenImagePreviewDialog(true)}
                                    >
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
                onClose={() => setOpenImagePreviewDialog(false)}
                open={openImagePreviewDialog}
                image={preview || ''}
                alt="Tratamiento Image"
            />
        </>
    );
}