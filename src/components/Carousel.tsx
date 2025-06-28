import Slider from "react-slick";
import { Typography, Box, IconButton, Snackbar } from "@mui/material";
import { ArrowCircleLeft, ArrowCircleRightRounded } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { getEspecialidades, type Especialidad } from "../api/especialidadService";
import EspecialidadSkeleton from "./Skeletons/EspecialidadSkeleton";
import EspecialidadCard from "./EspecialidadCard";



function CustomNextArrow(props: any) {
  const { onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "50%",
        right: -35,
        transform: "translateY(-50%)",
        zIndex: 2,
      }}
      size="small"
      aria-label="Siguiente especialidad"
    >
      <ArrowCircleRightRounded fontSize="large" sx={{opacity: 0.5, ":hover":{opacity: 1}}}/>
    </IconButton>
  );
}

function CustomPrevArrow(props: any) {
  const { onClick } = props;
  return (
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        top: "50%",
        left: -35,
        transform: "translateY(-50%)",
        zIndex: 2,
      }}
      size="small"
      aria-label="Anterior especialidad"
    >
      <ArrowCircleLeft fontSize="large" sx={{opacity: 0.5, ":hover":{opacity: 1}}}/>
    </IconButton>
  );
}

interface FetchError{
  error: boolean;
  errorMessage?: string;
  duration?: number;
}

export default function EspecialidadesCarousel() {
  const [isloading, setIsLoading] = useState(true);
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [fetchError, setFetchError] = useState<FetchError>({error: false, errorMessage: '', duration: 0});

  const obtenerEspecialidades = async () => {
    try{
      const response = await getEspecialidades();
      setIsLoading(false);
      setEspecialidades(response);
    }catch(e){
      setFetchError({
        error: true,
        duration: 4200,
        errorMessage: "There was an error fetching especialidades" + e
      })
    }

  }

  useEffect(() => {
    setIsLoading(true);
    obtenerEspecialidades();
  }, [])


  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", my: 4 }}>
      <Typography variant="h4" color="primary" align="center" fontWeight={700} gutterBottom>
        Nuestras Especialidades
      </Typography>
        <Slider 
            centerMode
            dots
            infinite
            autoplay
            draggable
            slidesToShow={2}
            slidesToScroll={1}
            autoplaySpeed={5600}
            responsive={[
                {breakpoint: 600, settings: {slidesToShow: 1}},
                {breakpoint: 1024, settings: {slidesToShow: 2}},
            ]}
            prevArrow={<CustomPrevArrow />}
            nextArrow={<CustomNextArrow />}
            >
            {!isloading ? especialidades.map((esp) => (
              <EspecialidadCard
                description={esp.description}
                name={esp.name}
                image={esp.image}
                />
            )) : [1,2,3,4].map((n) => (
              <EspecialidadSkeleton key={n} />
            ))}
        </Slider>
        <Snackbar
          open={fetchError.error}
          autoHideDuration={fetchError.duration}
          message={fetchError.errorMessage}
          />
    </Box>
  );
}
