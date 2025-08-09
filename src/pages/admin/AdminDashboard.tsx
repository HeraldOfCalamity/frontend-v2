import { AddCircleOutline, AssignmentInd, Category, LocalHospital, PeopleAlt } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material"
import Grid from "@mui/material/Grid";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import CalendarioCitas from "../../components/CalendarioCitas";
import { cancelCita, confirmCita, getCitas, type Cita } from "../../api/citaService";
import Swal from "sweetalert2";
import BuscarPaciente from "../../components/admin/BuscarPaciente";
import type { Paciente } from "../../api/pacienteService";
import ReservaCita from "../../components/ReservarCita/ReservaCita";
import BuscarEspecialidad from "../../components/admin/BuscarEspecialidad";
import type { Especialidad } from "../../api/especialidadService";

interface AdminDashboardProps{

}
const quickStats = [
  { label: "Usuarios", count: 23, icon: <PeopleAlt fontSize="large" color="primary" /> },
  { label: "Especialistas", count: 8, icon: <LocalHospital fontSize="large" color="secondary" /> },
  { label: "Pacientes", count: 15, icon: <AssignmentInd fontSize="large" color="primary" /> },
  { label: "Especialidades", count: 5, icon: <Category fontSize="large" color="secondary" /> },
];

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
    const {user} = useAuth();
    const [citas, setCitas] = useState<Cita[]>([]);
    const [openSearchPaciente, setOpenSearchPaciente] = useState(false);
    const [openReservaCita, setOpenReservaCita] = useState(false);
    const [openSearchEspecialidad, setOpenSearchEspecialidad] = useState(false);
    const [selectedPaciente, setSelectedPaciente] = useState<Partial<Paciente> | null>(null);
    const [selectedEspecialidad, setSelectedEspecialidad] = useState<Especialidad | null>(null);
    const navigate = useNavigate();

    const handleNewCitaClick = () => {
        setOpenSearchPaciente(true);
    }

    const handleSearchPacienteClose = () => {
        setOpenSearchPaciente(false);
    }

    const handleSelectPaciente = (paciente: Paciente) => {
        setSelectedPaciente(paciente);
        setOpenSearchEspecialidad(true);
    }

    const handleReservarCitaClose = async () => {
        await obtenerCitas();
        setSelectedPaciente(null);
        setOpenReservaCita(false);
    }

    const handleSearchEspecialidadClose = () => {
        setSelectedEspecialidad(null);
        setOpenSearchEspecialidad(false);
    }
    
    const handleSelectEspecialidad = (especialidad: Especialidad) => {
        setSelectedEspecialidad(especialidad)
        setOpenSearchEspecialidad(false);
        setOpenReservaCita(true);
    }

    const obtenerCitas = async () => {
        try{
            const citas = await getCitas();
            setCitas(citas);
        }catch (err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }
    const handleCancelCitaClick = async (cita: Cita) => {
        try{
            const isConfirmed = await Swal.fire({
                title: 'Cancelar Cita',
                text: 'Esta seguro de cancelar la cita?, esta accion no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Si, cancelar',
                cancelButtonText: 'No',
            })

            if(isConfirmed.isConfirmed){
                const canceled = await cancelCita(cita.id);
                await obtenerCitas();
                Swal.fire(
                    'Operacion Exitosa',
                    'Cita cancelada con exito, en un momento recibira un correo de confirmación.',
                    'success'
                )
                console.log('cita, cancelada', canceled);
            }

        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }
    const handleConfirmCitaClick = async (cita: Cita) => {
        try{
            const isConfirmed = await Swal.fire({
                title: 'Confirmar Cita',
                text: 'Esta seguro de confirmar la cita?, esta accion no se puede deshacer.',
                icon: 'warning',
                showCancelButton: true,
                showConfirmButton: true,
                confirmButtonText: 'Si, confirmar',
                cancelButtonText: 'No',
            })

            if(isConfirmed.isConfirmed){
                const confirmed = await confirmCita(cita.id);
                await obtenerCitas();
                Swal.fire(
                    'Operacion Exitosa',
                    'Cita confirmada con exito, en un momento recibira un correo de verificacion.',
                    'success'
                )
                console.log('cita, confirmada', confirmed);
            }

        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }
    useEffect(() => {
        obtenerCitas();
    }, [])

    return(
        <Box my='auto'>
            <Typography variant="h4" fontWeight={700} color="primary" mb={7} textAlign='center'>
                Bienvenido, {user?.name || user?.email || "Administrador"}
            </Typography>
            <Stack mb={2}>
                <Button
                    variant="contained" 
                    color="primary" 
                    startIcon={<AddCircleOutline />}
                    onClick={handleNewCitaClick}
                >Reservar Cita</Button>
            </Stack>
            <CalendarioCitas 
                citas={citas} 
                handleCancelClick={handleCancelCitaClick}
                handleConfirmClick={handleConfirmCitaClick}
            />
            <BuscarPaciente 
                open={openSearchPaciente} 
                onClose={handleSearchPacienteClose}
                onSelectPaciente={handleSelectPaciente} 
            />
            <BuscarEspecialidad
                open={openSearchEspecialidad}
                onClose={handleSearchEspecialidadClose}
                onSelectEspecialidad={handleSelectEspecialidad}
            />

            <ReservaCita
                open={openReservaCita}
                especialidad={selectedEspecialidad || {}}
                onClose={handleReservarCitaClose}
                paciente={selectedPaciente || {}}
            />

        </Box>
    )
}

export default AdminDashboard;