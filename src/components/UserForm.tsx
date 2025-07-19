import { useForm } from "react-hook-form";
import type { User } from "../api/userService";
import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";

interface UserFormProps{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<User>) => void;
    initialData?: User;
    loading?: boolean;
}
export default function UserForm({
    onClose,
    onSubmit,
    open,
    initialData,
    loading
}: UserFormProps){
    const [confirmPassword, setConfirmPassword] = useState('');
    const {register, handleSubmit, reset, formState: {errors}} = useForm({
        defaultValues: initialData || {
            email: '',
            password: '',
            username: ''
        }
    })

    useEffect(() => {
        reset(initialData || {
            email: '',
            password: '',
            username: ''
        });
        setConfirmPassword('')
    }, [initialData, reset, open]);

    return(
        <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
            <DialogTitle>
                {initialData ? 'Editar Usuario' : 'Nuevo Usuario'}
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={2}>
                        <TextField
                            label="Nombre de Usuario"
                            fullWidth
                            margin="normal"
                            {...register('username', {required: 'Nombre de usuario requerido'})}
                        />
                        <TextField
                            label="Correo"
                            fullWidth
                            type="email"
                            margin="normal"
                            {...register('email', {required: 'Email Requerido'})}
                            error={!!errors.email}
                            helperText={errors.email?.message?.toString()}
                        />
                        <TextField
                            label="Contraseña"
                            fullWidth
                            type="password"
                            margin="normal"
                            {...register('password', {
                                required: 'Contraseña Requerida',
                                validate: {
                                    VerifyConfirmPassword: (password) => {
                                        if(password !== confirmPassword) return 'Las contraseñas no coinciden';
                                    }
                                }
                            })}
                            error={!!errors.password}
                            helperText={errors.password?.message?.toString()}
                        />
                        <TextField
                            label="Repite la contraseña"
                            fullWidth
                            type="password"
                            margin="normal"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
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