import { Box, Card, CardContent, CardMedia, Skeleton, Typography } from "@mui/material";
import { BASE_URL } from "../config/benedetta.api.config";

interface EspecialidadCardProps{
    name: string;
    description: string;
    image?: string;
}


const EspecialidadCard: React.FC<EspecialidadCardProps> = ({description, name, image}) => {
    const resolveImageSrc = (val?: string) => {
            if (!val) return "";
            if (val.startsWith("data:")) return val;        // base64 del FileReader
            if (val.startsWith("blob:")) return val;        // object URL local
            if (/^https?:\/\//i.test(val)) return val;      // URL firmada absoluta (R2/S3/CDN)
            if (val.startsWith("/")) return `${BASE_URL}${val}`; // ruta relativa tipo /static/...
            // si te llega una KEY S3 (ej. "especialidades/uuid.webp"), pide URL firmada:
            return `${BASE_URL}/especialidades/images/signed-get?key=${encodeURIComponent(val)}`;
        };
    const src = resolveImageSrc(image)
    return (
        <Box key={name} p={2}>
            <Card elevation={7} sx={{height: 350, overflowY: 'auto'}} >
                {image ? (
                    <CardMedia
                        sx={{ height: 140, display: image ? "block" : "none" }}
                        image={src}
                        title={`Imagen ${name}`}
                    />
                ) : (
                    <Skeleton variant="rectangular" height={140} />
                )}
                <CardContent>
                    <Typography variant="h6" align="center" fontWeight={600}>
                    {name}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                    {description}
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    )
}

export default EspecialidadCard;