import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Stack, Card, CardContent, Typography, Button,
  FormControl, Select, MenuItem, InputLabel, CircularProgress, Alert, Chip, Box, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  ListSubheader,
  Checkbox,
  ListItemText
} from "@mui/material";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { alpha, darken, useTheme } from "@mui/material/styles";
import { benedettaPink } from "../../config/theme.config";

// ---------- Tipos ----------
interface SerieMes { month: string; count: number }
interface ItemCount { key: string; count: number }
interface GroupedByMonth { month: string; items: ItemCount[]; total: number }
interface ReporteCitasOverview {
  rango: { from: string; to: string };
  totales_por_mes: SerieMes[];
  por_estado: GroupedByMonth[];
  por_especialidad: GroupedByMonth[];
  por_especialista: GroupedByMonth[];
  todos_los_especialistas?: string[];
}

// ---------- Config ----------
const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Logos (colócalos en /public/brand/)
const LOGO_HORIZONTAL = "/benedetta-bellezza-horizontal.svg";
const LOGO_ISO = "/benedetta-bellezza-logo-only.svg";

// Paleta para categorías “libres” (especialidad/especialista)
const PALETTE = [
  "#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#06B6D4",
  "#8B5CF6", "#84CC16", "#EC4899", "#22C55E", "#F97316",
];
const colorMap = (keys: string[]) => {
  const map: Record<string, string> = {};
  keys.forEach((k, i) => (map[k] = PALETTE[i % PALETTE.length]));
  return map;
};

// ---------- Helpers de tiempo/series ----------
const monthsOfYear = (year: number) =>
  Array.from({ length: 12 }, (_, i) => dayjs().year(year).month(i).format("YYYY-MM"));

const monthLabel = (ym: string) => dayjs(ym + "-01").format("MMM YYYY"); // "ene 2025"

function mergeMonthly(baseMonths: string[], data?: SerieMes[]) {
  const safe = data ?? [];
  const map = new Map(safe.map(d => [d.month, d.count]));
  return baseMonths.map(m => ({ month: m, count: map.get(m) ?? 0 }));
}

function toStacked(
  baseMonths: string[],
  grouped?: GroupedByMonth[],
  forcedKeys?: string[]
): { keys: string[]; rows: Array<Record<string, number | string>> } {
  const g = grouped ?? [];
  const monthMap = new Map(g.map(x => [x.month, x.items]));
  const dynamicKeys = Array.from(new Set(g.flatMap(x => x.items.map(i => i.key))));
  const keys = Array.from(new Set([...(forcedKeys ?? []), ...dynamicKeys]));
  const rows = baseMonths.map(m => {
    const items = monthMap.get(m) || [];
    const row: Record<string, number | string> = { month: m };
    keys.forEach(k => (row[k] = (items.find(i => i.key === k)?.count) ?? 0));
    return row;
  });
  return { keys, rows };
}

function sumStack(rows: Array<Record<string, number | string>>, keys: string[]) {
  const sums: Record<string, number> = {};
  rows.forEach(r => keys.forEach(k => {
    const v = Number(r[k] ?? 0);
    sums[k] = (sums[k] || 0) + v;
  }));
  return Object.entries(sums).map(([name, value]) => ({ name, value }));
}

const normalizeEstado = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim().replace(/s$/, "");

const estadoColorFor = (estado: string, theme: any): string => {
  const e = normalizeEstado(estado);
  if (e.includes("pendiente")) return theme.palette.warning.main;
  if (e.includes("confirmada") || e.includes("confirmado")) return theme.palette.success.main;
  if (e.includes("cancelada") || e.includes("cancelado")) return theme.palette.error.main;
  if (e.includes("atendida") || e.includes("atendido")) return theme.palette.info.main; // o secondary
  return theme.palette.grey[500];
};

const filterByMonths = <T extends { month: string }>(rows: T[], filterMonths: string[]) =>
  rows.filter(r => filterMonths.includes(r.month));

const formatNumber = (n: number) => n.toLocaleString("es-BO");

// Sumar una clave en un mes (para KPIs PDF)
const getValueFor = (rows: Array<Record<string, number | string>>, key: string, month: string) =>
  Number((rows.find(r => r.month === month)?.[key] as number) ?? 0);

// ---------- Componente ----------
export default function DashboardCitas() {
  const theme = useTheme();
  const [year, setYear] = useState(dayjs().year());
  const [data, setData] = useState<ReporteCitasOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Meses seleccionados para VER
  const allMonths = useMemo(() => monthsOfYear(year), [year]);
  const [monthsView, setMonthsView] = useState<string[]>(allMonths);
  // Mes seleccionado para PDF
  const currentYm = dayjs().year() === year ? dayjs().format("YYYY-MM") : `${year}-01`;
  const [pdfMonth, setPdfMonth] = useState<string>(currentYm);

  // Refs para captura
  const viewRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMonthsView(monthsOfYear(year));
    setPdfMonth(dayjs().year() === year ? dayjs().format("YYYY-MM") : `${year}-01`);
  }, [year]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const from = dayjs(`${year}-01-01`).format("YYYY-MM-DD");
        const to = dayjs(`${year}-12-31`).format("YYYY-MM-DD");
        const { data } = await axios.get<ReporteCitasOverview>(
          `${API_BASE}/reportes/citas/overview`,
          { params: { from_date: from, to_date: to } }
        );
        setData(data ?? null);
      } catch (err: any) {
        console.error("Error obteniendo overview:", err);
        setErrorMsg(err?.message || "No se pudo cargar el dashboard.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  // ------- Series (todo el año) -------
  const totalesMes_year = useMemo(
    () => mergeMonthly(allMonths, data?.totales_por_mes),
    [data, allMonths]
  );
  const estado_year = useMemo(
    () => toStacked(allMonths, data?.por_estado),
    [data, allMonths]
  );
  const especialidad_year = useMemo(
    () => toStacked(allMonths, data?.por_especialidad),
    [data, allMonths]
  );
  const especialista_year = useMemo(
    () => toStacked(allMonths, data?.por_especialista, data?.todos_los_especialistas),
    [data, allMonths]
  );

    // ¿todos seleccionados?
    const isAllSelected = monthsView.length === allMonths.length;

    // Alternar un mes individual (click en el ítem del menú)
    const handleToggleMonth = (m: string) => {
    setMonthsView(prev =>
        prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
    };

    // Seleccionar todo / limpiar
    const handleToggleAll = () => {
    setMonthsView(isAllSelected ? [] : allMonths);
    };

  // ------- Series filtradas (vista) -------
  const totalesMes_view = useMemo(
    () => filterByMonths(totalesMes_year, monthsView),
    [totalesMes_year, monthsView]
  );
  const estado_view = useMemo(() => {
    const rows = estado_year.rows.filter(r => monthsView.includes(String(r.month)));
    return { keys: estado_year.keys, rows };
  }, [estado_year, monthsView]);
  const especialidad_view = useMemo(() => {
    const rows = especialidad_year.rows.filter(r => monthsView.includes(String(r.month)));
    return { keys: especialidad_year.keys, rows };
  }, [especialidad_year, monthsView]);
  const especialista_view = useMemo(() => {
    const rows = especialista_year.rows.filter(r => monthsView.includes(String(r.month)));
    return { keys: especialista_year.keys, rows };
  }, [especialista_year, monthsView]);

  // ------- Series (PDF: solo 1 mes) -------
  const pdfMonths = useMemo(() => [pdfMonth], [pdfMonth]);
  const totalesMes_pdf = useMemo(
    () => filterByMonths(totalesMes_year, pdfMonths),
    [totalesMes_year, pdfMonths]
  );
  const estado_pdf = useMemo(() => {
    const rows = estado_year.rows.filter(r => pdfMonths.includes(String(r.month)));
    return { keys: estado_year.keys, rows };
  }, [estado_year, pdfMonths]);
  const especialidad_pdf = useMemo(() => {
    const rows = especialidad_year.rows.filter(r => pdfMonths.includes(String(r.month)));
    return { keys: especialidad_year.keys, rows };
  }, [especialidad_year, pdfMonths]);
  const especialista_pdf = useMemo(() => {
    const rows = especialista_year.rows.filter(r => pdfMonths.includes(String(r.month)));
    return { keys: especialista_year.keys, rows };
  }, [especialista_year, pdfMonths]);

  // ------- Colores -------
  const estadoColors = useMemo(() => {
    const map: Record<string, string> = {};
    estado_year.keys.forEach(k => { map[k] = estadoColorFor(k, theme); });
    return map;
  }, [estado_year.keys, theme]);
  const especialidadColors = useMemo(() => colorMap(especialidad_year.keys), [especialidad_year.keys]);
  const especialistaColors = useMemo(() => colorMap(especialista_year.keys), [especialista_year.keys]);

  // ------- KPIs del mes (PDF) -------
  const totalMes = useMemo(
    () => Number((totalesMes_year.find(x => x.month === pdfMonth)?.count) ?? 0),
    [totalesMes_year, pdfMonth]
  );

  const pendientesMes = useMemo(() => {
    const key = estado_year.keys.find(k => normalizeEstado(k).includes("pendiente"));
    return key ? getValueFor(estado_pdf.rows, key, pdfMonth) : 0;
  }, [estado_year.keys, estado_pdf.rows, pdfMonth]);

  const confirmadasMes = useMemo(() => {
    const key = estado_year.keys.find(k => /confirmad[ao]/i.test(normalizeEstado(k)));
    return key ? getValueFor(estado_pdf.rows, key, pdfMonth) : 0;
  }, [estado_year.keys, estado_pdf.rows, pdfMonth]);

  const canceladasMes = useMemo(() => {
    const key = estado_year.keys.find(k => /cancelad[ao]/i.test(normalizeEstado(k)));
    return key ? getValueFor(estado_pdf.rows, key, pdfMonth) : 0;
  }, [estado_year.keys, estado_pdf.rows, pdfMonth]);

  const atendidasMes = useMemo(() => {
    const key = estado_year.keys.find(k => /atendid[ao]/i.test(normalizeEstado(k)));
    return key ? getValueFor(estado_pdf.rows, key, pdfMonth) : 0;
  }, [estado_year.keys, estado_pdf.rows, pdfMonth]);

  // Top N tablas (PDF)
  const topFromStack = (rows: Array<Record<string, number | string>>, keys: string[], month: string, topN = 5) => {
    const arr = keys.map(name => ({ name, value: getValueFor(rows, name, month) }))
                    .filter(x => x.value > 0)
                    .sort((a, b) => b.value - a.value)
                    .slice(0, topN);
    return arr;
  };
  const topEspecialidades = useMemo(() => topFromStack(especialidad_pdf.rows, especialidad_year.keys, pdfMonth), [especialidad_pdf.rows, especialidad_year.keys, pdfMonth]);
  const topEspecialistas = useMemo(() => topFromStack(especialista_pdf.rows, especialista_year.keys, pdfMonth), [especialista_pdf.rows, especialista_year.keys, pdfMonth]);

  // -------- Exportar PDF --------
  const exportPdf = async () => {
    if (!pdfRef.current) return;
    // Asegura un ancho grande para nitidez
    const canvas = await html2canvas(pdfRef.current, { scale: 2, backgroundColor: "#fff" });
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const img = canvas.toDataURL("image/png");

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margins = 24; // margen pequeño
    const ratio = Math.min((pageW - margins * 2) / canvas.width, (pageH - margins * 2) / canvas.height);
    const w = canvas.width * ratio, h = canvas.height * ratio;

    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;

    // No escribimos más texto con jsPDF para evitar solaparse.
    pdf.addImage(img, "PNG", x, y, w, h);
    pdf.save(`dashboard-citas-${pdfMonth}.pdf`);
  };

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      {/* Controles */}
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Typography variant="h5" fontWeight={700}>Dashboard de Citas</Typography>

        <FormControl size="small" sx={{ width: 130 }}>
          <InputLabel>Año</InputLabel>
          <Select label="Año" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 6 }, (_, i) => dayjs().year() - i).map(y =>
              <MenuItem key={y} value={y}>{y}</MenuItem>
            )}
          </Select>
        </FormControl>

        {/* Meses para VER (multi-select) */}
        <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Meses a visualizar</InputLabel>
            <Select
                multiple
                value={monthsView}
                label="Meses a visualizar"
                // mantenemos onChange por accesibilidad/teclado
                onChange={(e) => setMonthsView(e.target.value as string[])}
                renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {(selected as string[]).slice(0, 3).map(v => (
                    <Chip key={v} label={monthLabel(v)} />
                    ))}
                    {(selected as string[]).length > 3 && (
                    <Chip label={`+${(selected as string[]).length - 3}`} />
                    )}
                </Box>
                )}
                MenuProps={{
                PaperProps: { sx: { maxHeight: 360 } },
                }}
            >
                {/* Encabezado del menú con acciones rápidas */}
                <ListSubheader
                disableSticky
                sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}
                >
                <Typography variant="subtitle2" sx={{ pl: 1 }}>Selecciona meses</Typography>
                <Box sx={{ display: "flex", gap: 1, pr: 1 }}>
                    <Button size="small" onClick={(e) => { e.preventDefault(); handleToggleAll(); }}>
                    {isAllSelected ? "Limpiar" : "Seleccionar todo"}
                    </Button>
                </Box>
                </ListSubheader>

                <Divider />

                {allMonths.map((m) => {
                const selected = monthsView.includes(m);
                return (
                    <MenuItem
                    key={m}
                    value={m}
                    onClick={(e) => { e.preventDefault(); handleToggleMonth(m); }}
                    sx={{
                        // resalta los seleccionados
                        ...(selected && {
                        bgcolor: (theme) => theme.palette.action.selected, // tono sutil
                        "&:hover": { bgcolor: (theme) => theme.palette.action.selected },
                        fontWeight: 600,
                        }),
                    }}
                    >
                    <Checkbox
                        checked={selected}
                        size="small"
                        sx={{ mr: 1 }}
                    />
                    <ListItemText primary={monthLabel(m)} />
                    </MenuItem>
                );
                })}
            </Select>
        </FormControl>


        {/* Mes para PDF */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Mes para PDF</InputLabel>
          <Select
            label="Mes para PDF"
            value={pdfMonth}
            onChange={(e) => setPdfMonth(String(e.target.value))}
          >
            {allMonths.map(m => (
              <MenuItem key={m} value={m}>{monthLabel(m)}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={exportPdf} disabled={loading || !data}>
          Descargar PDF (mes seleccionado)
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {loading && (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      )}

      {/* VISTA UI (meses seleccionados) */}
      {!loading && (
        <Stack ref={viewRef} spacing={2}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>Total de citas por mes (vista)</Typography>
              <div style={{ width: "100%", height: 320 }}>
                <ResponsiveContainer>
                  <LineChart data={totalesMes_view}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={monthLabel} />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(v) => String(v)} labelFormatter={monthLabel} />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Total" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>Citas por estado (acumulado de meses seleccionados)</Typography>
              <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                <Box sx={{ flex: 1, height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                        data={sumStack(estado_view.rows, estado_year.keys).map(d => ({
                          ...d, fill: estadoColors[d.name] || theme.palette.grey[500]
                        }))}
                      />
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ flex: 2, height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={estado_view.rows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={monthLabel} />
                      <YAxis allowDecimals={false} />
                      <Tooltip labelFormatter={monthLabel} />
                      <Legend />
                      {estado_year.keys.map(k => (
                        <Bar key={k} dataKey={k} stackId="estado" fill={estadoColors[k]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>Citas por especialidad (meses seleccionados)</Typography>
              <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
                <Box sx={{ flex: 1, height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                        data={sumStack(especialidad_view.rows, especialidad_year.keys).map(d => ({
                          ...d, fill: especialidadColors[d.name] || "#999"
                        }))}
                      />
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ flex: 2, height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={especialidad_view.rows}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tickFormatter={monthLabel} />
                      <YAxis allowDecimals={false} />
                      <Tooltip labelFormatter={monthLabel} />
                      <Legend />
                      {especialidad_year.keys.map(k => (
                        <Bar key={k} dataKey={k} stackId="esp" fill={especialidadColors[k]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>Citas por especialista (meses seleccionados)</Typography>
              <div style={{ width: "100%", height: 380 }}>
                <ResponsiveContainer>
                  <BarChart data={especialista_view.rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={monthLabel} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={monthLabel} />
                    <Legend />
                    {especialista_year.keys.map(k => (
                      <Bar key={k} dataKey={k} fill={especialistaColors[k]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* CONTENEDOR PDF (estilizado y grande) */}
      <Stack
        ref={pdfRef}
        spacing={2}
        sx={{
          position: "absolute",
          left: -99999,
          top: -99999,
          width: 1500, // más ancho para nitidez
          p: 3,
          bgcolor: "#ffffff",
          color: "text.primary",
          borderRadius: 3,
          boxShadow: 1,
        }}
      >
        {/* Encabezado Benedetta */}
        <Paper
        elevation={0}
        sx={{
            p: 2,
            borderRadius: 2,
            // ↓ Fondo con transparencia sin afectar hijos
            bgcolor: alpha(benedettaPink, 0.18),   // ajusta 0.10–0.25 a gusto
            // Borde con un leve contraste del mismo branding
            border: `1px solid ${alpha(darken(benedettaPink, 0.25), 0.4)}`
        }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <img src={LOGO_HORIZONTAL} alt="Benedetta" style={{ height: 36 }} />
              <Divider orientation="vertical" flexItem />
              <Typography variant="h6" fontWeight={700}>Reporte de Citas</Typography>
            </Stack>
            <Stack spacing={0} sx={{ textAlign: "right" }}>
              <Typography variant="body2">Fecha de creación: {dayjs().format("DD/MM/YYYY HH:mm")}</Typography>
              <Typography variant="body2">Mes del reporte: {monthLabel(pdfMonth)}</Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* KPIs numéricos */}
        <Stack direction="row" spacing={2}>
          <Card sx={{ flex: 1, borderRadius: 3, borderTop: `4px solid ${theme.palette.text.primary}` }}>
            <CardContent>
              <Typography variant="overline">Total citas</Typography>
              <Typography variant="h4" fontWeight={800}>{formatNumber(totalMes)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderTop: `4px solid ${theme.palette.warning.main}` }}>
            <CardContent>
              <Typography variant="overline">Pendientes</Typography>
              <Typography variant="h4" fontWeight={800}>{formatNumber(pendientesMes)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderTop: `4px solid ${theme.palette.success.main}` }}>
            <CardContent>
              <Typography variant="overline">Confirmadas</Typography>
              <Typography variant="h4" fontWeight={800}>{formatNumber(confirmadasMes)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderTop: `4px solid ${theme.palette.error.main}` }}>
            <CardContent>
              <Typography variant="overline">Canceladas</Typography>
              <Typography variant="h4" fontWeight={800}>{formatNumber(canceladasMes)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderTop: `4px solid ${theme.palette.info.main}` }}>
            <CardContent>
              <Typography variant="overline">Atendidas</Typography>
              <Typography variant="h4" fontWeight={800}>{formatNumber(atendidasMes)}</Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Gráficos más grandes */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>Distribución por estado</Typography>
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1, height: 320 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      dataKey="value"
                      nameKey="name"
                      outerRadius={130}
                      label
                      data={sumStack(estado_pdf.rows, estado_year.keys).map(d => ({
                        ...d, fill: estadoColors[d.name] || theme.palette.grey[500]
                      }))}
                    />
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ flex: 2, height: 360 }}>
                <ResponsiveContainer>
                  <BarChart data={estado_pdf.rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={monthLabel} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={monthLabel} />
                    <Legend />
                    {estado_year.keys.map(k => (
                      <Bar key={k} dataKey={k} stackId="estado" fill={estadoColors[k]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Stack direction="row" spacing={2}>
          <Card sx={{ flex: 1, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>Top especialidades (mes)</Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Especialidad</TableCell>
                      <TableCell align="right">Citas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topEspecialidades.length ? topEspecialidades.map(row => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{formatNumber(row.value)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={2}>Sin datos</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>Top especialistas (mes)</Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Especialista</TableCell>
                      <TableCell align="right">Citas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topEspecialistas.length ? topEspecialistas.map(row => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell align="right">{formatNumber(row.value)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={2}>Sin datos</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </Stack>
  );
}
