import { useEffect, useState } from "react";
import { createEspecialidad, deleteEspecialidad, getEspecialidades, updateEspecialidad, type Especialidad } from "../../api/especialidadService";
import type { Column, TableAction } from "../../components/common/GenericTable";
import { AddCircleOutline, Delete, Edit } from "@mui/icons-material";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import GenericTable from "../../components/common/GenericTable";
import EspecialidadForm from "../../components/admin/EspecialidadForm";
import Swal from "sweetalert2";
import { getTratamientos, type Tratamiento } from "../../api/tratamientoService";
import MedicalInformationOutlinedIcon from '@mui/icons-material/MedicalInformationOutlined';
import { BASE_URL } from "../../config/benedetta.api.config";

export default function EspecialidadesPage(){
    const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [editData, setEditData] = useState<Especialidad | null>(null);
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
    const [loading, setLoading] = useState(false);
    const theme = useTheme()

    const obtenerEspecialidades = async () => {
        setLoading(true)
        try{
            const especialidades = await getEspecialidades();
            setEspecialidades(especialidades);
        }catch(err: any){
            Swal.fire("Error", `${err}`, 'error');
        }finally{
            setLoading(false)
        }
    }

    const handleEspecialidadFormSubmit = async (data: Partial<Especialidad>) => {
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
            setEditData(null);
            setOpenForm(false);
        }catch(err: any){
            Swal.fire("Error", `${err}`, "error");
        }finally{
            setLoading(false);
        }
    }

    const obtenerTratamientos = async () => {
        try{
            const res = await getTratamientos();
            setTratamientos(res);
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error')
        }
    }
    
    useEffect(() => {
        obtenerTratamientos();
        obtenerEspecialidades();
    }, []);

    const columns: Column<Especialidad>[] = [
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
                    {v}
                </Box>
            ),
        },
//         {
//             field: 'tratamientos', 
//             headerName: 'Tratamientos', 
//             align: 'center',
//             render: (v: string[]) => {
//                 const trat = tratamientos.filter(t => v.includes(t.id));
//                 return (
//                     <Box display={'flex'} flexDirection={'column'}>
//                         {trat.map(t => 
//                             <Box display={'flex'} textAlign={'left'} mb={1} alignItems={'center'}>
//                                 <MedicalInformationOutlinedIcon color="action" sx={{mr: 1}} /> {t.nombre}
//                             </Box>
//                         )}
//                     </Box>
//                 )
//             }
// },
        {field: 'image', headerName: 'Imagen', align: 'center', render: (image) => {
            return image 
                ? <img src={`${BASE_URL}${image}`} alt="imagen" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                : 'Sin Imagen'
        }},
    ];

    const actions: TableAction<Especialidad>[] = [
        {
            icon: <Edit color="info"/>,
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
                canExportExcel
                canExportPdf
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