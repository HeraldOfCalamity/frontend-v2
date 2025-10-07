import { AddCircleOutline, Circle, Delete, Edit, HistoryEduOutlined } from "@mui/icons-material";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, useTheme } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import type { Column, TableAction } from "../../components/common/GenericTable";
import dayjs from "dayjs";
import GenericTable from "../../components/common/GenericTable";
import { createPacientePerfil, deletePaciente, getPacientesWithUser, updatePacientePerfil, type Paciente, type PacienteWithUser } from "../../api/pacienteService";
import PacienteForm, { type PacienteFormField } from "../../components/admin/PacienteForm";
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
import { getCitasByPaciente, type Cita } from "../../api/citaService";
import ReservaCita from "../../components/ReservarCita/ReservaCita";
import BuscarEspecialidad from "../../components/admin/BuscarEspecialidad";
import type { Especialidad } from "../../api/especialidadService";
import type { Especialista } from "../../api/especialistaService";
import CalendarioCitas from "../../components/CalendarioCitas";
import { SpeechProvider } from "../../context/SpeechContext";
import HistorialDialog from "../especialista/Historial/HistorialDialog";


export default function PacientesPage(){
    const [openPacienteForm, setOpenPacienteForm] = useState(false);
    const [openCitasPacienteDialog, setOpenCitasPacienteDialog] = useState(false);
    const [openReservaCitaDialog, setOpenReservaCitaDialog] = useState(false);
    const [openBuscarEspecialidadDialog, setOpenBuscarEspecialidadDialog] = useState(false);
    const [selectedEspecialidad, setSelectedEspecialidad] = useState<Especialidad | null>(null);
    const [selectedPaciente, setSelectedPaciente] = useState<PacienteWithUser | null>(null);
    const [editData, setEditData] = useState<PacienteWithUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [pacientes, setPacientes] = useState<PacienteWithUser[]>([]);
    const [disabledFields, setDisabledFields] = useState<PacienteFormField[]>([]);
    const [citasPaciente, setCitasPaciente] = useState<Cita[]>([])
    const [openHistorialDialog, setOpenHistorialDialog] = useState(false)
    const [selectedPacienteHist,setSelectedPacienteHist] = useState<PacienteWithUser | null>(null)
    const [refetchCalendar, setRefetchCalendar] = useState(false);
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

    const handleVerHistorial = (row: any) => {
      const pac = pacientes.find(p => p.paciente.id === row.id) || null;
      setSelectedPacienteHist(pac);
      setOpenHistorialDialog(true);
    };

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
            headerName: 'Fecha de Nacimiento', 
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

    const handleShowPaciente = (row: any) => {
        const pac = pacientes.find(p => p.paciente.id === row.id);
        setDisabledFields([
            "ci", "email", "fecha_nacimiento", "isActive", "lastname", "name","password", "phone", "tipo_sangre", "save"
        ])
        setEditData(pac!);
        setOpenPacienteForm(true);
    }

    const handleShowCitasPaciente = async (row: any) => {
        const pac = pacientes.find(p => p.paciente.id === row.id);
        setSelectedPaciente(pac!);
        await obtenerCitasPaciente(row.id)
        setOpenCitasPacienteDialog(true);
    }

    useEffect(() => {
        console.log('selected paciente', selectedPaciente)
    }, [selectedPaciente])

    const actions: TableAction<any>[] = [
        {
            icon: <VisibilityOutlinedIcon color="primary"/>,
            label: 'Ver',
            onClick: (userRow) => handleShowPaciente(userRow)
        },
        {
            icon: <HistoryEduOutlined color="warning"/>,
            label: 'Ver Historial',
            onClick: (userRow) => handleVerHistorial(userRow)
        },
        {
            icon: <EditCalendarOutlinedIcon color="secondary"/>,
            label: 'Citas Reservadas',
            onClick: (userRow) => handleShowCitasPaciente(userRow)
        },
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

    const obtenerCitasPaciente = async (pacienteId: string) => {
        console.log('paciente id', pacienteId)
        setLoading(true);
        try{
            const citas = await getCitasByPaciente(pacienteId)
            setCitasPaciente(citas);
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }finally{
            setLoading(false)
        }
    }

    const handleNewCitaClick = () => {
        if(!selectedPaciente) return;

        setOpenBuscarEspecialidadDialog(true);
    }


    const handleCloseCitasPaciente = () => {
        setSelectedPaciente(null);
        setOpenBuscarEspecialidadDialog(false);
    }



    useEffect(() => {
        obtenerPacientes();
    }, [])



    return(
        <Box>
            <Typography variant="h5" fontWeight={700} mb={3}>
                    Gestión de usuarios / Pacientes
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
                <Dialog
                    maxWidth={"lg"}
                    fullWidth
                    open={openCitasPacienteDialog}
                    onClose={handleCloseCitasPaciente}
                >
                    <DialogTitle>
                            Registro de citas del paciente
                    </DialogTitle>
                    <DialogContent>
    
                        <Stack direction={'row'} justifyContent={'end'} mb={1}>
                            <Button
                                variant="contained" 
                                color="primary" 
                                startIcon={<AddCircleOutline />}
                                onClick={handleNewCitaClick}
                            >Reservar Cita</Button>
                        </Stack>
                        <CalendarioCitas 
                            defaultView="agenda"
                            citas={citasPaciente}
                            onCancelCita={
                                async () => await obtenerCitasPaciente(selectedPaciente?.paciente.id || '')
                            }
                            onConfirmCita={
                                async () => await obtenerCitasPaciente(selectedPaciente?.paciente.id || '')
                            }
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button variant="contained" onClick={() => setOpenCitasPacienteDialog(false)} color="error">
                            Cerrar
                        </Button>
                    </DialogActions>
                </Dialog>
                <PacienteForm
                    open={openPacienteForm}
                    onClose={() => {
                        setEditData(null);
                        setDisabledFields([]);
                        setOpenPacienteForm(false);
                    }}
                    disabledFields={disabledFields}
                    onSubmit={handlePacienteFormSubmit}
                    initialData={editData as PacienteWithUser || undefined}
                    loading={loading}
                />
                <BuscarEspecialidad
                    open={openBuscarEspecialidadDialog}
                    onClose={() => {
                        setSelectedEspecialidad(null);
                        setOpenBuscarEspecialidadDialog(false);
                    }}
                    onSelectEspecialidad={(especialidad) => {
                        setSelectedEspecialidad(especialidad);
                        setOpenReservaCitaDialog(true)
                    }}
                />

                <ReservaCita
                    open={openReservaCitaDialog}
                    especialidad={selectedEspecialidad || {}}
                    onClose={async () => {
                        setSelectedEspecialidad(null);
                        await obtenerCitasPaciente(selectedPaciente?.paciente.id || '')
                        setOpenReservaCitaDialog(false);

                    }}
                    paciente={selectedPaciente || {}}
                />
                {selectedPacienteHist && (
                    <SpeechProvider>
                        <HistorialDialog
                            open={openHistorialDialog}
                            onClose={() => {setOpenHistorialDialog(false); setSelectedPacienteHist(null);}}
                            pacienteProfile={selectedPacienteHist}
                            showEndAttention={false}
                            readonly
                        />
                    </SpeechProvider>
                )}
        </Box>
    )
}
