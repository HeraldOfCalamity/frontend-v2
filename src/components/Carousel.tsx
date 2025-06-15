import Slider from "react-slick";
import { Card, CardContent, Typography, Box, IconButton, CardMedia } from "@mui/material";
import { ArrowBackIos, ArrowCircleLeft, ArrowCircleRightRounded, ArrowForwardIos } from "@mui/icons-material";

const especialidades = [
  { nombre: "Fisioterapia Dermatofuncional", descripcion: "Tratamientos para la piel y tejidos subyacentes.", imagen: 'data:image/jpeg;base64,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' },
  { nombre: "Fisioterapia y kinesiología", descripcion: "Rehabilitación traumatológica y neurológica." },
  { nombre: "Medicina Estética", descripcion: "Procedimientos médicos para mejorar la apariencia." },
  { nombre: "Rehabilitación de suelo pélvico femenino", descripcion: "Tratamientos para salud pélvica femenina." },
  { nombre: "Gineco-Estética", descripcion: "Salud y estética ginecológica." },
  { nombre: "Ginecología y Obstetricia", descripcion: "Salud integral de la mujer." },
  { nombre: "Nutrición y Dietética", descripcion: "Planificación y orientación alimentaria." },
  { nombre: "Quiropraxia y Osteopatía", descripcion: "Terapias manuales y manipulación corporal." },
];

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

export default function EspecialidadesCarousel() {
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
            {especialidades.map((esp) => (
            <Box key={esp.nombre} p={2}>
                <Card elevation={7} sx={{height: 350}}>
                    <CardMedia 
                        sx={{height: 140}}
                        image={esp.imagen}
                        title={`Imagen ${esp.nombre}`}
                        />
                    <CardContent>
                        <Typography variant="h6" align="center" fontWeight={600}>
                        {esp.nombre}
                        </Typography>
                        <Typography variant="body2" align="center" color="text.secondary">
                        {esp.descripcion}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
            ))}
        </Slider>
    </Box>
  );
}
