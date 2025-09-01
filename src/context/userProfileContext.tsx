// src/context/UserProfileContext.tsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getPacienteByUserId, getPacienteProfile, getPacienteProfileById, type Paciente, type PacienteWithUser } from "../api/pacienteService";
import { getEspecialistaByUserId, getEspecialistaProfile, getEspecialistaProfileById, type Especialista, type EspecialistaWithUser } from "../api/especialistaService";
import Swal from "sweetalert2";

export type ProfileType = "paciente" | "especialista" | "otro";
export interface UserProfileContextValue {
    profile: PacienteWithUser | EspecialistaWithUser | null;
    loading: boolean;
    error: string | null;
    reloadProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue>({
    profile: null,
    loading: false,
    error: null,
    reloadProfile: async () => {},
});

export const useUserProfile = () => useContext(UserProfileContext)

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState<PacienteWithUser | EspecialistaWithUser | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            let data = null;
            if (user.role === "paciente") {
                const paciente = await getPacienteByUserId(user.user_id);
                data = await getPacienteProfileById(paciente.id);
            } else if (user.role === "especialista") {
                const especialista = await getEspecialistaByUserId(user.user_id);
                data = await getEspecialistaProfileById(especialista.id)
            }
            // Puedes agregar más roles aquí
            setProfile(data);
        } catch (err: any) {
            setError(err?.message || "Error al obtener perfil");
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {

        fetchProfile();

        // eslint-disable-next-line
    }, [user]);

    return (
        <UserProfileContext.Provider value={{ profile, loading, error, reloadProfile: fetchProfile }}>
            {children}
        </UserProfileContext.Provider>
    );
}