import { useEffect, useState } from "react";
import type { Column, TableAction } from "../../components/common/GenericTable";
import { AddCircleOutline, Circle, Delete, Edit } from "@mui/icons-material";
import { Box, Button, Menu, MenuItem, Stack, Typography, useTheme } from "@mui/material";
import GenericTable from "../../components/common/GenericTable";
import Swal from "sweetalert2";
import { deleteUsuario, getUsuarios, type User } from "../../api/userService";
import PacienteForm from "../../components/admin/PacienteForm";
import { createPaciente, createPacientePerfil, deletePaciente, getPacienteByUserId, updatePacientePerfil, type Paciente, type PacienteWithUser } from "../../api/pacienteService";
import { getRoles } from "../../api/roleService";
import EspecialistaForm from "../../components/admin/EspecialistaForm";
import { createEspecialistaPerfil, deleteEspecialista, getEspecialistaByUserId, updateEspecialistaPerfil, type Especialista, type EspecialistaWithUser } from "../../api/especialistaService";

export default function UsuariosPage(){
    const [usuarios, setUsuarios] = useState<User[]>([])
    const [openPacienteForm, setOpenPacienteForm] = useState(false);
    const [openEspecialistaForm, setOpenEspecialistaForm] = useState(false);
    const [editData, setEditData] = useState<PacienteWithUser | EspecialistaWithUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [addAnchorEl, setAddAnchorEl] = useState<null | HTMLElement>(null);
    const openAddUser = Boolean(addAnchorEl);
    
    const handleAddUserClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setAddAnchorEl(e.currentTarget);
    }
    const handleAddUserClose = () => {
        setAddAnchorEl(null);
    }
    const theme = useTheme()

    const eliminarUsuario = async (user: User) => {
        
        setLoading(true);

        const result = await Swal.fire({
            title: "Estas seguro?",
            text: `Esta accion eliminara "${user.email}". No se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: theme.palette.primary.main,
            confirmButtonText: 'Si, eliminar',
            cancelButtonText: 'Cancelar',
        })

        try{
            if(!result.isConfirmed) return;

            if(user.role === 'paciente'){
                const paciente = await obtenerPacientePorIdUsuario(user.id);
                console.log("paciente", paciente);
                if(paciente){
                    await deletePaciente(paciente?.id)
                    Swal.fire("¡Eliminado!", "El registro fue eliminado.", "success");
                }else{
                    const resultDeleteUserOnly = await Swal.fire({
                        title: "Estas seguro?",
                        text: `No se tienen datos de paciente.\nEsta accion eliminara al usuario"${user.email}". No se puede deshacer.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: theme.palette.primary.main,
                        confirmButtonText: 'Si, eliminar',
                        cancelButtonText: 'Cancelar',
                    })
                    if(resultDeleteUserOnly.isConfirmed){
                        await deleteUsuario(user.id);
                        Swal.fire("¡Eliminado!", "El registro fue eliminado.", "success");
                        return;
                    }

                    Swal.fire("Error", "Paciente no encontrado", "error");
                }
            }

            if(user.role === 'especialista'){
                const especialista = await obtenerEspecialistaPorIdUsuario(user.id);
                if(especialista){
                    await deleteEspecialista(especialista?.id)
                    Swal.fire("¡Eliminado!", "El registro fue eliminado.", "success");
                }else{
                    Swal.fire("Error", "Especialista no encontrado", "error");
                }
            }
        }catch(err: any){
            Swal.fire('Error', `${err}`, 'error');
        }finally{
            await obtenerUsuarios();
        }
        setLoading(false);
    }

    const editarUsuario = async (user: User) => {

        if(user.role === 'paciente'){
            const pacienteResponse = await obtenerPacientePorIdUsuario(user.id);
            let data: PacienteWithUser | null = null;
            if(pacienteResponse){
                data = {user: user, paciente: pacienteResponse}
            }else{
                data = {user: user, paciente: {}}
                await Swal.fire(
                    'Atencion', 
                    'El usuario registrado no ha registrado sus datos personales, debe registrarlos para continuar.',
                    "info"
                )
            }
            setEditData(data);
            setOpenPacienteForm(true);
        }

        if(user.role === 'especialista'){
            const especialistaResponse = await obtenerEspecialistaPorIdUsuario(user.id);
            if(especialistaResponse){
                setEditData((o) => o ?? { user: user, especialista: especialistaResponse ?? {} });
                setOpenEspecialistaForm(true);
            }
        }   

    }

    const obtenerUsuarios = async () => {
        try{
            const usuarios = await getUsuarios();
            const roles = await getRoles();
            const usuariosWithRoleName = usuarios.map(u => ({
                ...u,
                role: roles.find(r => r.id === u.role)?.name!
            }));
            setUsuarios(usuariosWithRoleName);
        }catch{
            Swal.fire("Error", "Ocurrio un error al obtener los usuarios", 'error');
        }
    }



    const obtenerPacientePorIdUsuario = async (user_id: string): Promise<Paciente | undefined> => {
        try{
            return await getPacienteByUserId(user_id)
        }catch(err: any){
            await Swal.fire("Error", `${err}`, 'error');
        }
    }

    const obtenerEspecialistaPorIdUsuario = async (user_id: string): Promise<Especialista | undefined> => {
        try{
            return await getEspecialistaByUserId(user_id)
        }catch(err: any){
            await Swal.fire("Error", `${err}`, 'error');
        }
    }

    const handlePacienteFormSubmit = async (data: Partial<PacienteWithUser>) => {
        setLoading(true);
        try{
            if(editData){ // Editar
                const { paciente } = editData as PacienteWithUser;
                if(paciente && Object.keys(paciente).length > 0){
                    await updatePacientePerfil(paciente.id!, data);
                }else{
                    await createPaciente({...data.paciente, user_id: editData.user.id})
                }
                await obtenerUsuarios()
                Swal.fire("Operacion exitosa!", "Usuario actualizado con exito", "success");
            }else { // Crear
                await createPacientePerfil(data);
                await obtenerUsuarios()
                Swal.fire("Operacion Exitosa!", "Usuario creado con exito", "success");
            }
        }catch(err: any){
            setEditData(null);
            setOpenPacienteForm(false);
            Swal.fire(`${err}`);
        }finally{
            setEditData(null);
            setOpenPacienteForm(false);
            setLoading(false);
        }
    }
    const handleEspecialistaFormSubmit = async (data: Partial<EspecialistaWithUser>) => {
        setLoading(true);
        try{
            if(editData){ // Editar
                const { especialista } = editData as EspecialistaWithUser;
                await updateEspecialistaPerfil(especialista.id!, data);
                await obtenerUsuarios()
                Swal.fire("Operacion exitosa!", "Usuario actualizado con exito", "success");
            } else { // Crear
                await createEspecialistaPerfil(data);
                await obtenerUsuarios()
                Swal.fire("Operacion Exitosa!", "Usuario creado con exito", "success");
            }
        }catch{
            setEditData(null);
            setOpenEspecialistaForm(false);
            Swal.fire("Error", "Error al guardar", "error");
        }finally{
            setEditData(null);
            setOpenEspecialistaForm(false);
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
        {field: 'username', headerName: 'Nombre', align: 'center'},
        {field: 'email', headerName: 'Correo', align: 'center'},
        {
            field: 'role', 
            headerName: 'Rol', 
            align: 'center', 
            render: (roleName: string) => {
                return `${roleName.charAt(0).toUpperCase()}${roleName.slice(1)}`
            }
        },
        {
            field: 'isActive', 
            headerName: 'Activo', 
            align: 'center', 
            render: (v) => 
                <Circle fontSize="small" color={v ? "success" : "error"} />
        },
        {
            field: 'isVerified', 
            headerName: 'Verificado', 
            align: 'center', 
            render: (v) => 
                <Circle fontSize="small" color={v ? "success" : "error"} />
        },
    ];

    const actions: TableAction<User>[] = [
        {
            icon: <Edit />,
            label: 'Editar',
            onClick: (userRow) => editarUsuario(userRow)
        },
        {
            icon: <Delete />,
            label: 'Eliminar',
            color: 'error',
            onClick: (userRow) => eliminarUsuario(userRow)
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
                    onClick={handleAddUserClick}
                >
                    Agregar
                </Button>
                <Menu
                    id="add-user-menu"
                    anchorEl={addAnchorEl}
                    open={openAddUser}
                    onClose={handleAddUserClose}
                >
                    <MenuItem onClick={() => {
                        setEditData(null);
                        setOpenPacienteForm(true);
                        handleAddUserClose();
                    }}>Paciente</MenuItem>
                    <MenuItem onClick={() => {
                        setEditData(null);
                        setOpenEspecialistaForm(true);
                        handleAddUserClose();
                    }}>Especialista</MenuItem>
                </Menu>
            </Stack>
            <Stack spacing={5}>
                <GenericTable
                    columns={columns}
                    data={usuarios}
                    actions={actions}
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
            <EspecialistaForm
                open={openEspecialistaForm}
                onClose={() => {
                    setEditData(null);
                    setOpenEspecialistaForm(false);
                }}
                onSubmit={handleEspecialistaFormSubmit}
                initialData={editData as EspecialistaWithUser || undefined}
                loading={loading}
            />
        </Box>
    )
}