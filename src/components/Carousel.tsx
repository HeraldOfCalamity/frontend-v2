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
        right: -20,
        transform: "translateY(-50%)",
        zIndex: 2,
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${t.palette.divider}`,
        '&:hover': { bgcolor: 'background.paper' }
      }}
      size="small"
      aria-label="Siguiente especialidad"
    >
      <ArrowCircleRightRounded fontSize="large" sx={{ opacity: 0.7, ":hover": { opacity: 1 } }} />
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
        left: -20,
        transform: "translateY(-50%)",
        zIndex: 2,
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${t.palette.divider}`,
        '&:hover': { bgcolor: 'background.paper' }
      }}
      size="small"
      aria-label="Anterior especialidad"
    >
      <ArrowCircleLeft fontSize="large" sx={{ opacity: 0.7, ":hover": { opacity: 1 } }} />
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
    <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: { xs: 1, sm: 2 } }}>
      <Slide direction="left" in={isTitleVisible} {...(isTitleVisible ? { timeout: 1000 } : {})}>
        <Typography component={'div'} variant="h4" align="left" fontWeight={800} gutterBottom ref={titleRef}>
          Nuestras Especialidades
        </Typography>
      </Slide>
      <Box
        sx={{
          // Estilo para crear padding entre slides
          '& .slick-slide > div': { px: { xs: 0.5, sm: 1.5 }, py: 1 },
          '& .slick-dots li button:before': { fontSize: 10 },
          '& .slick-dots li.slick-active button:before': { opacity: 0.9 },
        }}
      >

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
            { breakpoint: 600, settings: { slidesToShow: 1 } },
            { breakpoint: 1024, settings: { slidesToShow: 2 } },
          ]}
          prevArrow={<CustomPrevArrow />}
          nextArrow={<CustomNextArrow />}
        >
           {!isloading ? (
            especialidades.length > 0 ? (
              especialidades.map((esp) => (
                <EspecialidadCard
                  key={(esp as any).id ?? esp.nombre}
                  description={esp.descripcion}
                  name={esp.nombre}
                  image={esp.image}
                />
              ))
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">Pronto publicaremos nuestras especialidades.</Typography>
              </Box>
            )
          ) : (
            [1, 2, 3, 4].map((n) => <EspecialidadSkeleton key={n} />)
          )}
        </Slider>
      </Box>
    </Box>
  );
}


