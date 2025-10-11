import { Box, CircularProgress, Stack, Container, Typography, Button, Grid, Chip, useTheme, Tooltip, IconButton, Link, SvgIcon } from '@mui/material';
import { useRoleRedirect } from '../hooks/useRoleRedirect';
import { useAuth } from '../context/AuthContext';
import EspecialidadesCarousel from '../components/Carousel';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Facebook, Instagram, WhatsApp } from '@mui/icons-material';

const HERO_IMAGES = [
  "/images/clinica/adentro1-1600.webp",
  "/images/clinica/adentro2-1600.webp",
  "/images/clinica/adentro3-1600.webp",
  "/images/clinica/adentro4-1600.webp",
  "/images/clinica/adentro5-1600.webp",
  "/images/clinica/adentro6-1600.webp",
] as const;




const DISPLAY_MS = 5200; // tiempo visible de cada imagen
const FADE_MS = 900;     // duración del cross-fade


function ResponsiveImage({
  alt,
  src800,
  src1600,
  sx,
}: { alt: string; src800: string; src1600: string; sx?: any }) {
  return (
    <Box
      component="picture"
      sx={{
        display: 'block',
        width: '100%',
        '& img': { width: '100%', height: 'auto', display: 'block' },
        ...sx,
      }}
    >
      <source srcSet={src1600} media="(min-width: 900px)" type="image/webp" />
      <source srcSet={src800} media="(max-width: 899px)" type="image/webp" />
      <img src={src800} alt={alt} loading="lazy" />
    </Box>
  );
}

const ubicacionMensaje = "Estamos en Av. América #459, entre Av. Santa Cruz y Pantaleón Dalence. ¡Te esperamos!";

function loadImage(src: string) {
  return new Promise<void>((res, rej) => {
    const img = new Image();
    img.onload = () => res();
    img.onerror = () => rej();
    img.src = src;
  });
}

function HeroSection() {
  const theme = useTheme();
  const navigate = useNavigate();

  // Doble capa: A y B
  const [urlA, setUrlA] = useState<string>(HERO_IMAGES[0]);
  const [urlB, setUrlB] = useState<string>(HERO_IMAGES[1]);
  const [visible, setVisible] = useState<"A" | "B">("A");

  // Refs para control interno del loop (no re-renderizan)
  const idxRef = useRef(0);
  const visRef = useRef<"A" | "B">("A");
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const cycle = async () => {
      while (!cancelledRef.current) {
        // 1) espera el tiempo visible
        await new Promise(r => setTimeout(r, DISPLAY_MS));
        if (cancelledRef.current) break;

        // 2) calcular siguiente imagen y pre-cargar
        const nextIdx = (idxRef.current + 1) % HERO_IMAGES.length;
        const nextUrl = HERO_IMAGES[nextIdx];

        if (visRef.current === "A") setUrlB(nextUrl);
        else setUrlA(nextUrl);

        try { await loadImage(nextUrl); } catch {}

        // 3) asegurar repintado antes de animar (evita "tick")
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        // 4) disparar cross-fade
        const nextVis = visRef.current === "A" ? "B" : "A";
        setVisible(nextVis);
        visRef.current = nextVis;

        // 5) esperar fin del fade, consolidar índice y seguir
        await new Promise(r => setTimeout(r, FADE_MS));
        idxRef.current = nextIdx;
      }
    };

    cycle();
    return () => { cancelledRef.current = true; };
  }, []);

  // Overlay neutro (si quieres cero overlay: usa 'transparent')
  const overlayBg = `linear-gradient(
    180deg,
    ${theme.palette.background.paper}00 0%,
    ${theme.palette.background.paper}12 55%,
    ${theme.palette.background.paper}40 100%
  )`;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        px: { xs: 2, md: 6 },
        py: { xs: 6, md: 10 },
        background: theme => theme.palette.background.paper, // blanco
      }}
    >
      {/* Capa A */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${urlA})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(6%)',
          opacity: visible === "A" ? 0.40 : 0,
          transition: `opacity ${FADE_MS}ms cubic-bezier(.4,0,.2,1)`,
          willChange: 'opacity',
          pointerEvents: 'none',
        }}
      />
      {/* Capa B */}
      <Box
        aria-hidden
        sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${urlB})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(6%)',
          opacity: visible === "B" ? 0.40 : 0,
          transition: `opacity ${FADE_MS}ms cubic-bezier(.4,0,.2,1)`,
          willChange: 'opacity',
          pointerEvents: 'none',
        }}
      />

      {/* Overlay neutro para contraste (sin rosa) */}
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, background: overlayBg }} />

      {/* CONTENIDO */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Chip
          label="Salud & Bienestar • Atención profesional"
          color="secondary"
          variant="filled"
          sx={{ mb: 2, fontWeight: 600 }}
        />
        <Typography variant="h3" fontWeight={800} lineHeight={1.1}>
          Tu cuidado comienza aquí.
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mt: 1, maxWidth: 720 }}>
          Reserva tu cita en segundos y conoce nuestras especialidades. Agenda, historial clínico y recordatorios automáticos en un solo lugar.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
          
          <Button
            size="large"
            variant="contained"
            color='secondary'
            onClick={() => {
              const el = document.getElementById('especialidades');
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            Ver especialidades
          </Button>
        </Stack>

        <Grid container spacing={2} sx={{ mt: 4 }}>
          {[
            { title: 'Reserva fácil', desc: 'Horarios claros y confirmación al instante.' },
            { title: 'Recordatorios', desc: 'Alertas por correo para no olvidar.' },
            // { title: 'Historial seguro', desc: 'Tu información, protegida y disponible.' },
          ].map((b) => (
            <Grid key={b.title} size={{xs:12, sm:4}}>
              <Box
                sx={{
                  p: 2, borderRadius: 2,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  bgcolor: (t) => (t.palette.mode === 'dark' ? 'background.paper' : 'background.default'),
                }}
              >
                <Typography fontWeight={700}>{b.title}</Typography>
                <Typography variant="body2" color="text.secondary">{b.desc}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}


function StatsStrip() {
  return (
    <Container maxWidth="lg" sx={{ py: 1 }}>
      <Grid container spacing={2}>
        {[
          // { k: '+1.5k', v: 'Citas gestionadas' },
          { k: '24/7',  v: 'Reserva online' },
          { k: '100%',  v: 'Datos protegidos' },
        ].map((s) => (
          <Grid size={{xs: 12, sm: 6}} key={s.v}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" fontWeight={800}>{s.k}</Typography>
              <Typography color="text.secondary">{s.v}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

function UbicacionStrip() {
  return (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        px: { xs: 2, md: 6 },
        py: { xs: 4, md: 6 },
        mb: 6,
        overflow: 'hidden',

        // Fondo con más presencia: gradient + patrón sutil
        background: (t) => `
          linear-gradient(180deg, ${t.palette.background.paper} 0%, ${t.palette.background.default} 100%)
        `,
        '&:before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(255,255,255,.025) 0 12px, rgba(255,255,255,0) 12px 24px)',
          pointerEvents: 'none',
        },
        border: (t) => `1px solid ${t.palette.divider}`,
        boxShadow: (t) => (t.palette.mode === 'dark'
          ? '0 10px 28px rgba(0,0,0,.35)'
          : '0 10px 28px rgba(0,0,0,.12)'),
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" fontWeight={800} gutterBottom>
              ¿Dónde estamos?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Estamos en Av. América #459, entre Av. Santa Cruz y Pantaleón Dalence. ¡Te esperamos!
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                color='info'
                variant="contained"
                onClick={() =>
                  window.open('https://maps.google.com/?q=Av.+América+459+Cochabamba', '_blank')
                }
              >
                Abrir en Google Maps
              </Button>
            </Stack>

            {/* Mapa debajo de los botones */}
            <Box
              sx={{
                mt: 2,
                borderRadius: 3,
                overflow: 'hidden',
                border: (t) => `1px solid ${t.palette.divider}`,
                boxShadow: (t) =>
                  t.palette.mode === 'dark'
                    ? '0 6px 18px rgba(0,0,0,.35)'
                    : '0 6px 18px rgba(0,0,0,.12)',
              }}
            >
              <Box
                component="iframe"
                title="Mapa ubicación"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Av.+Am%C3%A9rica+459,+Cochabamba&output=embed"
                style={{ width: '100%', height: 320, border: '0' }}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: (t) =>
                  t.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,.4)' : '0 8px 24px rgba(0,0,0,.12)',
              }}
            >
              <ResponsiveImage
                alt="Fachada del centro Benedetta Bellezza"
                src800="/images/clinica/afuera-800.webp"
                src1600="/images/clinica/afuera-1600.webp"
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}


const HomeRedirect: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  useRoleRedirect();

  if (isAuthenticated && isLoading) return <CircularProgress />;

  return (
    <Box>
      <Stack spacing={4} sx={{ my: 3 }}>
        <HeroSection />
        <UbicacionStrip />
        {/* <StatsStrip /> */}

        {/* Carrusel de especialidades */}
        <Box id="especialidades">
          <EspecialidadesCarousel />
        </Box>
      </Stack>
    </Box>
  );
};

export default HomeRedirect;
