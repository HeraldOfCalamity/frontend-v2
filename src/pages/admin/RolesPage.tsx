import { Box, Button, Chip, Stack, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { createRol, deleteRol, getRoles, updateRol, type Role } from "../../api/roleService";
import type { Permission } from "../../api/permisosService";
import Swal from "sweetalert2";
import getPermissions from "../../api/permisosService";
import type { Column, TableAction } from "../../components/common/GenericTable";
import { AddCircleOutline, Delete, Edit } from "@mui/icons-material";
import GenericTable from "../../components/common/GenericTable";
import RoleForm from "../../components/admin/RoleForm";

export default function RolesPage(){
    const [roles, setRoles] = useState<Role[]>([]);
    const [permisos, setPermisos] = useState<Permission[]>([])
    const [openForm, setOpenForm] = useState(false);
    const [editData, setEditData] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    const obtenerRoles = async () => {
        try{
            const roles = await getRoles();
            setRoles(roles);
        }catch{
            Swal.fire("Error", "Ocurrio un error al obtener los roles", 'error');
        }
    }

    const obtenerPermisos = async () => {
        try{
            const permisos = await getPermissions();
            setPermisos(permisos);
        }catch{
            Swal.fire("Error", "Error al obtener permisos", 'error');
        }
    }

    const handleRoleFormSubmit = async (data: Partial<Role>) => {
        setLoading(true);
        try {
            if(editData){
                await updateRol(editData.id, data);
                await obtenerRoles();
                Swal.fire("Operacion exitosa!", "Usuario actualizado con exito", "success");
            }else{
                await createRol(data);
                await obtenerRoles();
                Swal.fire("Operacion Exitosa!", "Usuario creado con exito", "success");
            }
        } catch (error: any) {
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
        setLoading(true);
        obtenerRoles();
        obtenerPermisos();
        setLoading(false);
    }, [])

    const columns: Column<Role>[] = [
        {field: 'name', headerName: 'Nombre', align: 'center'},
        {field: 'description', headerName: 'Descripcion', align: 'center'},
        {
            field: 'permissions',
            headerName: 'Permisos',
            align: 'center',
            render: (p_idS: string[]) =>{ 
                return <Stack direction='row' spacing={1}  justifyContent='center' flexWrap='wrap' gap={0.5}>
                    {p_idS.map(p => {
                        const permissionObject = permisos.find(pO => pO.id === p);
                        return (
                            <Chip key={permissionObject?.id} label={permissionObject?.name}  size="small"  />

                        )
                    })}
                </Stack>}
        }
    ]

    const actions: TableAction<Role>[] = [
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
                    title: 'Estas Seguro?',
                    text: `Esta accion eliminara el rol "${row.name}". No se puede deshacer.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: theme.palette.primary.main,
                    confirmButtonText: 'Si, eliminar',
                    cancelButtonText: 'Cancelar'
                })

                if(result.isConfirmed){
                    setLoading(true)
                    try{
                        await deleteRol(row.id);
                        await obtenerRoles()
                        Swal.fire("¡Eliminado!", "El registro fue eliminado.", "success")
                    }catch{
                        Swal.fire("Error", "No se pudo eliminar.", "error");
                    }finally{
                        setLoading(false);
                    }
                }
            }
        }
    ]

    const permisosColumns: Column<Permission>[] = [
        {field: 'name', headerName: 'Permiso'},
        {field: 'description', headerName: 'Descripcion'},

    ]
    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                Roles y Permisos
            </Typography>
            <Stack direction="row" justifyContent="flex-end" mb={2}>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddCircleOutline />}
                    onClick={() => {
                        setEditData(null);
                        setOpenForm(true);
                    }}
                >
                    Agregar Rol
                </Button>
            </Stack>
            <GenericTable
                columns={columns}
                actions={actions}
                data={roles}
            />
            <Typography variant="h6" fontWeight={600} mt={5} mb={2}>
                Permisos del sistema
            </Typography>
            <GenericTable
                columns={permisosColumns}
                data={permisos}
                rowsPerPageOptions={[5, 10, 20]}
            />
            <RoleForm 
                open={openForm}
                onClose={() => {
                    setEditData(null);
                    setOpenForm(false);
                }}
                onSubmit={handleRoleFormSubmit}
                initialData={editData || undefined}
                permisos={permisos}
                loading={loading}
            />
        </Box>
    )
}