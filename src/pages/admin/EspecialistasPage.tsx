import { AddCircleOutline, CalendarMonth, Circle, Delete, Edit } from "@mui/icons-material";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import EspecialistaForm, { type EspecialistaFormField } from "../../components/admin/EspecialistaForm";
import { useEffect, useMemo, useState } from "react";
import { createEspecialistaPerfil, deleteEspecialista, getEspecialistasWithUser, updateEspecialistaPerfil, type Disponibilidad, type EspecialistaWithUser } from "../../api/especialistaService";
import Swal from "sweetalert2";
import type { Column, TableAction } from "../../components/common/GenericTable";
import dayjs from "dayjs";
import GenericTable from "../../components/common/GenericTable";
import { getEspecialidades, type Especialidad } from "../../api/especialidadService";
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';


const DIAS_SEMANA = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 0, label: "Domingo" }, 
]


export default function EspecialistasPage(){
    const [openEspecialistaForm, setOpenEspecialistaForm] = useState(false);
    const [editData, setEditData] = useState<EspecialistaWithUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [especialsitas, setEspecialsitas] = useState<EspecialistaWithUser[]>([])
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [disabledFields, setDisabledFields] = useState<EspecialistaFormField[]>([]);
    const theme = useTheme();

    const adaptedData = useMemo(() => especialsitas.map(e => ({
        id: e.especialista.id,  // o e.especialista.id si lo prefieres
        name: e.user.name,
        lastname: e.user.lastname,
        email: e.user.email,
        role: e.user.role,
        isActive: e.user.isActive,
        isVerified: e.user.isVerified,
        createdAt: e.user.createdAt,
        especialidades: [...(e.especialista.especialidad_ids as string[])?.map(id => 
            especialidades.find(e => e.id === id)?.nombre
        )],
        disponibilidades: [...(e.especialista.disponibilidades as Disponibilidad[])?.map(disp => {
            const foundedDay = DIAS_SEMANA.find(day => day.value === disp.dia);
            return {
                ...disp,
                dia: foundedDay?.label || '',
            }
        })],
        raw: e, // por si necesitas acceder al objeto completo más tarde
    })), [especialsitas, especialidades]);

    const handleAddEspecialistaClick = () => {
        setOpenEspecialistaForm(true);
    }

    const handleEspecialistaFormSubmit = async (data: Partial<EspecialistaWithUser>) => {
        setLoading(true);
        try{
            if(editData){ // Editar
                const { especialista } = editData as EspecialistaWithUser;
                await updateEspecialistaPerfil(especialista.id!, data);
                await obtenerEspecialistas();
                Swal.fire(
                    "Operacion exitosa!", 
                    "Usuario actualizado con exito", 
                    "success"
                );
            } else { // Crear
                await createEspecialistaPerfil(data);
                await obtenerEspecialistas();
                Swal.fire(
                    "Operacion Exitosa!", 
                    "Usuario creado con exito", 
                    "success"
                );
            }
            setEditData(null);
            setOpenEspecialistaForm(false);
        }catch(err: any){
            Swal.fire(
                "Error", 
                `${err}`, 
                "error"
            );
        }finally{
            setLoading(false);
        }
    }

    const columns: Column<any>[] = [
        {field: 'name', headerName: 'Nombres', align: 'center'},
        {field: 'lastname', headerName: 'Apellidos', align: 'center'},
        {
            field: 'especialidades', 
            headerName: 'Especialidades', 
            align: 'center', 
            render: (v) => {
                return <Box>
                    {(v as string[]).map(item => 
                        <Box textAlign={'left'} mb={1}>
                            {item}
                        </Box>
                    )}
                </Box>
            }
        },
        {
            field: 'disponibilidades', 
            headerName: 'Disponibilidades', 
            align: 'center',
            render: (v) => {
                const disp = v as Disponibilidad[];
                return (
                    <Box display={'flex'} flexDirection={'column'}>
                        {disp.map(dis => 
                            <Box display={'flex'} textAlign={'left'} mb={1} alignItems={'center'}>
                                <CalendarMonth color="primary" sx={{mr: 1}} /> {dis.dia}: {dis.desde} - {dis.hasta}
                            </Box>
                        )}
                    </Box>
                )
            }
        },
        {
            field: 'createdAt', 
            headerName: 'Agregado el', 
            align: 'center',
            render: (v) => dayjs(v).format('DD/MM/YYYY')
        },
        {
            field: 'isActive', 
            headerName: 'Activo', 
            align: 'center', 
            render: (v) => 
                <Circle fontSize="small" color={v ? "success" : "error"} />
        },
    ];

    const editarEspecialista = async (row: any) => {
        const esp = especialsitas.find(e => e.especialista.id === row.id);
        setEditData(esp || null);
        setOpenEspecialistaForm(true);
    }

    const eliminarEspecialista = async (row: any) => {
        try{
            console.log(row)
            const result = await Swal.fire({
                title: "Estas seguro?",
                text: `Esta accion desactivará a "${row.name} ${row.lastname} como especialista". No se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: theme.palette.primary.main,
                confirmButtonText: 'Si, eliminar',
                cancelButtonText: 'Cancelar',
            })
            if(result.isConfirmed){
                await deleteEspecialista(row.id)
                await obtenerEspecialistas();
                Swal.fire("¡Eliminado!", "El registro fue eliminado.", "success");
            }
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }

    const handleShowEspecialista = (row: any) => {
        const esp = especialsitas.find(e => e.especialista.id === row.id);
        setDisabledFields([
            "ci", "disponibilidades", "email", "especialidades", "image", "informacion","isActive", "lastname", "name","password", "phone", "save"
        ])
        setEditData(esp || null);
        setOpenEspecialistaForm(true);
    }

    const actions: TableAction<any>[] = [
        {
            icon: <VisibilityOutlinedIcon color="success"/>,
            label: 'Editar',
            onClick: (userRow) => handleShowEspecialista(userRow)
        },
        {
            icon: <Edit color="info"/>,
            label: 'Editar',
            onClick: (userRow) => editarEspecialista(userRow)
        },
        {
            icon: <Delete />,
            label: 'Eliminar',
            color: 'error',
            onClick: (userRow) => eliminarEspecialista(userRow) /*eliminarEspecialista(userRow)*/
        }
    ]

    const obtenerEspecialistas = async () => {
        try{
            const data = await getEspecialistasWithUser();
            setEspecialsitas(data);
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }

    useEffect(() => {
        const obtenerEspecialidades = async () => {
            try{
                const esp = await getEspecialidades();
                setEspecialidades(esp)
            }catch(err: any){
                Swal.fire(
                    'Error',
                    `${err}`,
                    'error'
                )
            }
        }
        obtenerEspecialidades()
        obtenerEspecialistas();
    }, [])

    return(
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                    Gestion de Usuarios
                </Typography>
                <Stack direction='row' justifyContent='flex-end' mb={2}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddEspecialistaClick}
                    >
                        Agregar
                    </Button>
                </Stack>
                <Stack spacing={5}>
                    <GenericTable
                        columns={columns}
                        data={adaptedData}
                        actions={actions}
                        canExportExcel
                        canExportPdf
                    />
                </Stack>
                <EspecialistaForm
                    open={openEspecialistaForm}
                    onClose={() => {
                        setEditData(null);
                        setOpenEspecialistaForm(false);
                    }}
                    disabledFields={disabledFields}
                    onSubmit={handleEspecialistaFormSubmit}
                    initialData={editData as EspecialistaWithUser || undefined}
                    loading={loading}
                />
        </Box>
    )
}
