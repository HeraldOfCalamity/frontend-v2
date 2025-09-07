import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { ThemeProvider } from '@mui/material';
import { lightTheme, theme2 } from './config/theme.config';
import InicioPaciente from './pages/paciente/InicioPaciente';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProtectedRoute from './components/common/ProtectedRoute';
import EspecialidadesPage from './pages/admin/EspecialidadesPage';
import UsuariosPage from './pages/admin/UsuariosPage';
import RolesPage from './pages/admin/RolesPage';
import HomeRedirect from './pages/HomeRedirect';
import ConfiguracionPage from './pages/admin/ConfiguracionPage';
import { ParamsProvider } from './context/ParameterContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import MisCitasPaciente from './pages/paciente/MisCitasPaciente';
import { UserProfileProvider } from './context/userProfileContext';
import InicioEspecialista from './pages/especialista/InicioEspecialista';
import PacientesPage from './pages/admin/PacientesPage';
import EspecialistasPage from './pages/admin/EspecialistasPage';
import PerfilPaciente from './pages/paciente/PerfilPaciente';
import PerfilEspecialista from './pages/especialista/PerfilEspecialista';
import TratamientosPage from './pages/admin/TratamientosPage';
import { AuthProvider } from './context/AuthContext';
import ImageUploadTest from './pages/especialista/Historial/ImageUploadTest';



function App() {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme2}>
        <ParamsProvider>
          <BrowserRouter>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <UserProfileProvider>
                <AppLayout>
                  <Routes>
                    <Route path='/' element={<HomeRedirect />} />

                    <Route element={<ProtectedRoute roles={['admin', 'paciente']} />}>
                      <Route path='/paciente/inicio' element={<InicioPaciente />} />
                      <Route path='/paciente/perfil' element={<PerfilPaciente />} />
                      <Route path='/paciente/citas' element={<MisCitasPaciente />} />

                    </Route>

                    <Route element={<ProtectedRoute roles={['admin', 'especialista']} />}>
                      <Route path='/especialista/inicio' element={<InicioEspecialista />} />
                      <Route path='/especialista/perfil' element={<PerfilEspecialista />} />
                      <Route path='/especialista/pacientes' element={<PerfilEspecialista />} />
                    </Route>

                    <Route element={<ProtectedRoute roles={['admin']} />}>
                      <Route path='/admin' element={<AdminDashboard />} />
                      <Route path='/admin/especialidades' element={<EspecialidadesPage />} />
                      <Route path='/admin/tratamientos' element={<TratamientosPage />} />
                      <Route path='/admin/usuarios' element={<UsuariosPage />} />
                      <Route path='/admin/pacientes' element={<PacientesPage />} />
                      <Route path='/admin/especialistas' element={<EspecialistasPage />} />
                      <Route path='/admin/roles' element={<RolesPage />} />
                      <Route path='/admin/configuracion' element={<ConfiguracionPage />} />
                    </Route>
                    <Route path='/image/test' element={<ImageUploadTest />} />
                  </Routes>
                </AppLayout>
              </UserProfileProvider>
            </LocalizationProvider>
          </BrowserRouter>
        </ParamsProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
