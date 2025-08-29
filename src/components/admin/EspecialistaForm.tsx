import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputLabel, Link, MenuItem, Select, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddCircleOutline, Delete } from "@mui/icons-material";
import type { Disponibilidad, EspecialistaWithUser } from "../../api/especialistaService";
import { getEspecialidades, type Especialidad } from "../../api/especialidadService";
import InputFileUpload from "../InputFileUpload";
import { BASE_URL } from "../../config/benedetta.api.config";

export type EspecialistaFormField = "name"
 | "lastname"
 | "email"
 | "phone"
 | "ci"
 | "isActive"
 | "informacion"
 | "especialidades"
 | "disponibilidades"
 | "image"
 | "save"
 | "password"
 

interface EspecialistaFormProps{
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<EspecialistaWithUser>) => void;
    initialData?: EspecialistaWithUser;
    disabledFields?: EspecialistaFormField[];
    loading?: boolean;
}

const DIAS_SEMANA = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" }, 
]

export default function ({
    onClose,
    onSubmit,
    open,
    initialData,
    loading,
    disabledFields
}: EspecialistaFormProps){
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [disponibilidades, setDisponibilidades] = useState<Disponibilidad[]>(initialData?.especialista?.disponibilidades || []);
    const [disponibilidadError, setDisponibilidadError] = useState('');
    const [openImagePreviewDialog, setOpenImagePreviewDialog] = useState(false);

    const defaultValues = initialData
    ? {
        // username: initialData.user?.username || '',
        email: initialData.user?.email || '',
        role: initialData.user?.role || 'especialista',
        especialistaId: initialData.especialista?.id || '',
        name: initialData.user?.name || '',
        lastname: initialData.user?.lastname || '',
        phone: initialData.user?.phone || '',
        ci: initialData.user?.phone || '',
        password: initialData.user?.password || '',
        especialidades: initialData.especialista?.especialidad_ids || [],
        isActive: initialData.user?.isActive,
        informacion: initialData.especialista?.informacion || '',
        image: initialData.especialista?.image || '',
        isVerified: initialData.user?.isVerified || true as boolean
            
    }
    : {
        // username: '',
        email: '',
        role: 'especialista',
        especialistaId: '',
        name: '',
        lastname: '',
        phone: '',
        ci: '',
        password: '',
        informacion: '',
        image: '',
        especialidades: [],
        isActive: true,
        isVerified: true as boolean
    };

    const {register, handleSubmit, reset, control, formState: {errors}, setValue} = useForm({
        defaultValues
    })

    const isDisabled = (field: EspecialistaFormField) => 
        disabledFields?.includes(field);

    const [preview, setPreview] = useState<string | null>(defaultValues.image || null);
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Aquí puedes guardarlo en el estado, o mandarlo directo en el submit:
                // setPreview(base64String);
                setValue("image", base64String);
                setPreview(base64String)
            };
            reader.readAsDataURL(file);
        }
    };

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
        setDisponibilidadError('');
        setPreview(defaultValues?.image || '')
        reset(defaultValues);
    }, [initialData, reset, open])

    const handleAddDisponibilidad = () => {
        setDisponibilidades([...disponibilidades, { dia: 1, desde: "08:00", hasta: "12:00" }]);
    };

    const handleChangeDisponibilidad = (idx: number, field: keyof Disponibilidad, value: any) => {
        const updatedDisponibilidades = disponibilidades.map((d, i) =>
            i === idx ? { ...d, [field]: value } : d
        );

        const hasDuplicates = updatedDisponibilidades.some((d1, i1) =>
            updatedDisponibilidades.findIndex((d2, i2) => 
                i1 !== i2 && d1.dia === d2.dia && d1.desde === d2.desde && d1.hasta === d2.hasta
            ) !== -1
        );

        const currentDisp = updatedDisponibilidades[idx];
        const isInvalidTime = currentDisp.desde >= currentDisp.hasta;

        if(hasDuplicates){
            setDisponibilidadError('Ya existe una disponibilidad para ese día y hora');
        }else if (isInvalidTime){
            setDisponibilidadError('La hora de inicio debe ser menor que la hora de fin');
        }else{
            setDisponibilidadError('');
        }

        setDisponibilidades(updatedDisponibilidades);
    };

    const handleRemoveDisponibilidad = (idx: number) => {
        setDisponibilidades(disponibilidades.filter((_, i) => i !== idx));
        setDisponibilidadError('');
    };

    return(
        <>
            <Dialog open={open} onClose={onClose} maxWidth={'lg'}>
                <DialogTitle>{initialData ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
                <form onSubmit={handleSubmit((data) => {
                    const isEspecialidadesEmpty = data.especialidades.length === 0;
                    const isDisponibilidadesEmpty = disponibilidades.length === 0;

                    const hasDuplicates = disponibilidades.some((d1, i1) =>
                        disponibilidades.findIndex((d2, i2) =>
                            i1 !== i2 && d1.dia === d2.dia && d1.desde === d2.desde && d1.hasta === d2.hasta
                        ) !== -1
                    );
                    const hasInvalidTime = disponibilidades.some(d => d.desde === d.hasta);

                    if (hasDuplicates) {
                        setDisponibilidadError('No se pueden guardar dos disponibilidades iguales.');
                        return;
                    }
                    if (hasInvalidTime) {
                        setDisponibilidadError('El tiempo "desde" no puede ser igual a "hasta".');
                        return;
                    }
                    if(isEspecialidadesEmpty) {
                        setDisponibilidadError('Debe seleccionar al menos una especialidad.');
                        return;
                    }
                    if(isDisponibilidadesEmpty) {
                        setDisponibilidadError('Debe seleccionar al menos una disponibilidad.');
                        return;
                    }

                    // Transform to PacienteWithUser shape
                    const submitData: Partial<EspecialistaWithUser> = {
                        user: {
                            name: data.name,
                            lastname: data.lastname,
                            ci: data.ci,
                            phone: data.phone,
                            email: data.email,
                            role: data.role,
                            password: data.password,
                            isActive: data.isActive,
                            isVerified: true
                        },
                        especialista: {
                            disponibilidades: disponibilidades,
                            especialidad_ids: data.especialidades,
                            informacion: data.informacion,
                            image: data.image   
                        }
                    };
                    onSubmit(submitData);
                })}>
                    <DialogContent>
                        <Grid container direction={'row'} spacing={2}>
                            <Grid size={{md:5, xs: 12}} spacing={1}>
                                <TextField
                                    label='Nombres:'
                                    fullWidth
                                    size="small"
                                    margin="normal"
                                    disabled={isDisabled('name')}
                                    {...register('name', {required: 'Nombre requerido'})}
                                    error={!!errors.name}
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
                                    disabled={isDisabled('email')}
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
                                        disabled={isDisabled('password')}
                                        {...register('password', initialData ? {} : {required: 'Contraseña requerido'})}
                                        error={!!errors.password}
                                        helperText={errors.password?.message?.toString()}
                                    />  
                                ) : null}
                                <TextField
                                    label='Teléfono'
                                    type="number"
                                    fullWidth
                                    size="small"
                                    margin="normal"
                                    disabled={isDisabled('phone')}
                                    {...register('phone', {
                                        required: 'Teléfono requerido', 
                                        validate: (value: string | undefined) => {
                                            if (value === undefined) return 'El valor no puede ser vacío';

                                            const parsed = parseInt(value);
                                            if(isNaN(parsed) || parsed.toString() !== value) return 'El valor ingresado debe ser un numero de teléfono';
                                            return true;
                                        }}
                                    )}
                                    error={!!errors.phone}
                                    helperText={errors.phone?.message?.toString()}
                                    
                                />
                                <TextField
                                    label='CI'
                                    type="number"
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
                                        }
                                    })}
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
                                <TextField
                                    label='Informacion Laboral'
                                    fullWidth
                                    variant="filled"
                                    multiline
                                    rows={4}
                                    size="small"
                                    margin="normal"
                                    disabled={isDisabled('informacion')}
                                    {...register('informacion')}
                                    error={!!errors.informacion}
                                    helperText={errors.informacion?.message?.toString()}
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
                                                                    disabled={isDisabled('especialidades')}
                                                                    color="secondary"
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
                                <Stack mt={1} spacing={1}>
                                    <InputLabel>Fotografia Personal</InputLabel>
                                    <InputFileUpload 
                                        label="Subir Fotografia" 
                                        handleChange={handleImageChange} 
                                        accept="image/"
                                        color="secondary"
                                        disabled={isDisabled('image')}
                                        variant={'outlined'}
                                    />
                                    {preview && <Link 
                                        component={'button'} 
                                        type="button"
                                        color="secondary"
                                        textAlign={'center'} 
                                        onClick={() => setOpenImagePreviewDialog(true)}>
                                        Ver imagen cargada
                                    </Link>}
                                </Stack>
                                <Stack spacing={1} mt={1}>
                                    <Stack direction='row' alignItems='center' justifyContent='space-between'>
                                        <InputLabel>Disponibilidad</InputLabel>
                                        <Button
                                            loading={loading}
                                            onClick={handleAddDisponibilidad}
                                            variant="outlined"
                                            color="secondary"
                                            disabled={isDisabled('disponibilidades')}
                                            endIcon={<AddCircleOutline />}
                                        >
                                            Agregar
                                        </Button>
                                    </Stack>
                                    {disponibilidadError && 
                                        <Typography 
                                            textAlign={'center'}
                                            color="error"
                                            variant="body2"

                                        >
                                            {disponibilidadError}
                                        </Typography>
                                    }
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
                                                            disabled={isDisabled('disponibilidades')}
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
                                                        disabled={isDisabled('disponibilidades')}
                                                        value={disp.desde}
                                                        onChange={e => handleChangeDisponibilidad(idx, "desde", e.target.value)}
                                                        fullWidth
                                                        slotProps={{
                                                            inputLabel:{
                                                                shrink: true
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid size={{xs:3}}>
                                                    <TextField
                                                        label="Hasta"
                                                        type="time"
                                                        size='small'
                                                        disabled={isDisabled('disponibilidades')}
                                                        value={disp.hasta}
                                                        onChange={e => handleChangeDisponibilidad(idx, "hasta", e.target.value)}
                                                        fullWidth
                                                        slotProps={{
                                                            inputLabel:{
                                                                shrink: true
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid size={{xs:2}}>
                                                    <IconButton 
                                                        color="error" 
                                                        onClick={() => handleRemoveDisponibilidad(idx)} 
                                                        disabled={isDisabled('disponibilidades')}
                                                    >
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
                        <Button type="submit" variant="contained" loading={loading} disabled={isDisabled('save')}>
                            {loading ? "Guardando..." : "Guardar"}
                        </Button>
                        <Button variant="contained" color="error" onClick={onClose}>Cancelar</Button>
                    </DialogActions>
                </form>
            </Dialog>
            <Dialog
                open={openImagePreviewDialog}
                onClose={() => setOpenImagePreviewDialog(false)}
            >
                <DialogTitle>
                    Imagen Cargada
                </DialogTitle>
                <DialogContent>
                    <img height={210} src={initialData ? `${BASE_URL}${preview}` : preview || ''} alt="Especialista Image"/>
                </DialogContent>
                <DialogActions>
                    <Button color="error" variant="contained" onClick={() => setOpenImagePreviewDialog(false)}>Cerrar</Button>
                </DialogActions>
            </Dialog>
        </>
    )
}