// src/pages/DashboardCitas.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import dayjs from "dayjs";
import {
  Stack, Card, CardContent, Typography, Button,
  FormControl, Select, MenuItem, InputLabel, CircularProgress, Alert, Chip, Box,
  Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  ListSubheader, Checkbox, ListItemText
} from "@mui/material";
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { alpha, darken, useTheme } from "@mui/material/styles";

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
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

// Logos (ponlos en /public/brand/)
const LOGO_HORIZONTAL = "/brand/benedetta-bellezza-horizontal.svg";
const benedettaPink = "#F8BBD0"; // rosa pastel

// Paleta libre
const PALETTE = ["#4F46E5","#10B981","#F59E0B","#EF4444","#06B6D4","#8B5CF6","#84CC16","#EC4899","#22C55E","#F97316"];
const colorMap = (keys: string[]) => {
  const map: Record<string, string> = {};
  keys.forEach((k, i) => (map[k] = PALETTE[i % PALETTE.length]));
  return map;
};

// Tiempo/series helpers
const monthsOfYear = (year: number) => Array.from({ length: 12 }, (_, i) => dayjs().year(year).month(i).format("YYYY-MM"));
const monthLabel = (ym: string) => dayjs(ym + "-01").format("MMM YYYY");
function mergeMonthly(baseMonths: string[], data?: SerieMes[]) {
  const safe = data ?? [];
  const map = new Map(safe.map(d => [d.month, d.count]));
  return baseMonths.map(m => ({ month: m, count: map.get(m) ?? 0 }));
}
function toStacked(baseMonths: string[], grouped?: GroupedByMonth[], forcedKeys?: string[]) {
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
  rows.forEach(r => keys.forEach(k => { const v = Number(r[k] ?? 0); sums[k] = (sums[k] || 0) + v; }));
  return Object.entries(sums).map(([name, value]) => ({ name, value }));
}
const normalizeEstado = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim().replace(/s$/, "");
const estadoColorFor = (estado: string, theme: any): string => {
  const e = normalizeEstado(estado);
  if (e.includes("pendiente")) return theme.palette.warning.main;
  if (e.includes("confirmada") || e.includes("confirmado")) return theme.palette.success.main;
  if (e.includes("cancelada") || e.includes("cancelado")) return theme.palette.error.main;
  if (e.includes("atendida") || e.includes("atendido")) return theme.palette.info.main;
  return theme.palette.grey[500];
};
const filterByMonths = <T extends { month: string }>(rows: T[], filterMonths: string[]) => rows.filter(r => filterMonths.includes(r.month));
const formatNumber = (n: number) => n.toLocaleString("es-BO");
const getValueFor = (rows: Array<Record<string, number | string>>, key: string, month: string) => Number((rows.find(r => r.month === month)?.[key] as number) ?? 0);

// ---------- Componente ----------
export default function DashboardCitas() {
  const theme = useTheme();
  const [year, setYear] = useState(dayjs().year());
  const [data, setData] = useState<ReporteCitasOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Meses
  const allMonths = useMemo(() => monthsOfYear(year), [year]);
  const [monthsView, setMonthsView] = useState<string[]>(allMonths);
  const currentYm = dayjs().year() === year ? dayjs().format("YYYY-MM") : `${year}-01`;
  const [pdfMonth, setPdfMonth] = useState<string>(currentYm);

  // Filtros nuevos
  const [selEspecialista, setSelEspecialista] = useState<string>("");
  const [selEspecialidad, setSelEspecialidad] = useState<string>("");
  const [loadingFiltro, setLoadingFiltro] = useState(false);

  // Datos filtrados (endpoints nuevos)
  const [estadoPorEspecialista, setEstadoPorEspecialista] = useState<GroupedByMonth[] | null>(null);
  const [estadoPorEspecialidad, setEstadoPorEspecialidad] = useState<GroupedByMonth[] | null>(null);

  // Refs
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
        const { data } = await axios.get<ReporteCitasOverview>(`${API_BASE}/reportes/citas/overview`, { params: { from_date: from, to_date: to } });
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

  // Series año
  const totalesMes_year = useMemo(() => mergeMonthly(allMonths, data?.totales_por_mes), [data, allMonths]);
  const estado_year = useMemo(() => toStacked(allMonths, data?.por_estado), [data, allMonths]);
  const especialidad_year = useMemo(() => toStacked(allMonths, data?.por_especialidad), [data, allMonths]);
  const especialista_year = useMemo(() => toStacked(allMonths, data?.por_especialista, data?.todos_los_especialistas), [data, allMonths]);

  // Meses UI
  const isAllSelected = monthsView.length === allMonths.length;
  const handleToggleMonth = (m: string) => setMonthsView(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  const handleToggleAll = () => setMonthsView(isAllSelected ? [] : allMonths);

  // Series vista
  const totalesMes_view = useMemo(() => filterByMonths(totalesMes_year, monthsView), [totalesMes_year, monthsView]);
  const estado_view = useMemo(() => ({ keys: estado_year.keys, rows: estado_year.rows.filter(r => monthsView.includes(String(r.month))) }), [estado_year, monthsView]);
  const especialidad_view = useMemo(() => ({ keys: especialidad_year.keys, rows: especialidad_year.rows.filter(r => monthsView.includes(String(r.month))) }), [especialidad_year, monthsView]);
  const especialista_view = useMemo(() => ({ keys: especialista_year.keys, rows: especialista_year.rows.filter(r => monthsView.includes(String(r.month))) }), [especialista_year, monthsView]);

  // Series PDF (1 mes)
  const pdfMonths = useMemo(() => [pdfMonth], [pdfMonth]);
  const totalesMes_pdf = useMemo(() => filterByMonths(totalesMes_year, pdfMonths), [totalesMes_year, pdfMonths]);
  const estado_pdf = useMemo(() => ({ keys: estado_year.keys, rows: estado_year.rows.filter(r => pdfMonths.includes(String(r.month))) }), [estado_year, pdfMonths]);
  const especialidad_pdf = useMemo(() => ({ keys: especialidad_year.keys, rows: especialidad_year.rows.filter(r => pdfMonths.includes(String(r.month))) }), [especialidad_year, pdfMonths]);
  const especialista_pdf = useMemo(() => ({ keys: especialista_year.keys, rows: especialista_year.rows.filter(r => pdfMonths.includes(String(r.month))) }), [especialista_year, pdfMonths]);

  // Colores
  const estadoColors = useMemo(() => { const map: Record<string, string> = {}; estado_year.keys.forEach(k => map[k] = estadoColorFor(k, theme)); return map; }, [estado_year.keys, theme]);
  const especialidadColors = useMemo(() => colorMap(especialidad_year.keys), [especialidad_year.keys]);
  const especialistaColors = useMemo(() => colorMap(especialista_year.keys), [especialista_year.keys]);

  // KPIs PDF
  const totalMes = useMemo(() => Number((totalesMes_year.find(x => x.month === pdfMonth)?.count) ?? 0), [totalesMes_year, pdfMonth]);
  const pendientesMes = useMemo(() => { const key = estado_year.keys.find(k => normalizeEstado(k).includes("pendiente")); return key ? getValueFor(estado_pdf.rows, key, pdfMonth) : 0; }, [estado_year.keys, estado_pdf.rows, pdfMonth]);
  const confirmadasMes = useMemo(() => { const key = estado_year.keys.find(k => /confirmad[ao]/i.test(normalizeEstado(k))); return key ? getValueFor(estado_pdf.rows, key, pdfMonth) : 0; }, [estado_year.keys, estado_pdf.rows, pdfMonth]);
  const canceladasMes = useMemo(() => { const key = estado_year.keys.find(k => /cancelad[ao]/i.test(normalizeEstado(k))); return key ? getValueFor(estado_pdf.rows, key, pdfMonth) : 0; }, [estado_year.keys, estado_pdf.rows, pdfMonth]);
  const atendidasMes = useMemo(() => { const key = estado_year.keys.find(k => /atendid[ao]/i.test(normalizeEstado(k))); return key ? getValueFor(estado_pdf.rows, key, pdfMonth) : 0; }, [estado_year.keys, estado_pdf.rows, pdfMonth]);

  // Endpoints nuevos
  const fetchEstadoPorEspecialista = async (nombre: string) => {
    if (!nombre) { setEstadoPorEspecialista(null); return; }
    setLoadingFiltro(true);
    try {
      const from = dayjs(`${year}-01-01`).format("YYYY-MM-DD");
      const to = dayjs(`${year}-12-31`).format("YYYY-MM-DD");
      const { data } = await axios.get<GroupedByMonth[]>(`${API_BASE}/reportes/citas/por-estado-especialista`, { params: { especialista: nombre, from_date: from, to_date: to } });
      setEstadoPorEspecialista(data);
    } finally { setLoadingFiltro(false); }
  };
  const fetchEstadoPorEspecialidad = async (nombre: string) => {
    if (!nombre) { setEstadoPorEspecialidad(null); return; }
    setLoadingFiltro(true);
    try {
      const from = dayjs(`${year}-01-01`).format("YYYY-MM-DD");
      const to = dayjs(`${year}-12-31`).format("YYYY-MM-DD");
      const { data } = await axios.get<GroupedByMonth[]>(`${API_BASE}/reportes/citas/por-estado-especialidad`, { params: { especialidad: nombre, from_date: from, to_date: to } });
      setEstadoPorEspecialidad(data);
    } finally { setLoadingFiltro(false); }
  };

  // Derivados filtrados
  const estado_especialista_view = useMemo(() => {
    if (!estadoPorEspecialista) return { keys: estado_year.keys, rows: [] as Array<Record<string, number | string>> };
    const { keys, rows } = toStacked(allMonths, estadoPorEspecialista);
    return { keys, rows: rows.filter(r => monthsView.includes(String(r.month))) };
  }, [estadoPorEspecialista, monthsView, allMonths, estado_year.keys]);

  const estado_especialidad_view = useMemo(() => {
    if (!estadoPorEspecialidad) return { keys: estado_year.keys, rows: [] as Array<Record<string, number | string>> };
    const { keys, rows } = toStacked(allMonths, estadoPorEspecialidad);
    return { keys, rows: rows.filter(r => monthsView.includes(String(r.month))) };
  }, [estadoPorEspecialidad, monthsView, allMonths, estado_year.keys]);

  // PDF
  const exportPdf = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, { scale: 2, backgroundColor: "#fff" });
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const img = canvas.toDataURL("image/png");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margins = 24;
    const ratio = Math.min((pageW - margins * 2) / canvas.width, (pageH - margins * 2) / canvas.height);
    const w = canvas.width * ratio, h = canvas.height * ratio;
    pdf.addImage(img, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
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

        {/* Meses a visualizar (multi + checkboxes) */}
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Meses a visualizar</InputLabel>
          <Select
            multiple
            value={monthsView}
            label="Meses a visualizar"
            onChange={(e) => setMonthsView(e.target.value as string[])}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {(selected as string[]).slice(0, 3).map(v => (<Chip key={v} label={monthLabel(v)} />))}
                {(selected as string[]).length > 3 && (<Chip label={`+${(selected as string[]).length - 3}`} />)}
              </Box>
            )}
            MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
          >
            <ListSubheader disableSticky sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}>
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
                  sx={selected ? {
                    bgcolor: (t) => t.palette.action.selected,
                    "&:hover": { bgcolor: (t) => t.palette.action.selected },
                    fontWeight: 600,
                  } : undefined}
                >
                  <Checkbox checked={selected} size="small" sx={{ mr: 1 }} />
                  <ListItemText primary={monthLabel(m)} />
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* Mes para PDF */}
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Mes para PDF</InputLabel>
          <Select label="Mes para PDF" value={pdfMonth} onChange={(e) => setPdfMonth(String(e.target.value))}>
            {allMonths.map(m => (<MenuItem key={m} value={m}>{monthLabel(m)}</MenuItem>))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={exportPdf} disabled={loading || !data}>
          Descargar PDF (mes seleccionado)
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {loading && (<Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>)}

      {/* VISTA */}
      {!loading && (
        <Stack spacing={2}>
          {/* Totales por mes */}
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

          {/* Estados global */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600}>Citas por estado (acumulado de meses seleccionados)</Typography>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1, height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                        data={sumStack(estado_view.rows, estado_year.keys).map(d => ({ ...d, fill: estadoColors[d.name] || theme.palette.grey[500] }))}
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
                      {estado_year.keys.map(k => (<Bar key={k} dataKey={k} stackId="estado" fill={estadoColors[k]} />))}
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* --- COMBINADO: Especialidad (global + filtro por especialidad) --- */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={600}>Citas por especialidad (meses seleccionados)</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 240 }}>
                    <InputLabel>Filtrar especialidad</InputLabel>
                    <Select
                      label="Filtrar especialidad"
                      value={selEspecialidad}
                      onChange={async (e) => { const v = String(e.target.value); setSelEspecialidad(v); await fetchEstadoPorEspecialidad(v); }}
                    >
                      <MenuItem value=""><em>— Sin filtro —</em></MenuItem>
                      {especialidad_year.keys.map(n => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                    </Select>
                  </FormControl>
                  {selEspecialidad && (
                    <Button size="small" onClick={() => { setSelEspecialidad(""); setEstadoPorEspecialidad(null); }}>
                      Limpiar
                    </Button>
                  )}
                </Stack>
              </Stack>

              {/* Gráficos globales por especialidad */}
              <Stack direction="row" spacing={2} sx={{ width: "100%", mt: 1 }}>
                <Box sx={{ flex: 1, height: 385 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        dataKey="value"
                        nameKey="name"
                        outerRadius={110}
                        label
                        data={sumStack(especialidad_view.rows, especialidad_year.keys).map(d => ({ ...d, fill: especialidadColors[d.name] || "#999" }))}
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
                      {especialidad_year.keys.map(k => (<Bar key={k} dataKey={k} stackId="esp" fill={especialidadColors[k]} />))}
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Stack>

              {/* Si hay filtro, mostramos los gráficos por estado de esa especialidad */}
              {selEspecialidad && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Distribución por estado — <b>{selEspecialidad}</b> (meses seleccionados)
                  </Typography>
                  {loadingFiltro ? (
                    <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
                  ) : (
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1, height: 280 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              dataKey="value"
                              nameKey="name"
                              outerRadius={110}
                              label
                              data={sumStack(estado_especialidad_view.rows, estado_especialidad_view.keys).map(d => ({ ...d, fill: estadoColors[d.name] || theme.palette.grey[500] }))}
                            />
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ flex: 2, height: 320 }}>
                        <ResponsiveContainer>
                          <BarChart data={estado_especialidad_view.rows}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tickFormatter={monthLabel} />
                            <YAxis allowDecimals={false} />
                            <Tooltip labelFormatter={monthLabel} />
                            <Legend />
                            {estado_especialidad_view.keys.map(k => (<Bar key={k} dataKey={k} stackId="estadoEspc" fill={estadoColors[k]} />))}
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Stack>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Especialista (igual que antes) */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={600}>Citas por especialista (meses seleccionados)</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Filtrar especialista</InputLabel>
                    <Select
                      label="Filtrar especialista"
                      value={selEspecialista}
                      onChange={async (e) => { const v = String(e.target.value); setSelEspecialista(v); await fetchEstadoPorEspecialista(v); }}
                    >
                      <MenuItem value=""><em>— Sin filtro —</em></MenuItem>
                      {(data?.todos_los_especialistas || []).map(n => (<MenuItem key={n} value={n}>{n}</MenuItem>))}
                    </Select>
                  </FormControl>
                  {selEspecialista && (
                    <Button size="small" onClick={() => { setSelEspecialista(""); setEstadoPorEspecialista(null); }}>
                      Limpiar
                    </Button>
                  )}
                </Stack>
              </Stack>

              <div style={{ width: "100%", height: 380 }}>
                <ResponsiveContainer>
                  <BarChart data={especialista_view.rows}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={monthLabel} />
                    <YAxis allowDecimals={false} />
                    <Tooltip labelFormatter={monthLabel} />
                    <Legend />
                    {especialista_year.keys.map(k => (<Bar key={k} dataKey={k} fill={especialistaColors[k]} />))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {selEspecialista && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Distribución por estado — <b>{selEspecialista}</b> (meses seleccionados)
                  </Typography>
                  {loadingFiltro ? (
                    <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress size={24} /></Stack>
                  ) : (
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ flex: 1, height: 280 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              dataKey="value"
                              nameKey="name"
                              outerRadius={110}
                              label
                              data={sumStack(estado_especialista_view.rows, estado_especialista_view.keys).map(d => ({ ...d, fill: estadoColors[d.name] || theme.palette.grey[500] }))}
                            />
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ flex: 2, height: 320 }}>
                        <ResponsiveContainer>
                          <BarChart data={estado_especialista_view.rows}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tickFormatter={monthLabel} />
                            <YAxis allowDecimals={false} />
                            <Tooltip labelFormatter={monthLabel} />
                            <Legend />
                            {estado_especialista_view.keys.map(k => (<Bar key={k} dataKey={k} stackId="estadoEsp" fill={estadoColors[k]} />))}
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Stack>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* CONTENEDOR PDF (igual que ya lo tenías) */}
      <Stack
        ref={pdfRef}
        spacing={2}
        sx={{
          position: "absolute",
          left: -99999,
          top: -99999,
          width: 1500,
          p: 3,
          bgcolor: "#ffffff",
          color: "text.primary",
          borderRadius: 3,
          boxShadow: 1,
        }}
      >
        <Paper elevation={0} sx={{
          p: 2, borderRadius: 2,
          bgcolor: alpha(benedettaPink, 0.18),
          border: `1px solid ${alpha(darken(benedettaPink, 0.25), 0.4)}`
        }}>
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

        {/* KPIs y gráficos para el PDF… (sin cambios) */}
        {/* ... (mantén aquí tu bloque PDF existente) ... */}
      </Stack>
    </Stack>
  );
}
