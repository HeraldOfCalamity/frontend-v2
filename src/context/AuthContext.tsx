import { jwtDecode } from "jwt-decode";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthUser {
    user_id: string;
    role: string;
    tenant_id: string;
    name: string;
    lastname: string;
    isVerified: boolean;
    [key: string]: any;
}

interface AuthContextPorps{
    user: AuthUser | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextPorps | undefined>(undefined);

const getUserFromToken = (token: string): AuthUser | null => {
    try{
        const decoded: any = jwtDecode(token);
        return {
            user_id: decoded.user_id,
            role: decoded.role,
            tenant_id: decoded.tenant_id,
            isVerified: decoded.isVerified,
            name: decoded.name,
            lastname: decoded.lastname,
            ...decoded,
        };
    }catch{
        return null;
    }
};


const TOKEN_KEY = 'bb_token';

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        if(savedToken){
            setToken(savedToken);
            setUser(getUserFromToken(savedToken));
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if(token){
            setUser(getUserFromToken(token));
            localStorage.setItem(TOKEN_KEY, token);
        }else{
            setUser(null);
            localStorage.removeItem(TOKEN_KEY);
        }
    }, [token]);

    const login = (newToken: string) => setToken(newToken);
    const logout = () => setToken(null);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!user,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    )
};

export function useAuth(){
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
    return ctx;
}