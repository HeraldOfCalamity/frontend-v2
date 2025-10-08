import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputLabel, Link, MenuItem, Select, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { AddCircleOutline, Block, Delete } from "@mui/icons-material";
import { crearInactividad, eliminarInactividad, reverificarInactividad, type Disponibilidad, type EspecialistaWithUser, type Inactividad } from "../../api/especialistaService";
import { getEspecialidades, type Especialidad } from "../../api/especialidadService";
import InputFileUpload from "../InputFileUpload";
import { BASE_URL } from "../../config/benedetta.api.config";
import dayjs from "dayjs";
import ImagePreviewDialog from "../common/ImagePreviewDialog";

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
    
    
    const fmtLocal = (d: string | Date) => dayjs(d).format('YYYY-MM-DDTHH:mm');
    const [openInactividadDialog, setOpenInactividadDialog] = useState(false);
    const initialInacts = (initialData?.especialista?.inactividades || []).map((ia: any) => ({
        desde: fmtLocal(ia.desde),
        hasta: fmtLocal(ia.hasta),
        motivo: ia.motivo || ''
    }));
    const [inactTemp, setInactTemp] = useState<Inactividad>({
        desde: fmtLocal(new Date()),
        hasta: fmtLocal(dayjs().add(2, 'hour').toDate()),
        motivo: ''
    });
    const [inactividades, setInactividades] = useState<Inactividad[]>(initialInacts);

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

    useEffect(() => {
        const mapped = (initialData?.especialista?.inactividades || []).map((ia: any) => ({
            desde: fmtLocal(ia.desde),
            hasta: fmtLocal(ia.hasta),
            motivo: ia.motivo || ''
        }));
        setInactividades(mapped);
    }, [initialData, open]);

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

    const resolveImageSrc = (val?: string) => {
        if (!val) return "";
        if (val.startsWith("data:")) return val;        // base64 del FileReader
        if (val.startsWith("blob:")) return val;        // object URL local
        if (/^https?:\/\//i.test(val)) return val;      // URL firmada absoluta (R2/S3/CDN)
        if (val.startsWith("/")) return `${BASE_URL}${val}`; // ruta relativa tipo /static/...
        // si te llega una KEY S3 (ej. "especialidades/uuid.webp"), pide URL firmada:
        return `${BASE_URL}/especialidades/images/signed-get?key=${encodeURIComponent(val)}`;
    };

    const src = resolveImageSrc(preview ?? initialData?.especialista?.image ?? "");

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
                                {/* -------- INACTIVIDAD -------- */}
                                <Stack spacing={1} mt={3}>
                                <Stack direction='row' alignItems='center' justifyContent='space-between'>
                                    <InputLabel>Inactividad</InputLabel>
                                    <Button
                                    onClick={() => {
                                        setInactTemp({
                                            desde: fmtLocal(new Date()),
                                            hasta: fmtLocal(dayjs().add(2, 'hour').toDate()),
                                            motivo: ''
                                        });
                                        setOpenInactividadDialog(true);
                                    }}
                                        variant="outlined"
                                        color="secondary"
                                        endIcon={<Block />}
                                        disabled={!initialData?.especialista?.id} // requiere especialista creado
                                    >
                                        Agregar inactividad
                                    </Button>
                                </Stack>

                                <Box sx={{ maxHeight: 180, overflowY: 'auto', py: 1 }}>
                                    {(!inactividades || inactividades.length === 0) ? (
                                    <Typography variant="body2" color="text.secondary" textAlign="center">
                                        No hay periodos de inactividad registrados.
                                    </Typography>
                                    ) : (
                                    inactividades.map((ia, idx) => (
                                        <Grid container spacing={1} alignItems="center" key={`${ia.desde}-${ia.hasta}-${idx}`} mb={1}>
                                        <Grid size={{ xs: 5 }}>
                                            <TextField
                                            label="Desde"
                                            type="datetime-local"
                                            size="small"
                                            value={ia.desde}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            onChange={(e) => {
                                                const next = [...inactividades];
                                                next[idx] = { ...ia, desde: e.target.value };
                                                setInactividades(next);
                                            }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 5 }}>
                                            <TextField
                                            label="Hasta"
                                            type="datetime-local"
                                            size="small"
                                            value={ia.hasta}
                                            fullWidth
                                            InputLabelProps={{ shrink: true }}
                                            onChange={(e) => {
                                                const next = [...inactividades];
                                                next[idx] = { ...ia, hasta: e.target.value };
                                                setInactividades(next);
                                            }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 2 }}>
                                            <IconButton
                                                color="error"
                                                onClick={async () => {
                                                const espId = initialData?.especialista?.id;
                                                if (!espId) {
                                                    // caso creación: aún sin especialista -> borra local
                                                    setInactividades(inactividades.filter((_, i) => i !== idx));
                                                    return;
                                                }
                                                const ok = await Swal.fire({
                                                    icon: 'question',
                                                    title: 'Eliminar inactividad',
                                                    text: '¿Deseas quitar este periodo de inactividad?',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'Sí, eliminar',
                                                    cancelButtonText: 'Cancelar'
                                                });
                                                if (!ok.isConfirmed) return;

                                                try {
                                                    const res = await eliminarInactividad(espId, ia);
                                                    if ((res?.removed ?? 0) > 0) {
                                                    setInactividades(inactividades.filter((_, i) => i !== idx));
                                                    await Swal.fire('Listo', 'La inactividad fue eliminada.', 'success');
                                                    } else {
                                                    await Swal.fire('Sin cambios', 'No se encontró la inactividad a eliminar.', 'info');
                                                    }
                                                } catch (e: any) {
                                                    Swal.fire('Error', String(e?.message || e), 'error');
                                                }
                                                }}
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Grid>
                                        {ia.motivo ? (
                                            <Grid size={{ xs: 12 }}>
                                            <Typography variant="caption">Motivo: {ia.motivo}</Typography>
                                            </Grid>
                                        ) : null}
                                        </Grid>
                                    ))
                                    )}
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
            <ImagePreviewDialog
                open={openImagePreviewDialog}
                image={src}
                onClose={() => setOpenImagePreviewDialog(false)}
                alt="Especialista Image"
            />
            {/* Dialog Nueva Inactividad */}
            <Dialog open={openInactividadDialog} onClose={() => setOpenInactividadDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Agregar periodo de inactividad</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={0.5}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                    label="Desde"
                    type="datetime-local"
                    size="small"
                    value={inactTemp.desde}
                    onChange={(e)=> setInactTemp({...inactTemp, desde: e.target.value})}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                    label="Hasta"
                    type="datetime-local"
                    size="small"
                    value={inactTemp.hasta}
                    onChange={(e)=> setInactTemp({...inactTemp, hasta: e.target.value})}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField
                    label="Motivo (opcional)"
                    size="small"
                    value={inactTemp.motivo}
                    onChange={(e)=> setInactTemp({...inactTemp, motivo: e.target.value})}
                    fullWidth
                    />
                </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button color="inherit" onClick={() => setOpenInactividadDialog(false)}>Cerrar</Button>
                <Button
                variant="contained"
                onClick={async () => {
                    try {
                    const espId = initialData?.especialista?.id;
                    if(!espId){
                        await Swal.fire('Primero guarda el especialista', 'Debes crear/guardar el especialista antes de registrar inactividades.', 'info');
                        return;
                    }

                    // 1) Guardar inactividad y verificar citas sin cancelar aún
                    const res = await crearInactividad(espId, inactTemp, false);
                    const total = res?.citas_en_rango ?? 0;

                    if (total > 0) {
                        const r = await Swal.fire({
                        icon: 'warning',
                        title: 'Hay citas en el periodo',
                        text: `Se encontraron ${total} cita(s) dentro del rango seleccionado. ¿Deseas cancelarlas ahora?`,
                        showCancelButton: true,
                        confirmButtonText: 'Sí, cancelar ahora',
                        cancelButtonText: 'No, más tarde'
                        });

                        if (r.isConfirmed) {
                        const res2 = await crearInactividad(espId, inactTemp, true);
                        const canceladas = res2?.citas_canceladas ?? res2?.citas_caceladas ?? 0;
                        await Swal.fire('Listo', `Se cancelaron ${canceladas} cita(s).`, 'success');
                        } else {
                        // 2) Flujo "cancelar después" -> botón que re-verifica antes de cancelar
                        await Swal.fire({
                            icon: 'info',
                            title: 'Cancelar más tarde',
                            html: `
                            <p>Podrás cancelar luego. Antes de cancelar, re-verificaremos cuántas citas siguen en el rango.</p>
                            <button id="cancelar-despues" class="swal2-confirm swal2-styled" style="margin-top:12px">Re-verificar y cancelar ahora</button>
                            `,
                            showConfirmButton: false,
                            didOpen: () => {
                            const btn = document.getElementById('cancelar-despues');
                            if(btn){
                                btn.addEventListener('click', async () => {
                                const rev = await reverificarInactividad(espId, inactTemp);
                                if ((rev?.citas_en_rango ?? 0) > 0) {
                                    const ok = await Swal.fire({
                                    icon: 'question',
                                    title: 'Confirmar cancelación',
                                    text: `Aún hay ${rev.citas_en_rango} cita(s). ¿Cancelar ahora?`,
                                    showCancelButton: true,
                                    confirmButtonText: 'Sí',
                                    cancelButtonText: 'No'
                                    });
                                    if (ok.isConfirmed) {
                                    const res3 = await crearInactividad(espId, inactTemp, true);
                                    const canceladas3 = res3?.citas_canceladas ?? res3?.citas_caceladas ?? 0;
                                    await Swal.fire('Listo', `Se cancelaron ${canceladas3} cita(s).`, 'success');
                                    }
                                } else {
                                    await Swal.fire('Sin cambios', 'Ya no hay citas en el rango.', 'info');
                                }
                                });
                            }
                            }
                        });
                        }
                    } else {
                        await Swal.fire('Listo', 'No se encontraron citas en el periodo. La inactividad fue registrada.', 'success');
                    }

                    // Actualiza la lista visible
                    setInactividades(prev => [...prev, inactTemp]);
                    setOpenInactividadDialog(false);

                    } catch (err: any) {
                    Swal.fire('Error', String(err?.message || err), 'error');
                    }
                }}
                >
                Guardar inactividad
                </Button>
            </DialogActions>
            </Dialog>
        </>
    )
}