import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography, FormControlLabel, Checkbox } from "@mui/material";
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
                                    <Box
                                        sx={{
                                            maxHeight: 200, // altura máxima visible
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
                                            {permisos.map((permiso) => (
                                                <FormControlLabel
                                                    key={permiso.id}
                                                    control={
                                                        <Checkbox
                                                            checked={field.value?.includes(permiso.id)}
                                                            color="secondary"
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
                                </Box>
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button type="submit" variant="contained" color="primary" loading={loading}>
                        {initialData ? 'Actualizar' : 'Crear'}
                    </Button>
                    <Button onClick={onClose} variant="contained" color="error">Cancelar</Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}