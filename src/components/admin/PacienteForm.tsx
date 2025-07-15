import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { PacienteWithUser } from "../../api/pacienteService";

interface PacienteFormProps{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<PacienteWithUser>) => void;
    initialData?: PacienteWithUser;
    loading?: boolean;
}

const TIPOS_SANGRE = [
    'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-' 
]

export default function ({
    onClose,
    onSubmit,
    open,
    initialData,
    loading
}: PacienteFormProps){
     const defaultValues = initialData
        ? {
            username: initialData.user?.username || '',
            email: initialData.user?.email || '',
            role: initialData.user?.role || 'paciente',
            pacienteId: initialData.paciente?.id || '',
            nombre: initialData.paciente?.nombre || '',
            apellido: initialData.paciente?.apellido || '',
            tipo_sangre: initialData.paciente?.tipo_sangre || '',
            fecha_nacimiento: initialData.paciente?.fecha_nacimiento ? new Date(initialData.paciente.fecha_nacimiento).toISOString().substring(0, 10)
                : '',
            telefono: initialData.paciente?.telefono || '',
            password: initialData.user?.password || '',
            isActive: initialData.user?.isActive
                
        }
        : {
            username: '',
            email: '',
            role: 'paciente',
            pacienteId: '',
            nombre: '',
            apellido: '',
            tipo_sangre: '',
            telefono: '',
            password: '',
            fecha_nacimiento: '',
            isActive: true
        };
    const {register, handleSubmit, reset, control, formState: {errors}} = useForm({
        defaultValues
    })


    useEffect(() => {
        reset({
            ...defaultValues,
            fecha_nacimiento: defaultValues.fecha_nacimiento
                ? new Date(defaultValues.fecha_nacimiento).toISOString().substring(0, 10)
                : '',
        });
    }, [initialData, reset, open])

    return(
        <Dialog open={open} onClose={onClose} >
            <DialogTitle>{initialData ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <form onSubmit={handleSubmit((data) => {
                // Convert fechaNacimiento to Date if it's a string


                // Transform to PacienteWithUser shape
                const submitData: Partial<PacienteWithUser> = {
                    user: {
                        username: data.username,
                        email: data.email,
                        role: data.role,
                        password: data.password,
                        isActive: data.isActive
                    },
                    paciente: {
                        nombre: data.nombre,
                        apellido: data.apellido,
                        tipo_sangre: data.tipo_sangre,
                        fecha_nacimiento: data.fecha_nacimiento,
                        telefono: data.telefono
                    }
                };
                onSubmit(submitData);
            })}>
                <DialogContent>
                    <Grid>
                        <TextField
                            label='Nombre de Usuario'
                            fullWidth
                            size="small"
                            margin="normal"
                            {...register('username', {required: 'Nombre requerido'})}
                            error={!!errors.username}
                            helperText={errors.username?.message?.toString()}
                        />
                        <TextField
                            label='Correo'
                            type="email"
                            size="small"
                            fullWidth
                            margin="normal"
                            {...register('email', {required: 'Correo requerido'})}
                            error={!!errors.email}
                            helperText={errors.email?.message?.toString()}
                        />
                        {!initialData ? (
                            <TextField
                                label='Contraseña'
                                fullWidth
                                size="small"
                                margin="normal"
                                {...register('password', initialData ? {} : {required: 'Apellido requerido'})}
                                error={!!errors.apellido}
                                helperText={errors.apellido?.message?.toString()}
                            />  
                        ) : null}
                        <TextField
                            label='Nombre'
                            fullWidth
                            size="small"
                            margin="normal"
                            {...register('nombre', {required: 'Nombre requerido'})}
                            error={!!errors.nombre}
                            helperText={errors.nombre?.message?.toString()}
                        />
                        <FormControl fullWidth margin="normal" error={!!errors.tipo_sangre}>
                            <InputLabel id="rol-label">Tipo de Sangre</InputLabel>
                            <Controller
                                name="tipo_sangre"
                                control={control}
                                defaultValue="O+"
                                rules={{ required: "Tipo de sangre requerido" }}
                                render={({ field }) => (
                                    <Select
                                        labelId="tipo-sangre-label"
                                        label="Tipo Sangre"
                                        {...field}
                                        disabled={loading}
                                        >
                                        {TIPOS_SANGRE.map(r => (
                                            <MenuItem value={r} key={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                )}
                            />
                        </FormControl>
                        <TextField
                            label='Apellido'
                            fullWidth
                            size="small"
                            margin="normal"
                            {...register('apellido', {required: 'Apellido requerido'})}
                            error={!!errors.apellido}
                            helperText={errors.apellido?.message?.toString()}
                        />
                        <TextField
                            label='Fecha de nacimiento'
                            type="date"
                            fullWidth
                            size="small"
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            {...register('fecha_nacimiento', {required: 'Fecha requerida'})}
                            error={!!errors.fecha_nacimiento}
                            helperText={errors.fecha_nacimiento?.message?.toString()}
                        />
                        <TextField
                            label='Telefono'
                            type="number"
                            fullWidth
                            size="small"
                            margin="normal"
                            {...register('telefono', {required: 'Telefono requerido'})}
                            error={!!errors.telefono}
                            helperText={errors.telefono?.message?.toString()}
                        />
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}