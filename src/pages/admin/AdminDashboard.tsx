import { AssignmentInd, Category, LocalHospital, PeopleAlt } from "@mui/icons-material";
import { Box, Button, Card, CardContent, Stack, Typography } from "@mui/material"
import Grid from "@mui/material/Grid";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();

    return(
        <Box my='auto'>
            <Typography variant="h4" fontWeight={700} color="primary" mb={7} textAlign='center'>
                Bienvenido, {user?.name || user?.email || "Administrador"}
            </Typography>
            <Grid container spacing={3} mb={7}>
                {quickStats.map((stat) => (
                <Grid size={{xs:12, sm:6, md:3}} key={stat.label}>
                    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                        <CardContent sx={{ textAlign: "center" }}>
                            {stat.icon}
                            <Typography variant="h5" fontWeight={600} mt={1}>
                                {stat.count}
                            </Typography>
                            <Typography color="textSecondary">{stat.label}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                ))}
            </Grid>
             <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
                <Button
                    variant="contained"
                    color="secondary"
                    sx={{ minWidth: 180 }}
                    onClick={() => navigate('/admin/usuarios', {replace: true})}
                >
                    Gestión de Usuarios
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    sx={{ minWidth: 180 }}
                    onClick={() => navigate('/admin/especialidades', {replace: true})}
                >
                    Gestión de Especialidades
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ minWidth: 180 }}
                    onClick={() => navigate('/admin/roles', {replace: true})}
                >
                    Gestión de Roles y Permisos
                </Button>
                <Button
                    variant="outlined"
                    color="primary"
                    sx={{ minWidth: 180 }}
                    href="/admin/parametros"
                >
                    Parámetros del Consultorio
                </Button>
            </Stack>
        </Box>
    )
}

export default AdminDashboard;