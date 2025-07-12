import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps{
    roles?: string[];
    redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    roles,
    redirectTo = '/login'
}) => {
    const {isAuthenticated, user} = useAuth();

    if(!isAuthenticated){
        return <Navigate to={redirectTo} replace/>
    }

    if(roles && user && !roles.includes(user.role)){
        return <Navigate to='/' replace />
    }

    return <Outlet />
};

export default ProtectedRoute;