import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { darkTheme, lightTheme } from './config/theme.config';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import PerfilPaciente from './pages/PerfilPaciente';
import PerfilEspecialista from './pages/PerfilEspecialista';
import AdminDashboard from './pages/AdminDashboard';



function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

   useEffect(() => {
    setDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path='/' element={<Home />} />

            <Route element={<ProtectedRoute roles={['admin', 'patient']} />}>
              <Route path='/perfil/paciente' element={<PerfilPaciente />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin', 'especialist']} />}>
              <Route path='/perfil/especialista' element={<PerfilEspecialista />} />
            </Route>

            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path='/admin' element={<AdminDashboard />} />
            </Route>
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
