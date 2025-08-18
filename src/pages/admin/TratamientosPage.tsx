import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import GenericTable, { type Column, type TableAction } from "../../components/common/GenericTable";
import TratamientoForm from "../../components/admin/TratamientoForm";
import { useEffect, useState } from "react";
import { AddCircleOutline, Delete, Edit } from "@mui/icons-material";
import { createTratamiento, deleteTratamiento, getTratamientos, updateTratamiento, type Tratamiento } from "../../api/tratamientoService";
import Swal from "sweetalert2";

export default function TratamientosPage(){
    const [openTratamientoForm ,setOpenTratamientoForm] = useState(false);
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [editData, setEditData] = useState<Tratamiento | null>(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme()
    
    const obtenerTratamientos = async () => {
        setLoading(true);
        try{
            const tratamientos = await getTratamientos();
            setTratamientos(tratamientos);
        }catch(err: any){
            Swal.fire("Error", `${err}`, 'error');
        }finally{
            setLoading(false);
        }
    }

    const handleTratamientoFormSubmit = async (data: Partial<Tratamiento>) => {
        setLoading(true);
        try{
            if(editData){ // Editar
                const updated = await updateTratamiento(editData.id, data);
                await obtenerTratamientos()
            }else { // Crear
                const created = await createTratamiento(data);
                await obtenerTratamientos()
            } 
            setEditData(null);
            setOpenTratamientoForm(false);
            Swal.fire("Operacion Exitosa!", "Datos guardados con exito", "success");
        }catch(err: any){
            Swal.fire("Error", `${err}`, "error");
        }finally{
            setLoading(false);
        }
    }
    const columns: Column<Tratamiento>[] = [
        {field: 'nombre', headerName: 'Nombre', align: 'center'},
        {
            field: 'descripcion',
            headerName: 'Descripción',
            align: 'center',
            render: (v: string) => (
                <Box
                    sx={{
                        maxWidth: { xs: 150, sm: 250, md: 350 },
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        mx: 'auto',
                        textAlign: 'left',
                    }}
                >
                    {v ? v : 'Sin Descripcion'}
                </Box>
            ),
        },
        {field: 'image', headerName: 'Imagen', align: 'center', render: (image) => {
            return image 
                ? <img src={image} alt="imagen" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                : 'Sin Imagen'
        }},
    ];

    const actions: TableAction<Tratamiento>[] = [
        {
            icon: <Edit color="info"/>,
            label: 'Editar',
            onClick: (row) => {
                console.log('row, edit tratamientos',row)
                setEditData(row);
                setOpenTratamientoForm(true);
            }
        },
        {
            icon: <Delete />,
            label: 'Eliminar',
            color: 'error',
            onClick: async (row) => {
                const result = await Swal.fire({
                    title: "Estas seguro?",
                    text: `Esta accion eliminara el tratamiento"${row.nombre}". No se puede deshacer.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: theme.palette.primary.main,
                    confirmButtonText: 'Si, eliminar',
                    cancelButtonText: 'Cancelar',
                })

                if(result.isConfirmed){
                    setLoading(true);
                    try {
                        await deleteTratamiento(row.id)
                        await obtenerTratamientos();
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

    useEffect(() => {
        obtenerTratamientos()
    }, []);

    return(
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                Tratamientos
            </Typography>
            <Stack direction='row' justifyContent='flex-end' mb={2}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddCircleOutline />}
                    onClick={() => {
                        setEditData(null);
                        setOpenTratamientoForm(true);
                    }
                }>
                    Agregar
                </Button>
            </Stack>
            <GenericTable
                columns={columns}
                data={tratamientos}
                actions={actions}
                canExportExcel
                canExportPdf
            />
            <TratamientoForm
                open={openTratamientoForm}
                onClose={() => setOpenTratamientoForm(false)}
                onSubmit={handleTratamientoFormSubmit}
                initialData={editData || {}}
            />
        </Box>
    )
}