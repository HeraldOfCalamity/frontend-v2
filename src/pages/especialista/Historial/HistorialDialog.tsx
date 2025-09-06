import { 
    Alert,
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
import { benedettaPink } from "../../../config/theme.config";
import Anamnesis from "./Anamnesis";
import { useEffect, useState } from "react";
import { Mic, MicOff } from "@mui/icons-material";
import Swal from "sweetalert2";
import { useSpeech, useSpeechCommands } from "../../../context/SpeechContext";
import Evolucion from "./Evolucion";

interface HistorialDialogProps{
    open: boolean;
    onClose: () => void;
}
interface Tab{
    name: string;
    component: React.ReactNode;
}


export default function HistorialDialog({
    onClose,
    open
}: HistorialDialogProps){
    
    const {
        listening,
        isMicrophoneAvailable,
        browserSupportsSpeechRecognition,
        dictationEnabled,
        start,
        stop
    } = useSpeech();

   
    const HISTORIAL_TABS: Tab[] = [
        {
            name: 'anamnesis',
            component: <Anamnesis/>
        },
        {
            name: 'evolución',
            component: <Evolucion />
        }
    ]
    const [selectedTab, setSelectedTab] = useState<Tab>(HISTORIAL_TABS[0]);

    const handleStartDictaphone = () => start({language: 'es-BO'});

    const handlePauseDictaphone = () => stop();

    useEffect(() => {
        if(!browserSupportsSpeechRecognition){
            Swal.fire(
                'Atención',
                'El navegador no soporta el dictado!',
                'warning'
            )
            return;
        }
  
            // start();

    }, [])


    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            fullScreen
            
        >
            <DialogContent >
                <Container >
                    <DialogTitle variant="h3">
                        Historial Clinico
                    </DialogTitle>
                    <Stack spacing={2}>
                        <Box>
                            <Typography variant="h5" fontWeight={500} textAlign={'center'} bgcolor={benedettaPink} p={2} border={2} borderRadius={2}>
                                Identificación del Usuario/Paciente
                            </Typography>
                            <Grid spacing={2} p={2} container borderLeft={2} borderRight={2} borderBottom={2}>
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
                            <Stack direction={'row'} spacing={1} ml={2}>
                                {HISTORIAL_TABS.map(tab => 
                                    <Button key={tab.name} onClick={() => setSelectedTab(tab)} variant="text" sx={{
                                        borderTop: 2,
                                        borderRight: 2,
                                        borderLeft: 2,
                                        color: theme => theme.palette.common.black,
                                        bgcolor: tab.name === selectedTab.name ? benedettaPink : 'inherit',
                                        textTransform: 'capitalize'
                                    }}>
                                        {tab.name}
                                    </Button>
                                )}
                            </Stack>
                            <Box border={4} borderRadius={2} borderColor={theme => 
                                    selectedTab.name === 'anamnesis' ?
                                        listening && dictationEnabled 
                                            ?  theme.palette.success.main 
                                            : theme.palette.error.main 
                                    : 'transparent'    
                                }>

                                <Box border={2} flexGrow={1} p={2} borderRadius={2}>
                                    <Typography variant="h5" fontWeight={500} textAlign={'center'} bgcolor={benedettaPink} p={2} border={1} gutterBottom textTransform={'capitalize'}>
                                        {selectedTab.name}
                                    </Typography>

                                    <Stack direction={'row'} spacing={2} mb={2}>
                                        {selectedTab.name === 'anamnesis' && (
                                            <Button 
                                                fullWidth 
                                                size="large" 
                                                variant="contained" 
                                                startIcon={<Mic />}
                                                onClick={() => handleStartDictaphone()}
                                            >
                                                Iniciar Dictado
                                            </Button>
                                        )}
                                        
                                        {/* <Button 
                                            fullWidth 
                                            size='large' 
                                            variant='contained' 
                                            color="secondary" 
                                            startIcon={<MicOff />}
                                            onClick={() => handlePauseDictaphone()}
                                        >
                                            Pausar Dictado
                                        </Button> */}
                                    </Stack>
                                    {
                                        !isMicrophoneAvailable && (
                                            <Alert severity={'error'} sx={{height:50, mt: 1}}>
                                                El micrófono no está disponible o sin permisos.
                                            </Alert>
                                        )
                                    }
                                    {
                                        selectedTab.component
                                    }
                                </Box>
                            </Box>

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