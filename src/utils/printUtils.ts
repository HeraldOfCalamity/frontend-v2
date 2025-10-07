// src/utils/printUtils.ts
export function openPrintWindow(html: string, title = "Documento") {
  const win = window.open("", "_blank", "width=980,height=800");
  if (!win) {
    alert("El navegador bloqueó la ventana de impresión. Habilita pop-ups para este sitio.");
    return;
  }
const css = `
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  /* Tipografía seria: Arial; si no hay, caemos a Helvetica/Nimbus/Segoe */
  body { font: 12pt/1.35 Arial, "Helvetica Neue", Helvetica, "Nimbus Sans", "Segoe UI", "Liberation Sans", sans-serif; color: #121212; }
  h1, h2, h3 { margin: 0 0 6px 0; font-weight: 700; }
  h1 { font-size: 18pt; } h2 { font-size: 14pt; } h3 { font-size: 12.5pt; }
  .small{font-size:10.5pt;} .muted{color:#666;} .right{text-align:right;}
  .mono{font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;}

  /* === Encabezado principal (centrado) ===
     sin borde, solo línea divisoria inferior */
  .clinic{
    display: grid;
    grid-template-columns: 96px 1fr;   /* izquierda: logo; derecha: contenido */
    align-items: center;
    gap: 12px;

    border: 0;                         /* sin borde alrededor */
    border-bottom: 1.5px solid #111;   /* solo línea divisoria inferior */
    border-radius: 0;
    padding: 8px 0 10px;
    background: #fff;
    margin-bottom: 14px;
    }

    .clinic-col-logo { display:flex; align-items:center; justify-content:center; }
    .clinic-logo{ width:100px; height:100px; object-fit:contain; }

    .clinic-col-body{
    display:flex; flex-direction:column; align-items:center; text-align:center;
    }

    .clinic-name{ font-weight:800; font-size: 16pt; line-height:1.15; }
    .clinic-sub{ font-size: 10pt; line-height:1.2; }
    .clinic-meta{
    font-size:10pt;
    white-space: pre-wrap; /* respeta saltos de línea en dirección */
    }

  /* === Bloques de sección (cuadrados con borde negro) === */
  .section{ border:1.5px solid #111; margin:12px 0; background:#fff; border-radius:0; }
  .section-head{
    background:#f2ccd0c4;                 /* rosado */
    text-align:center;
    font-weight:600;                       /* menos bold */
    padding:8px 10px;
    border-bottom:1.5px solid #111;        /* divisor */
    text-transform:uppercase;              /* títulos en mayúsculas */
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .section-body{ padding:12px; background:#fff; }

  /* Utilidades para el contenido */
  .kv { display:grid; grid-template-columns: 160px 1fr; gap:4px 10px; }
  table.table { width:100%; border-collapse: collapse; font-size: 11pt; }
  .table th, .table td { padding:8px 10px; border-bottom:1px solid #ededf3; vertical-align: top; }
  .table th { text-align:left; background:#faf7fb; }

  /* Asegurar colores al imprimir/guardar PDF (Chromium/Brave) */
  @media print {
    body, .section-head { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

  const docHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>${html}</body>
</html>`;

  try {
    win.document.open("text/html", "replace");
    win.document.write(docHtml);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 250);
  } catch {
    const blob = new Blob([docHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    win.location.href = url;
    setTimeout(() => { win.focus(); win.print(); URL.revokeObjectURL(url); }, 400);
  }
}

export function fmt(d?: string | Date) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return isNaN(dt.getTime()) ? "—" :
    dt.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Construye el encabezado con logo + datos del consultorio */
export function makeClinicHeaderHTML(info: {
  logoUrl?: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  sub1?: string;
  sub2?: string;
}) {
  const {
    logoUrl = "/benedetta-bellezza.svg",
    name, address, phone, city,
    sub1 = "Historial Clínico",
    sub2 = "Ministerio de salud- resolución ministerial N°825 cap IV art. 44",
  } = info;

  const metaLines: string[] = [];
  if (phone) metaLines.push(`Tel: ${phone}`);
  if (address) metaLines.push(address);   // usa '\n' para multilínea
  if (city) metaLines.push(city);
  const metaHtml = metaLines.join("\n").replace(/\n/g, "<br/>");

  return `
    <div class="clinic">
      <div class="clinic-col-logo">
        <img class="clinic-logo" src="${logoUrl}" alt="logo"/>
      </div>
      <div class="clinic-col-body">
        <div class="clinic-name">${escapeHtml(name)}</div>
        <div class="clinic-sub">${escapeHtml(sub1)}</div>
        <div class="clinic-sub">${escapeHtml(sub2)}</div>
        ${metaHtml ? `<div class="clinic-meta">${metaHtml}</div>` : ""}
      </div>
    </div>
  `;
}


function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" } as any)[c]
  );
}
