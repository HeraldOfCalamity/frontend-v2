import Slider from "react-slick";
import { Typography, Box, IconButton, Slide } from "@mui/material";
import { ArrowCircleLeft, ArrowCircleRightRounded } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import { getEspecialidades, type Especialidad } from "../api/especialidadService";
import EspecialidadSkeleton from "./Skeletons/EspecialidadSkeleton";
import EspecialidadCard from "./EspecialidadCard";
import Swal from "sweetalert2";



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

  const obtenerEspecialidades = async () => {
    try{
      const response = await getEspecialidades();
      setEspecialidades(response);
    }catch(err: any){
      Swal.fire(
        'Error',
        `${err}`,
        'error'
      )
    }finally{
      setIsLoading(false);
    }

  }

  useEffect(() => {
    setIsLoading(true);
    obtenerEspecialidades();
  }, [])

  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isTitleVisible, setIsTitleVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if(!titleRef.current) return;
      const rect = titleRef.current.getBoundingClientRect();

      const visible = rect.top <= window.innerHeight && rect.bottom >= 0;
      setIsTitleVisible(visible);
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [])

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", my: 4 }}>
      <Slide 
        direction="left" 
        in={isTitleVisible} 
        {...(isTitleVisible ? { timeout: 1000 } : {})}
      >
        <Typography 
          component={'div'} 
          variant="h4" 
          align="left" 
          fontWeight={700} 
          gutterBottom 
          ref={titleRef} 
        >
          Nuestras Especialidades
        </Typography>
      </Slide>
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
                description={esp.descripcion}
                name={esp.nombre}
                image={esp.image}
                />
            )) : [1,2,3,4].map((n) => (
              <EspecialidadSkeleton key={n} />
            ))}
        </Slider>
    </Box>
  );
}
