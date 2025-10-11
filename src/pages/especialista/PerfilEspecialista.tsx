import { Box, Button, Chip, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useUserProfile } from "../../context/userProfileContext";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { updateEspecialistaPerfil, type EspecialistaWithUser } from "../../api/especialistaService";
import InputFileUpload from "../../components/InputFileUpload";
import { getEspecialidades, type Especialidad } from "../../api/especialidadService";
import { BASE_URL } from "../../config/benedetta.api.config";

const DIAS_SEMANA = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" }, 
]

export default function PerfilEspecialista(){
    const {profile, reloadProfile} = useUserProfile();
    const especialista = profile as EspecialistaWithUser;
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(especialista?.especialista.image || '');
    const [openDisponibilidades,setOpenDisponibilidades] = useState(false);
    const [openEspecialidades, setOpenEspecialidades] = useState(false)
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);

    const { register, handleSubmit, formState: { errors }, setValue } = useForm({
        defaultValues: {
            phone: especialista?.user.phone,
            image: especialista?.especialista.image,
            informacion: especialista?.especialista.informacion
        }
    });
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoading(true)
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Aquí puedes guardarlo en el estado, o mandarlo directo en el submit:
                // setPreview(base64String);
                console.log('base64', base64String);
                
                setValue("image", base64String);
                setPreview(base64String)
            };
            reader.readAsDataURL(file);
        }
        setLoading(false)
    };

    

    const onUpdateData = async ({
        phone, 
        image, 
        informacion
    } : {
        phone: string, 
        image: string, 
        informacion: string
    }) => {
        setLoading(true);
        try{
            await updateEspecialistaPerfil(especialista.especialista.id || '', {
                user: {
                    ...especialista.user,
                    phone,
                },
                especialista:{
                    ...especialista.especialista,
                    informacion,
                    image
                }
            })
            Swal.fire(
                'Éxito',
                'Modifiación exitosa',
                'success'
            )
            reloadProfile()
            setPreview(especialista.especialista.image || '')
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )

        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        const obtenerEspecialidades = async () => {
            try{
                const espd = await getEspecialidades();
                setEspecialidades(espd);
            }catch (err: any){
                Swal.fire(
                    'Error',
                    `${err}`,
                    'error'
                )
            }
        }
        obtenerEspecialidades()
        console.log('imageurl:',`${BASE_URL}${preview}`)
    }, [])

    useEffect(() => {
        console.log('image preview', preview);
        console.log('condition', especialista.especialista.image ? `${BASE_URL}${preview}` : preview || '');
        
    }, [preview])
    const resolveImageSrc = (val?: string) => {
        if (!val) return "";
        if (val.startsWith("data:")) return val;        // base64 del FileReader
        if (val.startsWith("blob:")) return val;        // object URL local
        if (/^https?:\/\//i.test(val)) return val;      // URL firmada absoluta (R2/S3/CDN)
        if (val.startsWith("/")) return `${BASE_URL}${val}`; // ruta relativa tipo /static/...
        // si te llega una KEY S3 (ej. "especialidades/uuid.webp"), pide URL firmada:
        return `${BASE_URL}/especialidades/images/signed-get?key=${encodeURIComponent(val)}`;
    };


    return(
        <Box display={'flex'} flexDirection={'column'} flexGrow={1} justifyContent={'center'}>
            <Typography variant="h4" fontWeight={600}  mb={7} textAlign='center'>
                Tus Datos Personales
            </Typography>
                

            <form onSubmit={handleSubmit((values) => onUpdateData({
                image:values.image ?? '',
                informacion: values.informacion ?? '',
                phone: values.phone ?? ''
            }))}>
  

        
                <Grid container spacing={2} display={'flex'} direction={'row'} mb={2}>
                    <Grid container size={{xs:12, md:6}} direction={'column'}>
                        <Grid size={12} display={'flex'} flexDirection={'column'} alignItems={'center'} flexGrow={1} justifyContent={'center'}> 
                            <Box
                                component={'img'}
                                src={resolveImageSrc(preview)}
                                alt={`Imagen Perfil ${especialista.user.name} ${especialista.user.lastname}`}
                                sx={{height:'50vh', borderRadius: 2, border:1}}
                            />
                            <InputLabel>Fotografia Personal</InputLabel>
                            <InputFileUpload 
                                label="Subir Fotografia" 
                                fullWidth
                                color="info"
                                handleChange={handleImageChange} 
                                accept="image/"
                                variant={'outlined'}
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="Información"
                                fullWidth
                                multiline
                                rows={4}
                                variant="filled"
                                {...register('informacion')}
                                error={!!errors.informacion}
                                helperText={errors.informacion?.toString()}
                                disabled={loading}
                            />
                        </Grid>
                    </Grid>
                    <Grid direction={'column'} size={{xs:12, md:6}} container spacing={2}>
                    <Box
                        sx={{
                            maxHeight: '55vh',
                            overflowY: 'auto',
                            pr: 2,
                        }}
                    >
                            <Grid container size={12} spacing={2} pt={1}>
                                <Grid size={{xs:12, md: 6}} >
                                    <TextField label="Nombre" size="small" fullWidth value={especialista.user.name} slotProps={{
                                        input:{
                                            readOnly: true
                                        }
                                    }} />
                                </Grid>
                                <Grid size={{xs:12, md:6}} >
                                    <TextField label="Apellido" size="small" fullWidth value={especialista.user.lastname} slotProps={{
                                        input:{
                                            readOnly: true
                                        }
                                    }}  />
                                </Grid>
                                <Grid size={{xs:12, md:6}} >
                                    <TextField label="Correo" size="small" fullWidth value={especialista.user.email} slotProps={{
                                        input:{
                                            readOnly: true
                                        }
                                    }}  />
                                </Grid>
                                <Grid size={{xs:12, md:6}} >
                                    <TextField label="CI" size="small" fullWidth value={especialista.user.ci} slotProps={{
                                        input:{
                                            readOnly: true
                                        }
                                    }}  />
                                </Grid>
                                <Grid size={{xs:12, md:6}} >
                                    <TextField label="Creado el" size="small" fullWidth value={dayjs(especialista.user.createdAt).format('DD/MM/YYYY')} slotProps={{
                                        input:{
                                            readOnly: true
                                        }
                                    }}  />
                                </Grid>
                                <Grid size={{xs:12, md:6}} >
                                    <TextField label="Última actualización" size="small" fullWidth value={dayjs(especialista.user.updatedAt).format('DD/MM/YYYY')} slotProps={{
                                        input:{
                                            readOnly: true
                                        }
                                    }}  />
                                </Grid>
                                <Grid size={{xs:12, md:6}} >
                                    <TextField
                                        label="Teléfono"
                                        type="number"
                                        size="small"
                                        fullWidth
                                        {...register('phone', {
                                            required: 'Teléfono requerido',
                                            validate: (value: string | undefined) => {
                                            if (!value) return 'Debe ingresar un número';
                                            const parsed = parseInt(value);
                                            if (isNaN(parsed) || parsed.toString() !== value) return 'Debe ingresar solo números';
                                            return true;
                                            }
                                        })}
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message?.toString()}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <Button 
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => setOpenDisponibilidades(v => !v)}
                                        sx={{
                                            mb:2
                                        }}
                                    >
                                        Mostrar Disponibilidad
                                    </Button>
                                    <Box
                                        sx={{
                                            maxHeight: 200, // ajusta según tu preferencia
                                            overflowY: 'auto',
                                            py: 1,
                                            gap: 1,
                                            display: !openDisponibilidades ? 'None' : ''
                                        }}
                                    >

                                        {especialista.especialista.disponibilidades?.map((disp, idx) => (
                                            <Grid container spacing={1} alignItems={'center'} key={idx} mb={1}>
                                                <Grid size={{xs:4}}>
                                                    <FormControl fullWidth>
                                                        <InputLabel id={`dia-label-${idx}`}>Dia</InputLabel>
                                                        <Select
                                                            labelId={`dia-label-${idx}`}
                                                            value={disp.dia}
                                                            label="Dia"
                                                            size="small"
                                                            readOnly
                                                        >
                                                            {DIAS_SEMANA.map(d => (
                                                                <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid size={{xs: 4}}>
                                                    <TextField
                                                        label="Desde"
                                                        type="time"
                                                        size="small"
                                                        value={disp.desde}
                                                        fullWidth
                                                        slotProps={{
                                                            inputLabel:{
                                                                shrink: true
                                                            },
                                                            input: {
                                                                readOnly: true
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid size={{xs:4}}>
                                                    <TextField
                                                        label="Hasta"
                                                        type="time"
                                                        size='small'
                                                        value={disp.hasta}
                                                        fullWidth
                                                        slotProps={{
                                                            inputLabel:{
                                                                shrink: true
                                                            },
                                                            input: {
                                                                readOnly: true
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        ))}
                                    </Box>
                                </Grid>
                                <Grid size={12}>
                                    <Button 
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => setOpenEspecialidades(v => !v)}
                                        sx={{
                                            mb:2
                                        }}
                                    >
                                        Mostrar Especialidades
                                    </Button>
                                    <Box
                                        sx={{
                                            maxHeight: 200, // ajusta según tu preferencia
                                            overflowY: 'auto',
                                            py: 1,
                                            gap: 1,
                                            display: !openEspecialidades ? 'None' : ''
                                        }}
                                    >

                                        {especialista.especialista.especialidad_ids?.map((esp, idx) => (
                                            <Chip key={esp} label={especialidades.find(e => e.id === esp)?.nombre} sx={{
                                                fontSize: '1.1rem',
                                                m:1
                                            }}/>
                                        ))}
                                    </Box>
                                </Grid>
                            </Grid>
                    </Box>
                        </Grid>
                </Grid>
                <Box display={'flex'} justifyContent={'end'} >
                    <Button type="submit" variant="contained" loading={loading}>
                        {loading ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                </Box>
            </form>
        </Box>
        
    )
}