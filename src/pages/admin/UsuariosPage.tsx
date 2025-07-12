import { useEffect, useState } from "react";
import type { Column, TableAction } from "../../components/common/GenericTable";
import { AddCircleOutline, Circle, Delete, Edit } from "@mui/icons-material";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import GenericTable from "../../components/common/GenericTable";
import Swal from "sweetalert2";
import { createUsuario, deleteUsuario, getUsuarios, updateUsuario, type User } from "../../api/userService";
import UsuarioForm from "../../components/admin/UsuarioForm";

export default function UsuariosPage(){
    const [usuarios, setUsuarios] = useState<User[]>([])
    const [openForm, setOpenForm] = useState(false);
    const [editData, setEditData] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme()

    const eliminarUsuario = async (userId: string) => {
        setLoading(true);
        await deleteUsuario(userId);
        setLoading(false);
    }

    const obtenerUsuarios = async () => {
        try{
            const usuarios = await getUsuarios();
            setUsuarios(usuarios);
        }catch{
            Swal.fire("Error", "Ocurrio un error al obtener los usuarios", 'error');
        }
    }

    const handleUserFormSubmit = async (data: Partial<User>) => {
        setLoading(true);
        try{
            if(editData){ // Editar
                const updated = await updateUsuario(editData.id, data);
                await obtenerUsuarios()
                Swal.fire("Operacion exitosa!", "Usuario actualizado con exito", "success");
            }else { // Crear
                const created = await createUsuario(data);
                await obtenerUsuarios()
                Swal.fire("Operacion Exitosa!", "Usuario creado con exito", "success");
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
            obtenerUsuarios()
            setLoading(false);
        }catch(err){
            throw err;
        }
    }, []);

    const columns: Column<User>[] = [
        {field: 'name', headerName: 'Nombre', align: 'center'},
        {field: 'email', headerName: 'Correo', align: 'center'},
        {field: 'role', headerName: 'Rol', align: 'center'},
        {field: 'isActive', headerName: 'Activo', align: 'center', render: (v) => <Circle fontSize="small" color={v ? "success" : "error"} />},
    ];

    const actions: TableAction<User>[] = [
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
                    text: `Esta accion eliminara "${row.email}". No se puede deshacer.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: theme.palette.primary.main,
                    confirmButtonText: 'Si, eliminar',
                    cancelButtonText: 'Cancelar',
                })

                if(result.isConfirmed){
                    try {
                        await eliminarUsuario(row.id)
                        await obtenerUsuarios();
                        Swal.fire("¡Eliminado!", "El registro fue eliminado.", "success");
                    } catch (e) {
                        Swal.fire("Error", "No se pudo eliminar.", "error");
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
                data={usuarios}
                actions={actions}
            />
            <UsuarioForm
                open={openForm}
                onClose={() => {
                    setEditData(null);
                    setOpenForm(false);
                }}
                onSubmit={handleUserFormSubmit}
                initialData={editData || undefined}
                loading={loading}
            />
        </Box>
    )
}