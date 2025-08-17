import { Typography, Box, CircularProgress, Grid, Link } from '@mui/material';
import { useRoleRedirect } from '../hooks/useRoleRedirect';
import { useAuth } from '../context/AuthContext';
import MapIcon from '@mui/icons-material/Map';
import Carousel from '../components/Carousel'

const ubicacionMensaje = "Estamos en Av. América #459, entre Av. Santa Cruz y Pantaleón Dalence. ¡Te esperamos!";

const HomeRedirect: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  useRoleRedirect();
            // <Grid container spacing={2} alignItems="center" justifyContent="center" sx={{ my: 6 }}>
            //     <Grid size={6} sx={{ textAlign: 'center' }}>
            //         <Typography variant="h6" sx={{ mb: 2 }}>
            //         NUESTRA UBICACIÓN
            //         </Typography>
            //         {/* Aquí puedes poner un <img src={mapa} .../> real */}
            //         <Box sx={{ display: 'inline-block', border: '2px solid #ccc', borderRadius: 2, overflow: 'hidden', p: 1, mb: 1 }}>
            //         <MapIcon sx={{ fontSize: 100, color: '#ffa726' }} />
            //         {/* <img src="ruta/a/tu/mapa.png" alt="mapa" width={200}/> */}
            //         </Box>
            //     </Grid>
            //     <Grid size={6} sx={{ textAlign: 'center' }}>
            //         <Typography sx={{ mb: 2 }}>
            //         {ubicacionMensaje /* este mensaje debería venir de la BD */}
            //         </Typography>
            //         <Link href="https://maps.google.com" target="_blank" rel="noopener">
            //         ¿Cómo llegar?
            //         </Link>
            //     </Grid>
            // </Grid>
  return (
    <Box>
      {isAuthenticated && isLoading ? (
        <CircularProgress />
      ) : (
        <>
            {/* <Carousel /> */}


        </>
      )}
    </Box>
  );
};

export default HomeRedirect;
