import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import type { ConfigNames, OfficeConfiguration } from "../../api/configService";
import { useForm } from "react-hook-form";
import { useEffect } from "react";

interface OfficeConfigFormProps {
    open: boolean;
    initialData: Partial<OfficeConfiguration>
    onClose: () => void;
    onSubmit: (data: Partial<OfficeConfiguration>) => void;
    loading: boolean;
}
export default function OfficeConfigForm({
    initialData,
    onClose,
    onSubmit,
    open,
    loading
}: OfficeConfigFormProps) {
    const {register, handleSubmit, reset, formState: {errors}} = useForm({
        defaultValues: initialData || {
            value: ''
        }
    })

    useEffect(() => {
        reset(initialData || {
            value: ''
        });
    }, [initialData, reset, open]);

    // {...register('password', {
    //     required: 'Contraseña Requerida',
    //     validate: {
    //         VerifyConfirmPassword: (password) => {
    //             if(password !== confirmPassword) return 'Las contraseñas no coinciden';
    //         }
    //     }
    // })}
    const getFieldValidation = (parameterName: ConfigNames | string) => {
        switch(parameterName){
            case "confirmacion_automatica":
                return (value: string | undefined) => {
                    if (value === undefined) return 'El valor no puede ser vacío';

                    return ['0', '1'].includes(value) ? true : 'El valor debe ser "0" o "1"';
                }
            case "duracion_cita_minutos":
                return (value: string | undefined) => {
                    if (value === undefined) return 'El valor no puede ser vacío';

                    const parsed = parseInt(value);
                    console.log('validacion', value, parsed)
                    if(isNaN(parsed) || parsed.toString() !== value) return 'El valor ingresado debe ser un numero';
                    
                    if(parsed <= 0) return 'El valor ingresado debe ser mayor que "0"';

                    if(parsed%5 > 0) return 'El valor ingresado debe ser multiplo de 5';

                    if(parsed > 60) return 'El valor ingresado debe ser menor que 60';

                    return true;
                }
            default:
                return undefined;
        }
    }
    return(
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Editar Parametro
            </DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <TextField
                        label={initialData.name}
                        fullWidth
                        margin="normal"
                        {...register('value', {
                            required: 'valor requerido',
                            validate: getFieldValidation(initialData.name!) ?? ((v) => v !== undefined || 'Valor requerido')
                        })}
                        error={!!errors.value}
                        helperText={errors.value?.message?.toString()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="secondary">Cancelar</Button>
                    <Button type="submit" variant="contained" color="primary" loading={loading}>
                        Guardar
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}