import { Typography } from '@mui/material'
import AppLayout from './layouts/AppLayout';

function App() {
  return (
    <AppLayout>
      <Typography variant="h4" align="center" sx={{ mt: 4 }}>
        Bienvenido a la Aplicación Web de Programación de Citas Médicas
      </Typography>
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        Moderniza la gestión clínica del consultorio con IA y registro asistido por voz.
      </Typography>
    </AppLayout>
  );
}

export default App
