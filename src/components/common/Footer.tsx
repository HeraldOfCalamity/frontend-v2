import { Facebook, Instagram, WhatsApp } from "@mui/icons-material";
import { Box, Container, Grid, IconButton, Link, Stack, Tooltip, Typography } from "@mui/material"

const SOCIALS = {
  tiktok:   'https://www.tiktok.com/@tu_usuario',
  facebook: 'https://www.facebook.com/tu_pagina',
  instagram:'https://www.instagram.com/tu_usuario',
  whatsapp: 'https://wa.me/59170000000', // cambia al número real (formato internacional)
} as const;

export default function Footer() {
  const SocialBtn = ({
    title, href, children,
  }: { title: string; href: string; children: React.ReactNode }) => (
    <Tooltip title={title}>
      <IconButton
        component={Link}
        href={href}
        target="_blank"
        rel="noopener"
        aria-label={title}
        sx={{
          width: 44, height: 44, borderRadius: 2,
          border: (t) => `1px solid ${t.palette.divider}`,
          bgcolor: 'background.paper',
          transition: 'transform .15s ease',
          '&:hover': { transform: 'translateY(-2px)' },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box
      component="footer"
      sx={{
        mt: 6, pt: 4, pb: 6,
        borderTop: (t) => `1px solid ${t.palette.divider}`,
        bgcolor: (t) => t.palette.grey[400],
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs:12, md:7}}>
            <Typography variant="h6" fontWeight={800}>
              Benedetta Bellezza
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Av. América #459, entre Av. Santa Cruz y Pantaleón Dalence · Cochabamba
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Atención: Lun–Sáb 08:00–20:00
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              © {new Date().getFullYear()} Benedetta Bellezza · Todos los derechos reservados
            </Typography>
          </Grid>

          <Grid size={{xs:12, md:7}}>
            <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              {/* TikTok con tu PNG */}
              <SocialBtn title="TikTok" href={SOCIALS.tiktok}>
                <Box
                  component="img"
                  src="/images/icons/tik-tok.png"
                  alt=""
                  sx={{
                    width: 22, height: 22,
                    filter: (t) => (t.palette.mode === 'dark' ? 'invert(1)' : 'none'),
                  }}
                />
              </SocialBtn>

              <SocialBtn title="Instagram" href={SOCIALS.instagram}>
                <Instagram />
              </SocialBtn>
              <SocialBtn title="Facebook" href={SOCIALS.facebook}>
                <Facebook />
              </SocialBtn>
              <SocialBtn title="WhatsApp" href={SOCIALS.whatsapp}>
                <WhatsApp />
              </SocialBtn>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
