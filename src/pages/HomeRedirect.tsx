import { Box, CircularProgress, Grid, Stack } from '@mui/material';
import { useRoleRedirect } from '../hooks/useRoleRedirect';
import { useAuth } from '../context/AuthContext';
import Carousel from '../components/Carousel'
import Slider from 'react-slick';

const ubicacionMensaje = "Estamos en Av. América #459, entre Av. Santa Cruz y Pantaleón Dalence. ¡Te esperamos!";

const HomeRedirect: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  useRoleRedirect();

  
  return (
    <Box>
      {isAuthenticated && isLoading ? (
        <CircularProgress />
      ) : (
        <Stack spacing={2}>
          {/* <Box
            sx={{
              bgcolor: 'transparent',
              borderRadius: 2,
              p:2,
              minHeight: '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Grid container spacing={2} border={1} flexGrow={1}>
              <Grid size={{xs:12, md:6}} border={1}>
                <Slider
                  dots
                  infinite
                  speed={500}
                  slidesToShow={1}
                  slidesToScroll={1}
                >
                  
                </Slider>
              </Grid>
              <Grid size={{xs:12, md:6}} border={1}>

              </Grid>
            </Grid>
          </Box> */}

          <Box sx={{
              background: theme =>  `linear-gradient(to left, transparent 0%, ${theme.palette.background.default} 50%, transparent 100%)`,
              borderRadius: 2
            }} bgcolor={theme => theme.palette.background.default} minHeight={'70vh'}> {/** Presentación */}
            <Carousel />
          </Box>



        </Stack>
      )}
    </Box>
  );
};

export default HomeRedirect;
