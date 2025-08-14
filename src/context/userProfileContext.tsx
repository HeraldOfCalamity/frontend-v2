// src/context/UserProfileContext.tsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { getPacienteByUserId, getPacienteProfile, type Paciente } from "../api/pacienteService";
import { getEspecialistaByUserId, getEspecialistaProfile, type Especialista } from "../api/especialistaService";

export type ProfileType = "paciente" | "especialista" | "otro";
export interface UserProfileContextValue {
    profile: Paciente | Especialista | null;
    loading: boolean;
    error: string | null;
    reloadProfile: () => void;
}

const UserProfileContext = createContext<UserProfileContextValue>({
    profile: null,
    loading: false,
    error: null,
    reloadProfile: () => {},
});

export const useUserProfile = () => useContext(UserProfileContext)

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            let data = null;
            if (user.role === "paciente") {
                data = await getPacienteByUserId(user.user_id);
            } else if (user.role === "especialista") {
                data = await getEspecialistaByUserId(user.user_id);
            }
            // Puedes agregar más roles aquí
            setProfile(data);
        } catch (err: any) {
            setError(err?.message || "Error al obtener perfil");
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