import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { getRoles, type Role } from "../../api/roleService";
import Swal from "sweetalert2";

interface UsuarioFormProps{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    loading?: boolean;
}


export default function ({
    onClose,
    onSubmit,
    open,
    initialData,
    loading
}: UsuarioFormProps){
    const {register, handleSubmit, reset, control, formState: {errors}} = useForm({
        defaultValues: initialData || {name: '', email:'', role: 'paciente'},
    })

    const [roles, setRoles] = useState<Role[]>([]);

    const obtenerRoles = async () => {
        try {
            const roles = await getRoles();
            setRoles(roles);
        } catch (err: any) {    
            Swal.fire("Error", "Ocurrio un error al obtener los usuarios", 'error');
        }
    }

    useEffect(() => {
        obtenerRoles();
        reset(initialData || {name: '', email: '', role: 'paciente'});
    }, [initialData, reset, open])

    return(
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{initialData ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <TextField
                        label='Nombre'
                        fullWidth
                        margin="normal"
                        {...register('name', {required: 'Nombre requerido'})}
                        error={!!errors.name}
                        helperText={errors.name?.message?.toString()}
                    />
                    <TextField
                        label='Correo'
                        type="email"
                        fullWidth
                        margin="normal"
                        {...register('email', {required: 'Correo requerido'})}
                        error={!!errors.email}
                        helperText={errors.email?.message?.toString()}
                    />
                    {!initialData && <FormControl fullWidth margin="normal" error={!!errors.role}>
                        <InputLabel id="rol-label">Rol</InputLabel>
                        <Controller
                        name="role"
                        control={control}
                        defaultValue="paciente"
                        rules={{ required: "Rol requerido" }}
                        render={({ field }) => (
                            <Select
                            labelId="rol-label"
                            label="Rol"
                            {...field}
                            disabled={loading}
                            >
                            {roles.map(r => (
                                <MenuItem value={r.id} key={r.id}>{r.name}</MenuItem>
                            ))}
                            </Select>
                        )}
                        />
                    </FormControl>}
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