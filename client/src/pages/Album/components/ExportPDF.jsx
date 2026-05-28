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

function codeList(items, showQty = false) {
  return items.map((s) => {
    const suffix = showQty && s.quantity > 1 ? `×${s.quantity}` : '';
    return `<span class="c">${s.displayCode}${suffix ? `<sup>${suffix}</sup>` : ''}</span>`;
  }).join('');
}

function buildHTML(username, stats, stickers) {
  const owned   = stickers.filter((s) => s.quantity >= 1);
  const missing = stickers.filter((s) => s.quantity === 0);
  const dupes   = stickers.filter((s) => s.quantity > 1);
  const date    = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  function block(label, list, showQty = false) {
    if (!list.length) return '';
    return groupByType(list).map(({ type, items }) => `
      <div class="b">
        <div class="bh">${label} · ${TYPE_LABEL[type]} (${items.length})</div>
        <div class="codes">${codeList(items, showQty)}</div>
      </div>`).join('');
  }

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${username} – 3 Reyes 2026</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Courier New',monospace;font-size:8pt;color:#000;padding:12mm}
    h1{font-size:10pt;font-weight:bold}
    .meta{font-size:7pt;color:#555;margin-bottom:5px}
    .stats{font-size:8pt;border-top:1px solid #000;border-bottom:1px solid #000;padding:3px 0;margin-bottom:8px}
    .b{margin-bottom:7px}
    .bh{font-size:7pt;font-weight:bold;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
    .codes{display:flex;flex-wrap:wrap;gap:2px}
    .c{font-size:7.5pt;border:1px solid #bbb;padding:1px 3px;line-height:1.4}
    sup{font-size:6pt}
    @media print{body{padding:8mm}}
  </style>
</head>
<body>
  <h1>3 Reyes del Mundial 2026</h1>
  <p class="meta">${username} · ${date}</p>
  <p class="stats">Tengo ${stats.owned}/${stats.total} &nbsp;·&nbsp; Faltan ${stats.missing} &nbsp;·&nbsp; Duplicadas ${stats.duplicates}</p>
  ${block('TENGO', owned)}
  ${block('FALTA', missing)}
  ${block('DUPLICADA', dupes, true)}
  <script>window.onload=()=>window.print()</script>
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
