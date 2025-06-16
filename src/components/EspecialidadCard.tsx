import { Box, Card, CardContent, CardMedia, Skeleton, Typography } from "@mui/material";

interface EspecialidadCardProps{
    name: string;
    description: string;
    image?: string;
}

const EspecialidadCard: React.FC<EspecialidadCardProps> = ({description, name, image}) => {
    return (
        <Box key={name} p={2}>
            <Card elevation={7} sx={{height: 350}}>
                <CardMedia
                    sx={{ height: 140, display: image ? "block" : "none" }}
                    image={image}
                    title={`Imagen ${name}`}
                />
                {!image && <Skeleton variant="rectangular" height={140} />}
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