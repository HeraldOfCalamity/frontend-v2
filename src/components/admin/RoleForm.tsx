import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, OutlinedInput, Select, Stack, TextField, Typography, FormControlLabel, Checkbox } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import type { Role } from "../../api/roleService";
import { useEffect } from "react";
import type { Permission } from "../../api/permisosService";
interface RoleFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<Role>) => void;
    initialData?: Role;
    loading?: boolean;
    permisos: Permission[]
}
export default function RoleForm({
    onClose,
    onSubmit,
    open,
    initialData,
    permisos,
    loading
}:RoleFormProps){
    const {register, handleSubmit, reset, control, formState: {errors}} = useForm<Partial<Role>>({
        defaultValues: initialData || {name: '', description: '', permissions: []},
    });
    

    useEffect(() => {
        reset(initialData || {name: '', description: '', permissions: []});

    }, [initialData, reset, open])

    return(
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
            <DialogTitle>
                {initialData ? 'Editar Rol' : 'Nuevo Rol'}
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2}>
                        <TextField
                            label='Nombre'
                            fullWidth
                            margin="normal"
                            {...register('name', {required: 'Nombre Requerido'})}
                            error={!!errors.name}
                            helperText={errors.name?.message?.toString()}
                        />
                        <TextField
                            label='Descripcion'
                            fullWidth
                            margin="normal"
                            {...register('description')}
                            error={!!errors.description}
                            helperText={errors.description?.message?.toString()}
                        />
                        <Controller
                            name="permissions"
                            control={control}
                            render={({ field }) => (
                                <Box>
                                    <Typography variant="subtitle2" mb={1}>Permisos</Typography>
                                    <Stack spacing={1}>
                                        {permisos.map((permiso) => (
                                            <FormControlLabel
                                                key={permiso.id}
                                                control={
                                                    <Checkbox
                                                        checked={field.value?.includes(permiso.id)}
                                                        onChange={(_, checked) => {
                                                            const newValue = checked
                                                                ? [...field.value ?? [], permiso.id]
                                                                : field.value?.filter((id) => id !== permiso.id);
                                                            field.onChange(newValue);
                                                        }}
                                                    />
                                                }
                                                label={permiso.name}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="secondary">Cancelar</Button>
                    <Button type="submit" variant="contained" color="primary" loading={loading}>
                        {initialData ? 'Actualizar' : 'Crear'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}