import { Box, Typography, Grid, Link } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import Carousel from '../components/Carousel'

// Simulación de mensaje de BD
const ubicacionMensaje = "Estamos en Av. América #459, entre Av. Santa Cruz y Pantaleón Dalence. ¡Te esperamos!";

export default function Home() {
  return (
    <>
      <Box>
        <Carousel />

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
    </>
  );
}
