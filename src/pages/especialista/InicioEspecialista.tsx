// InicioEspecialista.tsx
import { Box, CircularProgress, Typography } from "@mui/material"
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import Swal from "sweetalert2";

import { useUserProfile } from "../../context/userProfileContext";
import { type EspecialistaWithUser } from "../../api/especialistaService";
import { getCitasByEspecialista, type Cita } from "../../api/citaService";
import { getPacienteProfileById, type PacienteWithUser } from "../../api/pacienteService";

import CalendarioCitas from "../../components/CalendarioCitas";
import HistorialDialog from "./Historial/HistorialDialog";
import { SpeechProvider } from "../../context/SpeechContext";

// === NEW: WS + patch local
import { CitasWS } from "../../api/wsClient";
import { applyCitaEvent, type CitaEvent } from "../../utils/citasPatch";
import { BASE_URL } from "../../config/benedetta.api.config";

const InicioEspecialista: React.FC = () => {
  const { profile, loading: loadingProfile } = useUserProfile();
  const espProfile = profile as EspecialistaWithUser;

  const [loading, setLoading] = useState(false);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [openAtencion, setOpenAtencion] = useState(false);
  const [selectedPacienteProfile, setSelectedPacienteProfile] = useState<PacienteWithUser>();
  const [selectedCitaId, setSelectedCitaId] = useState("");

  // === NEW: ref del socket
  const wsRef = useRef<CitasWS | null>(null);

  const obtenerCitasEspecialista = async () => {
    setLoading(true);
    try {
      const list = await getCitasByEspecialista(espProfile?.especialista.id || "") as Cita[];
      setCitas(
        list.sort((a, b) => dayjs(b.fecha_inicio).valueOf() - dayjs(a.fecha_inicio).valueOf())
      );
    } catch (err: any) {
      Swal.fire({ title: "Error", text: `${err}`, icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAtenderCita = async (pacienteId: string, citaId: string) => {
    try {
      const paciente = await getPacienteProfileById(pacienteId);
      if (!paciente) {
        Swal.fire({ title: "Error", text: `Ocurrió un error al obtener datos de la cita.`, icon: "error" });
        return;
      }
      setSelectedPacienteProfile(paciente);
      setSelectedCitaId(citaId);
      setOpenAtencion(true);
    } catch (err: any) {
      Swal.fire({ title: "Error", text: `${err}`, icon: "error" });
    }
  };

  useEffect(() => {
    if (!loadingProfile && espProfile?.especialista?.id) {
      // 1) carga inicial
      obtenerCitasEspecialista();

      // 2) construir URL del WS con especialista_id + token
      const httpBase =
        (typeof BASE_URL === "string" && BASE_URL.length > 0)
          ? BASE_URL
          : window.location.origin;
      const wsBase = httpBase.replace(/^http/i, "ws");

      let token = localStorage.getItem("bb_token") || "";
      if (token.startsWith("Bearer ")) token = token.slice(7);

      const espId = espProfile.especialista.id;
      const wsUrl = token
        ? `${wsBase}/ws/citas?especialista_id=${encodeURIComponent(espId)}&token=${encodeURIComponent(token)}`
        : `${wsBase}/ws/citas?especialista_id=${encodeURIComponent(espId)}`;

      // 3) conectar y parchear en caliente
      wsRef.current = new CitasWS(wsUrl, (msg: CitaEvent) => {
        if (msg?.entity === "cita") {
          // (opcional) ignorar si no corresponde a este especialista:
          // if (String(msg.data?.especialista) !== espId) return;
          setCitas(prev => applyCitaEvent(prev, msg));
        }
      });
      wsRef.current.connect();

      // 4) cleanup
      return () => wsRef.current?.close();
    }
  }, [loadingProfile, espProfile?.especialista?.id]);

  return (loading || loadingProfile || !espProfile?.especialista) ? (
    <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
      <CircularProgress color="secondary" />
    </Box>
  ) : (
    <Box>
      <Typography variant="h4" fontWeight={600} mb={7} textAlign="center">
        Bienvenid@, especialista: {espProfile?.user.name} {espProfile?.user.lastname}
      </Typography>

      <CalendarioCitas
        citas={citas}
        defaultView="day"
        onAtenderCita={(cita) => {
          handleAtenderCita(cita?.paciente || "", cita?.id || "");
        }}
      />

      <SpeechProvider>
        <HistorialDialog
          onClose={() => setOpenAtencion(false)}
          open={openAtencion}
          pacienteProfile={selectedPacienteProfile as PacienteWithUser}
          citaId={selectedCitaId}
          readonly={false}
          showEndAttention={true}
        />
      </SpeechProvider>
    </Box>
  );
};

export default InicioEspecialista;
