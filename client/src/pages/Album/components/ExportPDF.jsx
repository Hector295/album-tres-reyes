import { useState } from 'react';
import api from '../../../api/client';

const TYPE_LABEL = { normal: 'Normales', troquelada: 'Troqueladas', repechaje: 'Repechaje' };
const TYPE_ORDER = ['normal', 'troquelada', 'repechaje'];

function groupByType(list) {
  return TYPE_ORDER.reduce((acc, t) => {
    const items = list.filter((s) => s.type === t);
    if (items.length) acc.push({ type: t, items });
    return acc;
  }, []);
}

function codeGrid(items) {
  return items.map((s) => {
    const extra = s.quantity > 1 ? ` ×${s.quantity}` : '';
    return `<span class="code">#${s.displayCode}${extra}</span>`;
  }).join('');
}

function buildHTML(username, stats, stickers) {
  const owned    = stickers.filter((s) => s.quantity >= 1);
  const missing  = stickers.filter((s) => s.quantity === 0);
  const dupes    = stickers.filter((s) => s.quantity > 1);
  const date     = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  function section(title, color, list) {
    if (!list.length) return '';
    const groups = groupByType(list);
    const rows = groups.map(({ type, items }) => `
      <div class="group">
        <h3>${TYPE_LABEL[type]} (${items.length})</h3>
        <div class="grid">${codeGrid(items)}</div>
      </div>`).join('');
    return `<section><h2 style="color:${color}">${title} (${list.length})</h2>${rows}</section>`;
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Reporte – 3 Reyes del Mundial 2026</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 20px; }
    header { border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 16px; }
    header h1 { font-size: 16px; }
    header p { font-size: 11px; color: #555; margin-top: 2px; }
    .stats { display: flex; gap: 24px; margin-bottom: 20px; }
    .stat { text-align: center; }
    .stat .num { font-size: 22px; font-weight: bold; }
    .stat .lbl { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: .5px; }
    section { margin-bottom: 20px; page-break-inside: avoid; }
    section h2 { font-size: 13px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .group { margin-bottom: 10px; }
    .group h3 { font-size: 10px; text-transform: uppercase; letter-spacing: .5px; color: #777; margin-bottom: 4px; }
    .grid { display: flex; flex-wrap: wrap; gap: 4px; }
    .code { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px 6px; font-size: 10px; font-family: monospace; font-weight: bold; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <header>
    <h1>3 Reyes del Mundial 2026</h1>
    <p>Usuario: ${username} &nbsp;·&nbsp; ${date}</p>
  </header>

  <div class="stats">
    <div class="stat"><div class="num">${stats.owned}<span style="font-size:14px;color:#555">/${stats.total}</span></div><div class="lbl">Tengo</div></div>
    <div class="stat"><div class="num" style="color:#dc2626">${stats.missing}</div><div class="lbl">Me faltan</div></div>
    <div class="stat"><div class="num" style="color:#d97706">${stats.duplicates}</div><div class="lbl">Duplicadas</div></div>
  </div>

  ${section('Figuritas que tengo', '#15803d', owned)}
  ${section('Figuritas que me faltan', '#dc2626', missing)}
  ${section('Figuritas duplicadas', '#d97706', dupes)}

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
}

export default function ExportPDF({ username }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const [{ data: stickers }, { data: stats }] = await Promise.all([
        api.get('/stickers'),
        api.get('/stickers/stats')
      ]);

      const html = buildHTML(username, stats, stickers);
      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-4 mx-auto max-w-md">
      <h2 className="mb-1 text-lg font-bold">Exportar reporte</h2>
      <p className="mb-4 text-sm text-slate-500">
        Genera un PDF con el resumen completo de tu álbum: figuritas que tienes, las que te faltan y las duplicadas, organizadas por tipo.
      </p>

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-subtle space-y-4">
        <p className="text-sm text-slate-600">
          El reporte incluye las <strong>3 secciones</strong>: Tengo · Me faltan · Duplicadas,
          divididas por tipo (Normales, Troqueladas, Repechaje).
        </p>
        <p className="text-sm text-slate-500">
          Se abrirá una ventana con el reporte listo para imprimir o guardar como PDF desde el navegador.
        </p>

        <button
          className="h-11 w-full rounded-md bg-slate-900 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          onClick={handleExport}
          type="button"
        >
          {loading ? 'Generando...' : '↓ Generar PDF'}
        </button>
      </div>
    </section>
  );
}
