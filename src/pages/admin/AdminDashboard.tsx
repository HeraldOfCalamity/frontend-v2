import { AddCircleOutline, AssignmentInd, Category, LocalHospital, PeopleAlt } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material"
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import CalendarioCitas from "../../components/CalendarioCitas";
import { cancelCita, confirmCita, getCitas, type Cita } from "../../api/citaService";
import Swal from "sweetalert2";
import { CitasWS } from "../../api/wsClient";
import { BASE_URL } from "../../config/benedetta.api.config";
import { applyCitaEvent, type CitaEvent } from "../../utils/citasPatch";


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
    const hasRun = useRef(false);
    const wsRef = useRef<CitasWS | null>(null);
    

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


   useEffect(() => {
    // 1) carga inicial
    obtenerCitas();

    // 2) construir URL WS como la de tu prueba manual
    const httpBase =
      (typeof BASE_URL === "string" && BASE_URL.length > 0)
        ? BASE_URL
        : window.location.origin; // fallback
    const wsBase = httpBase.replace(/^http/i, "ws");

    let token = localStorage.getItem("bb_token") || "";
    if (token.startsWith("Bearer ")) token = token.slice(7);

    const wsUrl = token
      ? `${wsBase}/ws/citas?token=${encodeURIComponent(token)}`
      : `${wsBase}/ws/citas`;

    // 3) conectar
    wsRef.current = new CitasWS(wsUrl, (msg: CitaEvent) => {
      if (msg?.entity === "cita") {
        setCitas(prev => applyCitaEvent(prev, msg));
      }
    });
    wsRef.current.connect();

    // 4) cleanup
    return () => wsRef.current?.close();
  }, []);

    return(
        <Box my='auto'>
            <Typography variant="h4" fontWeight={700} mb={7} textAlign='center'>
                Bienvenido, {user?.name || user?.email || "Administrador"}
            </Typography>
            <Stack mb={2}>
            </Stack>
            <CalendarioCitas 
                citas={citas} 
                defaultView="agenda"
                // onCancelCita={
                //     // () => getCitas()
                //     () => {}
                // }
                // onConfirmCita={
                //     () => getCitas()
                // }
            />
            {/* <BuscarPaciente 
                open={openSearchPaciente} 
                onClose={handleSearchPacienteClose}
                onSelectPaciente={handleSelectPaciente} 
            /> */}
            {/* <BuscarEspecialidad
                open={openSearchEspecialidad}
                onClose={handleSearchEspecialidadClose}
                onSelectEspecialidad={handleSelectEspecialidad}
            /> */}

            {/* <ReservaCita
                open={openReservaCita}
                especialidad={selectedEspecialidad || {}}
                onClose={handleReservarCitaClose}
                paciente={selectedPaciente || {}}
            /> */}

        </Box>
    )
}

export default AdminDashboard;