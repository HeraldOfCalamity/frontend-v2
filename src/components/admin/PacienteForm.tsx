import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Switch, TextField } from "@mui/material";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import type { PacienteWithUser } from "../../api/pacienteService";


export type PacienteFormField =
| 'name'
| 'lastname'
| 'email'
| 'password'
| 'ci'
| 'phone'
| 'tipo_sangre'
| 'fecha_nacimiento'
| 'isActive'
| 'save';

interface PacienteFormProps{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<PacienteWithUser>) => void;
    initialData?: PacienteWithUser;
    loading?: boolean;
    disabledFields?: PacienteFormField[]
}

const TIPOS_SANGRE = [
    'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-' 
]

export default function ({
    onClose,
    onSubmit,
    open,
    initialData,
    loading,
    disabledFields
}: PacienteFormProps){
     const defaultValues = initialData
        ? {
            name: initialData.user?.name || '',
            email: initialData.user?.email || '',
            role: initialData.user?.role || 'paciente',
            pacienteId: initialData.paciente?.id || '',
            lastname: initialData.user?.lastname || '',
            tipo_sangre: initialData.paciente?.tipo_sangre || '',
            fecha_nacimiento: initialData.paciente?.fecha_nacimiento ? new Date(initialData.paciente.fecha_nacimiento).toISOString().substring(0, 10)
                : '',
            phone: initialData.user?.phone || '',
            password: initialData.user?.password || '',
            isActive: initialData.user?.isActive,
            isVerified: initialData.user?.isVerified,
            ci: initialData.user?.ci || ''
                
        }
        : {
            email: '',
            role: 'paciente',
            pacienteId: '',
            name: '',
            lastname: '',
            tipo_sangre: '',
            phone: '',
            password: '',
            ci: '',
            fecha_nacimiento: '',
            isActive: true,
            isVerified: true,
        };
    const {register, handleSubmit, reset, control, formState: {errors}} = useForm({
        defaultValues
    })

    const isDisabled = (field: PacienteFormField) => 
        disabledFields?.includes(field);


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
                        name: data.name,
                        lastname: data.lastname,
                        email: data.email,
                        role: data.role,
                        password: data.password,
                        ci: data.ci,
                        phone: data.phone,
                        isActive: data.isActive,
                        isVerified: data.isVerified                      
                    },
                    paciente: {
                        tipo_sangre: data.tipo_sangre,
                        fecha_nacimiento: data.fecha_nacimiento,
                    }
                };
                onSubmit(submitData);
            })}>
                <DialogContent>
                    <Grid>
                        <TextField
                            label='Nombres'
                            fullWidth
                            size="small"
                            margin="normal"
                            {...register('name', {required: 'Nombre requerido'})}
                            error={!!errors.name}
                            disabled={isDisabled('name')}
                            helperText={errors.name?.message?.toString()}
                        />
                        <TextField
                                label='Apellidos'
                                fullWidth
                                size="small"
                                margin="normal"
                                disabled={isDisabled('lastname')}
                                {...register('lastname', {required: 'Apellido requerido'})}
                                error={!!errors.lastname}
                                helperText={errors.lastname?.message?.toString()}
                            />
                        <TextField
                            label='Correo'
                            type="email"
                            size="small"
                            fullWidth
                            margin="normal"
                            {...register('email', {required: 'Correo requerido'})}
                            error={!!errors.email}
                            disabled={isDisabled('email')}
                            helperText={errors.email?.message?.toString()}
                        />
                        {!initialData ? (
                            <TextField
                                label='Contraseña'
                                fullWidth
                                size="small"
                                margin="normal"
                                disabled={isDisabled('password')}
                                {...register('password', initialData ? {} : {required: 'Contraseña requerida'})}
                                error={!!errors.password}
                                helperText={errors.password?.message?.toString()}
                            />  
                        ) : null}
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
                                        disabled={isDisabled('tipo_sangre')}
                                        >
                                        {TIPOS_SANGRE.map(r => (
                                            <MenuItem value={r} key={r}>{r}</MenuItem>
                                        ))}
                                    </Select>
                                )}
                            />
                        </FormControl>
                        <TextField
                            label='Fecha de nacimiento'
                            type="date"
                            fullWidth
                            size="small"
                            margin="normal"
                            disabled={isDisabled('fecha_nacimiento')}
                            slotProps={{
                                inputLabel:{
                                    shrink: true
                                }
                            }}
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
                            {...register('phone', {
                                required: 'Telefono requerido',
                                validate: (value: string | undefined) => {
                                    if (value === undefined) return 'El valor no puede ser vacío';

                                    const parsed = parseInt(value);
                                    if(isNaN(parsed) || parsed.toString() !== value) return 'El valor ingresado debe ser un numero de teléfono';
                                    return true;
                                }}
                            )}
                            error={!!errors.phone}
                            disabled={isDisabled('phone')}
                            helperText={errors.phone?.message?.toString()}
                        />
                        <TextField
                            label='CI'
                            type="text"
                            fullWidth
                            size="small"
                            margin="normal"
                            disabled={isDisabled('ci')}
                            {...register('ci', {
                                required: 'CI requerido',
                                validate: (value: string | undefined) => {
                                    if (value === undefined) return 'El valor no puede ser vacío';

                                    const parsed = parseInt(value);
                                    if(isNaN(parsed) || parsed.toString() !== value) return 'El valor ingresado debe ser un carnet de identidad.';
                                    return true;
                                }}
                            )}
                            error={!!errors.ci}
                            helperText={errors.ci?.message?.toString()}
                        />
                        <Controller
                            name="isActive"
                            control={control}
                            
                            render={({ field }) => (
                                <FormControlLabel  
                                    control={
                                        <Switch
                                            disabled={isDisabled('isActive')}
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                        />
                                    }
                                    label="Activo"
                                />
                            )}
                        />
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained" disabled={loading || isDisabled('save')}>
                        {loading ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}