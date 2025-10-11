import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useUserProfile } from "../../context/userProfileContext";
import PacienteForm from "../../components/admin/PacienteForm";
import { updatePacientePerfil, type PacienteWithUser } from "../../api/pacienteService";
import dayjs from "dayjs";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { useState } from "react";

export default function PerfilPaciente(){
    const {profile, reloadProfile} = useUserProfile();
    const paciente = profile as PacienteWithUser;
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            phone: profile?.user.phone
        }
    });

    const onUpdatePhone = async (phone: string) => {
        setLoading(true);
        try{
            await updatePacientePerfil(paciente.paciente.id || '', {
                user: {
                    ...paciente.user,
                    phone
                },
                paciente:{
                    ...paciente.paciente
                }
            })
            Swal.fire(
                'Éxito',
                'Modifiación exitosa',
                'success'
            )
            reloadProfile()
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
    return(
        <Box display={'flex'} flexDirection={'column'} flexGrow={1}>
            <Typography variant="h4" fontWeight={600} color="primary" mb={7} textAlign='center'>
                Tus Datos Personales
            </Typography>
                

      <form onSubmit={handleSubmit((values) => onUpdatePhone(values.phone || ''))}>
        <Grid container spacing={2}>
          <Grid size={{xs:12, md:6}} >
            <TextField label="Nombre" fullWidth value={paciente?.user?.name} slotProps={{
                input:{
                    readOnly: true
                }
            }} />
          </Grid>
          <Grid size={{xs:12, md:6}} >
            <TextField label="Apellido" fullWidth value={paciente?.user?.lastname} slotProps={{
                input:{
                    readOnly: true
                }
            }}  />
          </Grid>
          <Grid size={{xs:12, md:6}} >
            <TextField label="Correo" fullWidth value={paciente?.user?.email} slotProps={{
                input:{
                    readOnly: true
                }
            }}  />
          </Grid>
          <Grid size={{xs:12, md:6}} >
            <TextField label="CI" fullWidth value={paciente?.user?.ci} slotProps={{
                input:{
                    readOnly: true
                }
            }}  />
          </Grid>
          <Grid size={{xs:12, md:6}} >
            <TextField label="Tipo de Sangre" fullWidth value={paciente.paciente.tipo_sangre} slotProps={{
                input:{
                    readOnly: true
                }
            }}  />
          </Grid>
          <Grid size={{xs:12, md:6}} >
            <TextField label="Fecha de Nacimiento" fullWidth value={dayjs(paciente.paciente.fecha_nacimiento).format('DD/MM/YYYY')} slotProps={{
                input:{
                    readOnly: true
                }
            }}  />
          </Grid>
          <Grid size={{xs:12, md:6}} >
            <TextField label="Creado el" fullWidth value={dayjs(paciente?.user?.createdAt).format('DD/MM/YYYY')} slotProps={{
                input:{
                    readOnly: true
                }
            }}  />
          </Grid>
          <Grid size={{xs:12, md:6}} >
            <TextField label="Última actualización" fullWidth value={dayjs(paciente?.user?.updatedAt).format('DD/MM/YYYY')} slotProps={{
                input:{
                    readOnly: true
                }
            }}  />
          </Grid>
          <Grid size={{xs:12, md:6}} >
            <TextField
              label="Teléfono"
              type="number"
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
          <Grid size={{xs:12}}>
            <Button type="submit" variant="contained" loading={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </Grid>
        </Grid>
      </form>
        </Box>
    )
}