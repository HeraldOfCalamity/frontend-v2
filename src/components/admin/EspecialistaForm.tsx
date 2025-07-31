import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddCircleOutline, Delete } from "@mui/icons-material";
import type { Disponibilidad, EspecialistaWithUser } from "../../api/especialistaService";
import { getEspecialidades, type Especialidad } from "../../api/especialidadService";

interface EspecialistaFormProps{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<EspecialistaWithUser>) => void;
    initialData?: EspecialistaWithUser;
    loading?: boolean;
}

const DIAS_SEMANA = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    // { value: 7, label: "Domingo" }, 
]

export default function ({
    onClose,
    onSubmit,
    open,
    initialData,
    loading
}: EspecialistaFormProps){
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>(initialData?.especialista?.disponibilidades || []);

    const defaultValues = initialData
    ? {
        username: initialData.user?.username || '',
        email: initialData.user?.email || '',
        role: initialData.user?.role || 'especialista',
        especialistaId: initialData.especialista?.id || '',
        nombre: initialData.especialista?.nombre || '',
        apellido: initialData.especialista?.apellido || '',
        telefono: initialData.especialista?.telefono || '',
        password: initialData.user?.password || '',
        especialidades: initialData.especialista?.especialidad_ids || [],
        isActive: initialData.user?.isActive,
        matriculaProfesional: initialData.especialista?.matricula_profesional || ''
            
    }
    : {
        username: '',
        email: '',
        role: 'especialista',
        especialistaId: '',
        nombre: '',
        apellido: '',
        telefono: '',
        password: '',
        matriculaProfesional: '',
        especialidades: [],
        isActive: true
    };

    const {register, handleSubmit, reset, control, formState: {errors}} = useForm({
        defaultValues
    })

    const obtenerEspecialidades = async () => {
        try{
            const res = await getEspecialidades();
            setEspecialidades(res);
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error')
        }
    }

    useEffect(() => {
        obtenerEspecialidades();
    }, [])

    useEffect(() => {
        setDisponibilidades(
            initialData?.especialista?.disponibilidades || []
        );
        reset(defaultValues);
    }, [initialData, reset, open])

    const handleAddDisponibilidad = () => {
        setDisponibilidades([...disponibilidades, { dia: 0, desde: "08:00", hasta: "12:00" }]);
    };

    const handleChangeDisponibilidad = (idx: number, field: keyof Disponibilidad, value: any) => {
        setDisponibilidades(disponibilidades.map((d, i) =>
            i === idx ? { ...d, [field]: value } : d
        ));
    };

    const handleRemoveDisponibilidad = (idx: number) => {
        setDisponibilidades(disponibilidades.filter((_, i) => i !== idx));
    };

    return(
        <Dialog open={open} onClose={onClose} maxWidth={'md'}>
            <DialogTitle>{initialData ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
            <form onSubmit={handleSubmit((data) => {
                // Transform to PacienteWithUser shape
                const submitData: Partial<EspecialistaWithUser> = {
                    user: {
                        username: data.username,
                        email: data.email,
                        role: data.role,
                        password: data.password,
                        isActive: data.isActive
                    },
                    especialista: {
                        nombre: data.nombre,
                        apellido: data.apellido,
                        telefono: data.telefono,
                        disponibilidades: disponibilidades,
                        especialidad_ids: data.especialidades,
                        matricula_profesional: data.matriculaProfesional
                    }
                };
                onSubmit(submitData);
            })}>
                <DialogContent>
                    <Grid container direction={'row'} spacing={2}>
                        <Grid size={{md:5, xs: 12}} spacing={1}>
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
                                    {...register('password', initialData ? {} : {required: 'Contraseña requerido'})}
                                    error={!!errors.password}
                                    helperText={errors.password?.message?.toString()}
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
                                label='Matricula Profesional'
                                fullWidth
                                size="small"
                                margin="normal"
                                {...register('matriculaProfesional', {required: 'Matricula requerida'})}
                                error={!!errors.matriculaProfesional}
                                helperText={errors.matriculaProfesional?.message?.toString()}
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
                        <Grid size={{md:7, xs: 12}} spacing={1} alignItems={'center'}>
                            <Controller
                                name="especialidades"
                                control={control}
                                render={({ field }) => (
                                    <Box>
                                        <InputLabel>Especialidades</InputLabel>
                                        <Box
                                            sx={{
                                                maxHeight: 150, // altura máxima visible
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
                                                {especialidades.map((esp) => (
                                                    <FormControlLabel
                                                        key={esp.id}
                                                        control={
                                                            <Checkbox
                                                                checked={field.value?.includes(esp.id)}
                                                                onChange={(_, checked) => {
                                                                    const newValue = checked
                                                                        ? [...field.value ?? [], esp.id]
                                                                        : field.value?.filter((id) => id !== esp.id);
                                                                    field.onChange(newValue);
                                                                }}
                                                            />
                                                        }
                                                        label={esp.nombre}
                                                    />
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Box>
                                )}
                            />
                            <Stack spacing={1} mt={1}>
                                <Stack direction='row' alignItems='center' justifyContent='space-between'>
                                    <InputLabel>Disponibilidad</InputLabel>
                                    <IconButton color="primary" onClick={handleAddDisponibilidad} loading={loading}>
                                        <AddCircleOutline />
                                    </IconButton>
                                </Stack>
                                <Box
                                    sx={{
                                        maxHeight: 200, // ajusta según tu preferencia
                                        overflowY: 'auto',
                                        py: 1,
                                        gap: 1,
                                        // Opcional: estilos para la barra de scroll
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
                                        scrollbarWidth: 'thin', // Firefox
                                    }}
                                >

                                    {disponibilidades.map((disp, idx) => (
                                        <Grid container spacing={1} alignItems={'center'} key={idx} mb={1}>
                                            <Grid size={{xs:4}}>
                                                <FormControl fullWidth>
                                                    <InputLabel id={`dia-label-${idx}`}>Dia</InputLabel>
                                                    <Select
                                                        labelId={`dia-label-${idx}`}
                                                        value={disp.dia}
                                                        label="Dia"
                                                        size="small"
                                                        onChange={e => handleChangeDisponibilidad(idx, 'dia', e.target.value)}
                                                    >
                                                        {DIAS_SEMANA.map(d => (
                                                            <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid size={{xs: 3}}>
                                                <TextField
                                                    label="Desde"
                                                    type="time"
                                                    size="small"
                                                    value={disp.desde}
                                                    onChange={e => handleChangeDisponibilidad(idx, "desde", e.target.value)}
                                                    fullWidth
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid size={{xs:3}}>
                                                <TextField
                                                    label="Hasta"
                                                    type="time"
                                                    size='small'
                                                    value={disp.hasta}
                                                    onChange={e => handleChangeDisponibilidad(idx, "hasta", e.target.value)}
                                                    fullWidth
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            </Grid>
                                            <Grid size={{xs:2}}>
                                                <IconButton color="error" onClick={() => handleRemoveDisponibilidad(idx)} disabled={loading}>
                                                    <Delete />
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    ))}
                                </Box>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancelar</Button>
                    <Button type="submit" variant="contained" loading={loading}>
                        {loading ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}