import { useEffect, useState } from "react";
import { createEspecialidad, deleteEspecialidad, getEspecialidades, updateEspecialidad, type Especialidad } from "../../api/especialidadService";
import type { Column, TableAction } from "../../components/common/GenericTable";
import { AddCircleOutline, Delete, Edit } from "@mui/icons-material";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import GenericTable from "../../components/common/GenericTable";
import EspecialidadForm from "../../components/admin/EspecialidadForm";
import Swal from "sweetalert2";

export default function EspecialidadesPage(){
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [editData, setEditData] = useState<Especialidad | null>(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme()

    const obtenerEspecialidades = async () => {
        try{
            const especialidades = await getEspecialidades();
            setEspecialidades(especialidades);
        }catch{
            Swal.fire("Error", "Ocurrio un error al obtener las especialidades", 'error');
        }
    }

    const handleEspecialidadFormSubmit = async (data: {nombre: string; descripcion: string}) => {
        setLoading(true);
        try{
            if(editData){ // Editar
                const updated = await updateEspecialidad(editData.id, data);
                await obtenerEspecialidades()
                Swal.fire("Operacion exitosa!", "Especialidad actualizada con exito", "success");
            }else { // Crear
                const created = await createEspecialidad(data);
                await obtenerEspecialidades()
                Swal.fire("Operacion Exitosa!", "Especialidad creada con exito", "success");
            } 
        }catch{
            setEditData(null);
            setOpenForm(false);
            Swal.fire("Error", "Error al guardar", "error");
        }finally{
            setEditData(null);
            setOpenForm(false);
            setLoading(false);
        }
    }

    useEffect(() => {
        try{
            setLoading(true);
            obtenerEspecialidades()
            setLoading(false);
        }catch(err){
            throw err;
        }
    }, []);

    const columns: Column<Especialidad>[] = [
        {field: 'id', headerName: 'Id', align: 'center'},
        {field: 'nombre', headerName: 'Nombre', align: 'center'},
        {field: 'descripcion', headerName: 'Descripcion', align: 'center'}
    ];

    const actions: TableAction<Especialidad>[] = [
        {
            icon: <Edit />,
            label: 'Editar',
            onClick: (row) => {
                setEditData(row);
                setOpenForm(true);
            }
        },
        {
            icon: <Delete />,
            label: 'Eliminar',
            color: 'error',
            onClick: async (row) => {
                const result = await Swal.fire({
                    title: "Estas seguro?",
                    text: `Esta accion eliminara "${row.nombre}". No se puede deshacer.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: theme.palette.primary.main,
                    confirmButtonText: 'Si, eliminar',
                    cancelButtonText: 'Cancelar',
                })

                if(result.isConfirmed){
                    setLoading(true);
                    try {
                        await deleteEspecialidad(row.id)
                        await obtenerEspecialidades();
                        Swal.fire("¡Eliminado!", "El registro fue eliminado.", "success");
                    } catch (e) {
                        Swal.fire("Error", "No se pudo eliminar.", "error");
                    }finally{
                        setLoading(false);
                    }
                }
            }
        }
    ]

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                Gestion de Especialidades
            </Typography>
            <Stack direction='row' justifyContent='flex-end' mb={2}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddCircleOutline />}
                    onClick={() => {
                        setEditData(null);
                        setOpenForm(true);
                    }
                }>
                    Agregar
                </Button>
            </Stack>
            <GenericTable
                columns={columns}
                data={especialidades}
                actions={actions}
            />
            <EspecialidadForm
                open={openForm}
                onClose={() => {
                    setEditData(null);
                    setOpenForm(false);
                }}
                onSubmit={handleEspecialidadFormSubmit}
                initialData={editData || undefined}
                loading={loading}
            />
        </Box>
    )
}