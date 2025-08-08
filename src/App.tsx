import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { darkTheme, lightTheme } from './config/theme.config';
import PerfilPaciente from './pages/PerfilPaciente';
import PerfilEspecialista from './pages/PerfilEspecialista';
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
import MisCitasPaciente from './pages/MisCitasPaciente';
import { UserProfileProvider } from './context/userProfileContext';



function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

   useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  return (
    <ThemeProvider theme={lightTheme}>
      <ParamsProvider>
        <BrowserRouter>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <UserProfileProvider>
              <AppLayout>
                <Routes>
                  <Route path='/' element={<HomeRedirect />} />

                  <Route element={<ProtectedRoute roles={['admin', 'paciente']} />}>
                    <Route path='/perfil/paciente' element={<PerfilPaciente />} />
                    <Route path='/perfil/citas' element={<MisCitasPaciente />} />

                  </Route>

                  <Route element={<ProtectedRoute roles={['admin', 'especialista']} />}>
                    <Route path='/perfil/especialista' element={<PerfilEspecialista />} />
                  </Route>

                  <Route element={<ProtectedRoute roles={['admin']} />}>
                    <Route path='/admin' element={<AdminDashboard />} />
                    <Route path='/admin/especialidades' element={<EspecialidadesPage />} />
                    <Route path='/admin/usuarios' element={<UsuariosPage />} />
                    <Route path='/admin/roles' element={<RolesPage />} />
                    <Route path='/admin/configuracion' element={<ConfiguracionPage />} />
                  </Route>
                </Routes>
              </AppLayout>
            </UserProfileProvider>
          </LocalizationProvider>
        </BrowserRouter>
      </ParamsProvider>
    </ThemeProvider>
  )
}

export default App
