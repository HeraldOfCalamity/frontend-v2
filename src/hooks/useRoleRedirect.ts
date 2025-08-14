import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"
import { useEffect, useRef } from "react";

export const useRoleRedirect = () => {
    const {user, isAuthenticated, isLoading} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const redirected = useRef(false);

    useEffect(() => {
        if(isLoading || redirected.current || !user) return;
        
        if(isAuthenticated && location.pathname === '/'){
            console.log('pathname', location.pathname)
            redirected.current = true;
            

            if(user.role === 'admin') navigate('/admin', {replace: true});
            else if(user.role === 'paciente') navigate('/paciente/inicio', {replace: true});
            else if(user.role === 'especialista') navigate('/especialista/inicio', {replace: true});
        }
    }, [user, isAuthenticated, isLoading, location.pathname, navigate])
}