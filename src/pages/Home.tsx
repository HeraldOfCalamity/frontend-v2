import { Box, Typography, Stack, Paper, Grid, Link } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';

// Simulación de mensaje de BD
const ubicacionMensaje = "Estamos en Av. América #459, entre Av. Santa Cruz y Pantaleón Dalence. ¡Te esperamos!";

export default function Home() {
  return (
    <Box sx={{border: 1}}>
      {/* SECCION ESPECIALIDADES */}
      <Box sx={{ textAlign: 'center', mt: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
          NUESTRAS ESPECIALIDADES
        </Typography>
        <Stack direction="row" spacing={3} justifyContent="center" alignItems="center" sx={{ py: 4 }}>
          {/* Simulación de "cards" de especialidad */}
          {[1, 2, 3, 4, 5].map((i) => (
            <Paper elevation={2} key={i} sx={{ width: 100, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body1">Especialidad {i}</Typography>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* SECCION UBICACION */}
      <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ my: 6 }}>
        <Grid size={6} sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            NUESTRA UBICACIÓN
          </Typography>
          {/* Aquí puedes poner un <img src={mapa} .../> real */}
          <Box sx={{ display: 'inline-block', border: '2px solid #ccc', borderRadius: 2, overflow: 'hidden', p: 1, mb: 1 }}>
            <MapIcon sx={{ fontSize: 100, color: '#ffa726' }} />
            {/* <img src="ruta/a/tu/mapa.png" alt="mapa" width={200}/> */}
          </Box>
        </Grid>
        <Grid size={6} sx={{ textAlign: 'center' }}>
          <Typography sx={{ mb: 2 }}>
            {ubicacionMensaje /* este mensaje debería venir de la BD */}
          </Typography>
          <Link href="https://maps.google.com" target="_blank" rel="noopener">
            ¿Cómo llegar?
          </Link>
        </Grid>
      </Grid>
    </Box>
  );
}
