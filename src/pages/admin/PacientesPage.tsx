import { AddCircleOutline, Circle, Delete, Edit } from "@mui/icons-material";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import type { Column, TableAction } from "../../components/common/GenericTable";
import dayjs from "dayjs";
import GenericTable from "../../components/common/GenericTable";
import { createPacientePerfil, deletePaciente, getPacientesWithUser, updatePacientePerfil, type PacienteWithUser } from "../../api/pacienteService";
import PacienteForm from "../../components/admin/PacienteForm";


export default function PacientesPage(){
    const [openPacienteForm, setOpenPacienteForm] = useState(false);
    const [editData, setEditData] = useState<PacienteWithUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [pacientes, setPacientes] = useState<PacienteWithUser[]>([])
    const theme = useTheme();

    const adaptedData = useMemo(() => pacientes.map(p => ({
        id: p.paciente.id,  // o e.especialista.id si lo prefieres
        name: p.user.name,
        lastname: p.user.lastname,
        email: p.user.email,
        role: p.user.role,
        isActive: p.user.isActive,
        isVerified: p.user.isVerified,
        createdAt: p.user.createdAt,
        fecha_nacimiento: p.paciente.fecha_nacimiento,
        tipo_sangre: p.paciente.tipo_sangre,
        raw: p, 
    })), [pacientes]);

    const handleAddPacienteClick = () => {
        setOpenPacienteForm(true);
    }

    const handlePacienteFormSubmit = async (data: Partial<PacienteWithUser>) => {
        setLoading(true);
        try{
            if(editData){ // Editar
                const { paciente } = editData as PacienteWithUser;
                await updatePacientePerfil(paciente.id!, data);
                await obtenerPacientes();
                Swal.fire(
                    "Operacion exitosa!", 
                    "Usuario actualizado con exito", 
                    "success"
                );
            } else { // Crear
                await createPacientePerfil(data);
                await obtenerPacientes();
                Swal.fire(
                    "Operacion Exitosa!", 
                    "Usuario creado con exito", 
                    "success"
                );
            }
            setEditData(null);
            setOpenPacienteForm(false);
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
        {field: 'tipo_sangre', headerName: 'Tipo de Sangre', align: 'center'},
        {
            field: 'Fecha_nacimiento', 
            headerName: 'Apellidos', 
            align: 'center',
            render: (v) => dayjs(v).format('DD/MM/YYYY')
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

    const editarPaciente = async (row: any) => {
        const esp = pacientes.find(p => p.paciente.id === row.id);
        setEditData(esp || null);
        setOpenPacienteForm(true);
    }

    const eliminarPaciente = async (row: any) => {
        try{
            const result = await Swal.fire({
                title: "Estas seguro?",
                text: `Esta accion desactivará a "${row.name} ${row.lastname} como paciente". No se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: theme.palette.primary.main,
                confirmButtonText: 'Si, eliminar',
                cancelButtonText: 'Cancelar',
            })
            if(result.isConfirmed){
                await deletePaciente(row.id)
                await obtenerPacientes();
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

    const actions: TableAction<any>[] = [
        {
            icon: <Edit color="info"/>,
            label: 'Editar',
            onClick: (userRow) => editarPaciente(userRow)
        },
        {
            icon: <Delete />,
            label: 'Eliminar',
            color: 'error',
            onClick: (userRow) => eliminarPaciente(userRow)
        }
    ]

    const obtenerPacientes = async () => {
        try{
            const data = await getPacientesWithUser();
            setPacientes(data);
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }

    useEffect(() => {
        obtenerPacientes();
    }, [])

    return(
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                    Gestión de pacientes
                </Typography>
                <Stack direction='row' justifyContent='flex-end' mb={2}>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddCircleOutline />}
                        onClick={handleAddPacienteClick}
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
                <PacienteForm
                    open={openPacienteForm}
                    onClose={() => {
                        setEditData(null);
                        setOpenPacienteForm(false);
                    }}
                    onSubmit={handlePacienteFormSubmit}
                    initialData={editData as PacienteWithUser || undefined}
                    loading={loading}
                />
        </Box>
    )
}
