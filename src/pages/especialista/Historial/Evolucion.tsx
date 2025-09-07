import { AddCircleOutline, Mic, MicOff } from "@mui/icons-material";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, Stack, Typography, useMediaQuery, useTheme, InputLabel,
  Link
} from "@mui/material";
import GenericTable, { type Column } from "../../../components/common/GenericTable";
import dayjs from "dayjs";
import ImagePreviewDialog from "../../../components/common/ImagePreviewDialog";
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSpeech, useSpeechCommands } from "../../../context/SpeechContext";
import InputFileUpload from "../../../components/InputFileUpload";
import type { HistorialClinico } from "../../../api/historialService";

interface Entrada{
  id: string,
  createdAt: string,
  recursosTerapeuticos: string,
  evolucionText: string,
  evolucionImage?: string
}

const entries: Entrada[] = [
  {
    id: 'EV-2025-08-15-001',
    createdAt: '2025-08-15',
    recursosTerapeuticos: 'Evaluación inicial, educación del paciente, higiene postural',
    evolucionText: `S: Refiere dolor anterior de rodilla derecha 7/10 (EVA) post actividad.
O: Tumefacción leve, T° normal, ROM flex 110°, ext -5°, fuerza cuad 3/5.
A: Síndrome femoropatelar probable; déficit de control proximal y extensores.
P: Educar sobre carga, hielo 10’, ejercicios isométricos de cuádriceps (3x10), PUCP domiciliario.`,
    evolucionImage: 'https://picsum.photos/seed/ev1/800/600'
  },
  {
    id: 'EV-2025-08-18-002',
    createdAt: '2025-08-18',
    recursosTerapeuticos: 'TENS analgésico, crioterapia, movilización patelar grado I-II',
    evolucionText: `S: Dolor disminuyó a 6/10. Sensación de rigidez matutina.
O: ROM flex 115°, ext -3°. Test compresión patelar (+) leve. Marcha antálgica leve.
A: Respuesta favorable al control de dolor; persiste hipomovilidad patelar.
P: TENS 15’, crioterapia 10’, movilización patelar, isométricos + straight leg raise (3x10).`,
  },
  {
    id: 'EV-2025-08-20-003',
    createdAt: '2025-08-20',
    recursosTerapeuticos: 'Ultrasonido 3 MHz, activación VM, estiramientos isquios',
    evolucionText: `S: Dolor 5/10 tras subir escaleras.
O: ROM flex 120°, ext 0°. VMO con retraso de activación. Balance unipodal 10 s.
A: Mejora del rango y dolor; déficit de control medial patelar.
P: US 6’, activación VMO con biofeedback, mini sentadillas 0–30° (3x12), estiramiento isquios.`,
  },
  {
    id: 'EV-2025-08-22-004',
    createdAt: '2025-08-22',
    recursosTerapeuticos: 'Terapia manual (liberación miofascial), kinesiotaping patelar',
    evolucionText: `S: Reporta alivio al caminar, dolor 4/10.
O: Menor hipertonía en vasto lateral; tracking patelar mejora con taping.
A: Buena respuesta a control de vectores patelares.
P: Liberación VL, tape correctivo, puente glúteo (3x12), clam shells con banda (3x15).`,
    evolucionImage: 'https://picsum.photos/seed/ev2/800/600'
  },
  {
    id: 'EV-2025-08-24-005',
    createdAt: '2025-08-24',
    recursosTerapeuticos: 'Propiocepción, bosu, excéntricos de cuádriceps',
    evolucionText: `S: Dolor 3/10 al agacharse prolongado.
O: Balance unipodal 20 s, control valgo dinámico leve en sentadilla.
A: Progresar a trabajo excéntrico y control de rodilla en plano frontal.
P: Sentadilla a caja (3x10), step-down 15 cm (3x8), propiocepción en bosu 3x30 s.`,
  },
  {
    id: 'EV-2025-08-26-006',
    createdAt: '2025-08-26',
    recursosTerapeuticos: 'Bicicleta estática, termoterapia pre-ejercicio',
    evolucionText: `S: Toleró tareas domésticas sin aumento de dolor >3/10.
O: ROM completo sin dolor final; fuerza cuad 4-/5.
A: Aumentar volumen y controlar técnica.
P: Calentamiento 8’, sentadilla goblet ligera (3x10), puente unilateral (3x10), estiramientos 5’.`,
  },
  {
    id: 'EV-2025-08-28-007',
    createdAt: '2025-08-28',
    recursosTerapeuticos: 'Reeducación de marcha, ejercicios de cadena posterior',
    evolucionText: `S: Dolor 2/10 al final del día.
O: Cadencia y zancada simétricas; leve caída de pelvis contralateral.
A: Déficit de estabilidad pelviana; foco en glúteo medio.
P: Marcha consciente, monster walks (3x12), step-up lateral (3x10), control de valgo frente a espejo.`,
  },
  {
    id: 'EV-2025-08-30-008',
    createdAt: '2025-08-30',
    recursosTerapeuticos: 'Punción seca (VL), crioterapia post-intervención',
    evolucionText: `S: Dolor puntual 3/10 al bajar escaleras.
O: Trigger Points en VL disminuyen tras punción; mejora tracking funcional.
A: Descarga miofascial efectiva; mantener progresión.
P: Punción seca selectiva, crioterapia 10’, excéntricos de cuádriceps en inclinación (3x8).`,
    evolucionImage: 'https://picsum.photos/seed/ev3/800/600'
  },
  {
    id: 'EV-2025-09-02-009',
    createdAt: '2025-09-02',
    recursosTerapeuticos: 'Circuito funcional, pliometría baja, propiocepción avanzada',
    evolucionText: `S: Sin dolor en AVDs; 1–2/10 post ejercicio intenso.
O: Step-down con buen control; salto bipodal suave sin dolor.
A: Listo para reintroducción gradual de impacto.
P: Skips suaves, saltos bipodales controlados (3x8), aterrizajes con énfasis en alineación.`,
  },
  {
    id: 'EV-2025-09-03-010',
    createdAt: '2025-09-03',
    recursosTerapeuticos: 'Entrenamiento de fuerza progresiva, control neuromuscular',
    evolucionText: `S: Se siente confiado; dolor 0–1/10.
O: Fuerza cuad 4/5; test Y-balance dentro del 90% bilateral.
A: Continuar progresión de carga y impacto controlado.
P: Sentadilla 40–50% 1RM (3x8), zancadas caminando (3x12), saltos en línea (3x6).`,
  },
  {
    id: 'EV-2025-09-04-011',
    createdAt: '2025-09-04',
    recursosTerapeuticos: 'Taping preventivo, educación en retorno a la actividad',
    evolucionText: `S: Dolor 0/10 en reposo, 1/10 post carrera suave 10’.
O: Técnica de carrera aceptable; no hay derrame.
A: Alta funcional parcial con plan de retorno gradual.
P: Correr 2’/caminar 1’ x 6 rep, fuerza 2 días/sem, movilidad diaria.`,
    evolucionImage: 'https://picsum.photos/seed/ev4/800/600'
  },
  {
    id: 'EV-2025-09-05-012',
    createdAt: '2025-09-05',
    recursosTerapeuticos: 'Reevaluación, actualización de plan domiciliario (HEP)',
    evolucionText: `S: Asintomático en AVDs; tolera escaleras sin dolor.
O: Fuerza cuad 4+/5, ROM completo, balance unipodal 30 s estable.
A: Objetivos a corto plazo cumplidos; continuar consolidación.
P: HEP 4–6 semanas: fuerza 2–3x/sem, impacto bajo progresivo, chequeo en 3 semanas.`,
  }
];

/* ========= Campos y estado de dictado en el diálogo ========= */
type EvoField = 'recursos' | 'evolucion';
type Store = Record<EvoField, string>;

/* ===== Limpieza “post” (no en vivo) ===== */
function cleanCommandsLater(text: string): string {
  const patterns: RegExp[] = [
    /(?:^|\s)silenciar\s+micr[oó]f?o?no?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)activar\s+micr[oó]f?o?no?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:recursos(?:\s+terap[eé]uticos)?)?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)dictar\s+(?:evoluci[oó]n(?:\s+del\s+tratamiento)?)?(?=\s|[.,;:!?]|$)/giu,
    /(?:^|\s)(?:terminar|detener|finalizar|parar)\s+dictado(?=\s|[.,;:!?]|$)/giu,
  ];
  let out = text;
  for (const re of patterns) out = out.replace(re, "");
  return out.replace(/\s{2,}/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
}

/* ===== Gate opcional por silencio (espera interino vacío) ===== */
function useExecuteWhenFinal(interimTranscript: string, delayMs = 450) {
  const timerRef = useRef<number | null>(null);
  const pendingRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!pendingRef.current) return;
    if (interimTranscript) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {}, delayMs);
      return;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const fn = pendingRef.current;
      pendingRef.current = null;
      fn?.();
    }, delayMs);
  }, [interimTranscript, delayMs]);

  return {
    schedule: (fn: () => void) => { pendingRef.current = fn; },
    cancel: () => { pendingRef.current = null; if (timerRef.current) window.clearTimeout(timerRef.current); },
  };
}

/* ===== Regex de comandos (anclados al final y esperando resultado final) ===== */
const END = String.raw`[\s.,;:!?]*$`;
const RE_SILENCIAR = new RegExp(String.raw`(?:^|\s)silenciar\s+micr(?:o|ó)fono${END}`, 'i');
const RE_ACTIVAR   = new RegExp(String.raw`(?:^|\s)activar\s+micr(?:o|ó)fono${END}`, 'i');
const RE_TERMINAR  = new RegExp(String.raw`(?:^|\s)(terminar|detener)\s+dictado${END}`, 'i');

const RE_DICTAR_RECURSOS = new RegExp(
  String.raw`(?:^|\s)dictar\s+(?:recursos(?:\s+terap[eé]uticos)?)${END}`, 'i'
);
const RE_DICTAR_EVOLUCION = new RegExp(
  String.raw`(?:^|\s)dictar\s+(?:evoluci(?:o|ó)n(?:\s+del\s+tratamiento)?)${END}`, 'i'
);

interface EvolucionProps{
  historial: HistorialClinico
}

export default function Evolucion({
  historial
}: EvolucionProps){
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedImage, setSelectedImage] = useState('');
  const [openImage, setOpenImage] = useState(false);
  const [openAddEntry, setOpenAddEntry] = useState(false);

  const {
    listening, dictationEnabled, start, stop,
    transcript, interimTranscript,
    enableDictation, disableDictation, resetAllTranscripts
  } = useSpeech();

  // ===== Estado de ruteo por campo (dentro del diálogo) =====
  const [active, setActive] = useState<EvoField>('recursos');
  const [store, setStore] = useState<Store>({ recursos: "", evolucion: "" });

  // anclas por campo
  const anchorsRef = useRef<Record<EvoField, number>>({
    recursos: transcript.length,
    evolucion: transcript.length
  });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Aquí puedes guardarlo en el estado, o mandarlo directo en el submit:
                // setPreview(base64String);
                // setValue("image", base64String);
                setSelectedImage(base64String)
            };
            reader.readAsDataURL(file);
        }
    };

  // detectar ON->OFF para consolidar lo hablado en curso
  const prevDictRef = useRef(dictationEnabled);
  useEffect(() => { prevDictRef.current = dictationEnabled }, [dictationEnabled]);

  // re-sync anclas si cambia la longitud por reset
  useEffect(() => {
    (Object.keys(anchorsRef.current) as EvoField[]).forEach(k => {
      if (anchorsRef.current[k] > transcript.length) anchorsRef.current[k] = transcript.length;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript.length]);

  // Consolida el tramo del campo activo (no se limpia en vivo)
  const commitActive = useCallback(() => {
    const startIdx = anchorsRef.current[active];
    const chunk = transcript.slice(startIdx);
    if (chunk) setStore(prev => ({ ...prev, [active]: prev[active] + chunk }));
    anchorsRef.current[active] = transcript.length;
  }, [active, transcript]);

  // Seleccionar campo (por comando o UI)
  const selectField = useCallback((next: EvoField) => {
    commitActive();
    setActive(next);
    anchorsRef.current[next] = transcript.length; // evita arrastrar la orden
  }, [commitActive, transcript.length]);

  // ON -> OFF: consolidar
  useEffect(() => {
    const prev = prevDictRef.current;
    if (prev && !dictationEnabled) commitActive();
  }, [dictationEnabled, commitActive]);

  // Vista del texto por campo (el activo muestra base + slice “en vivo”)
  const view = useMemo(() => {
    const liveSlice = dictationEnabled ? transcript.slice(anchorsRef.current[active]) : "";
    return {
      recursos:  active === 'recursos'  ? (store.recursos  + liveSlice) : store.recursos,
      evolucion: active === 'evolucion' ? (store.evolucion + liveSlice) : store.evolucion,
    } as Store;
  }, [store, active, dictationEnabled, transcript]);

  // ===== Registrar comandos locales (porque Anamnesis se desmonta) =====
  const execFinal = useExecuteWhenFinal(interimTranscript, 450);

  const evoCommands = useMemo(() => ([
    { command: RE_SILENCIAR, matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => disableDictation()) },
    { command: RE_ACTIVAR,   matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => {
      enableDictation();
      anchorsRef.current[active] = transcript.length;
    }) },
    { command: RE_TERMINAR,  matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => { commitActive(); stop(); }) },

    // Cambiar campo por voz:
    { command: RE_DICTAR_RECURSOS,  matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => selectField('recursos')) },
    { command: RE_DICTAR_EVOLUCION, matchInterim: false, bestMatchOnly: true, callback: () => execFinal.schedule(() => selectField('evolucion')) },

    // Limpieza total por voz (reseteo de provider + campos locales)
    {
      command: 'limpiar dictado',
      matchInterim: false,
      callback: () => execFinal.schedule(() => {
        resetAllTranscripts();
        setStore({ recursos: "", evolucion: "" });
        anchorsRef.current.recursos = transcript.length;
        anchorsRef.current.evolucion = transcript.length;
      })
    },
  ]), [active, commitActive, disableDictation, enableDictation, execFinal, resetAllTranscripts, selectField, stop, transcript.length]);

  useSpeechCommands(evoCommands, [evoCommands]);

  // ===== UI =====
  const columns: Column<Entrada>[] = [
    {
      field: 'recursosTerapeuticos',
      headerName: 'Recursos Terapeuticos',
      align: 'center',
      render: (v) => (
        <Box maxHeight={'14vh'}>
          {!isMobile ? v : (<Button>Leer</Button>)}
        </Box>
      )
    },
    {
      field: 'craetedAt',
      headerName: 'Fecha',
      align: 'center',
      render: (v) => dayjs(v).format('DD/MM/YYYY')
    },
    {
      field: 'evolucionText',
      headerName: 'Evolucion del tratamiento',
      align: 'center',
      render: (v) => (
        <Box maxHeight={'14vh'}>
          {!isMobile ? v : (<Button>Leer</Button>)}
        </Box>
      )
    },
    {
      field: 'evolucionImage',
      headerName: 'Imagen',
      align: 'center',
      render: (v) => v ? (
        <Button
          onClick={() => { setSelectedImage(`${v}`); setOpenImage(true); }}
          variant="text"
        >
          Ver Imagen
        </Button>
      ) : 'Sin Imagen'
    },
  ];

  const boxSx = (isActive: boolean) => ({
    height: '20vh',
    border: 2,
    borderColor: isActive ? 'success.main' : 'divider',
    borderRadius: 1,
    p: 1,
    whiteSpace: 'pre-wrap',
  });

  useEffect(() => {
    console.log('historial evolucion', historial)
  }, [])

  return (
    <>
      <Box>
        <Stack direction={'row'} justifyContent={'end'} mb={2}>
          <Button
            startIcon={<AddCircleOutline />}
            fullWidth
            color="secondary"
            variant="contained"
            onClick={() => setOpenAddEntry(true)}
          >
            Agregar Entrada
          </Button>
        </Stack>
        <GenericTable columns={columns} data={entries} />
      </Box>

      <ImagePreviewDialog
        open={openImage}
        onClose={() => setOpenImage(false)}
        image={selectedImage}
      />

      <Dialog
        maxWidth={"md"}
        fullWidth
        open={openAddEntry}
        onClose={() => setOpenAddEntry(false)}
      >
        <DialogContent>
          <DialogTitle>Agregar Registro de Evolución</DialogTitle>

          {/* Estado del dictado */}
          <Stack mb={2} direction="row" spacing={2} alignItems="center">
            <div>
              <InputLabel>Dictado (interim):</InputLabel>
              <Typography>{interimTranscript}</Typography>
            </div>
            <Button
              variant="outlined"
              onClick={() => {
                // Limpieza manual (post) de ambos campos
                setStore(prev => ({
                  recursos:  cleanCommandsLater(prev.recursos),
                  evolucion: cleanCommandsLater(prev.evolucion),
                }));
              }}
            >
              Limpiar comandos (post)
            </Button>
          </Stack>

          <Box sx={{
            border:4,
            borderRadius:2,
            p: 2,
            borderColor: theme =>
              listening && dictationEnabled
                ?  theme.palette.success.main
                : theme.palette.error.main
          }}>
            <Stack direction={'row'} mb={2} spacing={2}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                startIcon={<Mic />}
                onClick={() => start({ language: 'es-BO' })}
              >
                Iniciar Dictado
              </Button>
              <Button
                fullWidth
                size="large"
                variant="contained"
                color="secondary"
                startIcon={<MicOff />}
                onClick={() => { commitActive(); stop(); }}
              >
                Detener Dictado
              </Button>
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{xs: 12, md:6}}>
                <Typography variant="h6">Recursos Terapéuticos</Typography>
                <Box sx={boxSx(active === 'recursos')}>
                  {view.recursos}
                </Box>
              </Grid>

              <Grid size={{xs: 12, md:6}}>
                <Typography variant="h6">Evolución del Tratamiento</Typography>
                <Box sx={boxSx(active === 'evolucion')}>
                  {view.evolucion}
                </Box>
              </Grid>
            </Grid>
            <Stack mt={1} spacing={1}>
                <InputLabel>Fotografia</InputLabel>
                <InputFileUpload
                    label="Subir Captura" 
                    handleChange={handleImageChange} 
                    accept="image/"
                    color="secondary"
                    // disabled={isDisabled('image')}
                    variant={'outlined'}
                />
                {selectedImage && <Link 
                    component={'button'} 
                    type="button"
                    color="secondary"
                    textAlign={'center'} 
                    onClick={() => setOpenImage(true)}>
                    Ver imagen cargada
                </Link>}
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="contained" color="success">
            Grabar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => setOpenAddEntry(false)}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
