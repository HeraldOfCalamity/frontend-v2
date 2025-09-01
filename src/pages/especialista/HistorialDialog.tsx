import { 
    Box,
    Button, 
    Container, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogTitle, 
    Grid, 
    InputLabel, 
    Stack, 
    TextField, 
    Typography 
} from "@mui/material";
import { benedettaPink } from "../../config/theme.config";

interface HistorialDialogProps{
    open: boolean;
    onClose: () => void;
}

export default function HistorialDialog({
    onClose,
    open
}: HistorialDialogProps){

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            fullScreen
        >
            <DialogContent>
                <Container>
                    <DialogTitle variant="h3">
                        Historial Clinico
                    </DialogTitle>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h5" fontWeight={500} textAlign={'center'} bgcolor={benedettaPink} p={2} border={1}>
                                Identificación del Usuario/Paciente
                            </Typography>
                            <Grid spacing={2} p={2} container borderLeft={1} borderRight={1} borderBottom={1}>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        N° de HC
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'HC218973'}
                                        slotProps={{
                                            input:{
                                                readOnly: true,
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        Nombres y Apellidos
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'Leonardo Rene Eguino Vasquez'}                                slotProps={{
                                            input:{
                                                readOnly: true,
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        Edad
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'22'}                                
                                        slotProps={{
                                            input:{
                                                readOnly: true,
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        Fecha de Nacimiento
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'1/8/2002'}                                
                                        slotProps={{
                                            input:{
                                                readOnly: true,
                                                
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        Estado Civil
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'Casado'}                                
                                        slotProps={{
                                            input:{
                                                readOnly: true,
                                                
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        C.I.
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'8998787'}
                                        slotProps={{
                                            input:{
                                                readOnly: true,
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        Sexo
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'M'}
                                        slotProps={{
                                            input:{
                                                readOnly: true,
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        Domicilio
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'Hermanos Sejas'}
                                        slotProps={{
                                            input:{
                                                readOnly: true,
                                            }
                                        }}
                                    />
                                </Grid>
                                <Grid size={{xs: 6, md: 4}}>
                                    <InputLabel>
                                        Teléfono
                                    </InputLabel>
                                    <TextField
                                        variant="standard"
                                        fullWidth
                                        value={'79725695'}
                                        slotProps={{
                                            input:{
                                                readOnly: true,
                                            }
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={500} textAlign={'center'} bgcolor={benedettaPink} p={2} border={1}>
                                Anamnesis
                            </Typography>
                            <Grid container>
                            </Grid>
                        </Box>
                    </Stack>
                </Container>
            </DialogContent>
            <DialogActions>
                <Button
                    color="error"
                    variant="contained"
                    onClick={() => onClose()}
                >
                    Terminar Atención
                </Button>
            </DialogActions>
        </Dialog>
    )
}