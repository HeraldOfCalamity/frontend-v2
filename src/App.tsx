import { Typography, Container } from '@mui/material'

function App() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Consultorio Benedetta Bellezza
      </Typography>
      <Typography variant="h6" align="center">
        Aplicación Web para Programación de Citas Médicas y Registro de Tratamientos
      </Typography>
    </Container>
  )
}

export default App
