import { useEffect, useRef, useState } from 'react';

const CONFIG = {
  normal:     { max: 584, maxLen: 3 },
  troquelada: { max: 48,  maxLen: 2 },
  repechaje:  { max: 67,  maxLen: 2 },
};

const TYPE_COLORS = {
  normal:     { active: 'bg-white text-emerald-800 shadow-sm', inactive: 'text-slate-600' },
  troquelada: { active: 'bg-white text-amber-800 shadow-sm',   inactive: 'text-slate-600' },
  repechaje:  { active: 'bg-white text-blue-800 shadow-sm',    inactive: 'text-slate-600' },
};

function TypeToggle({ type, onChange }) {
  return (
    <div className="grid h-11 grid-cols-3 rounded-md border border-slate-300 bg-slate-100 p-1">
      {Object.entries({ N: 'normal', T: 'troquelada', E: 'repechaje' }).map(([label, value]) => (
        <button
          key={value}
          className={`min-w-10 rounded px-2 text-sm font-bold ${type === value ? TYPE_COLORS[value].active : TYPE_COLORS[value].inactive}`}
          onClick={() => onChange(value)}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function parseListInput(text) {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
}

// ── Modo individual ──────────────────────────────────────────────
function SingleMode({ onAdd }) {
  const inputRef = useRef(null);
  const [number, setNumber] = useState('');
  const [type, setType] = useState('normal');
  const [feedback, setFeedback] = useState(null); // { text, variant: 'ok'|'dupe'|'error' }
  const [loading, setLoading] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '');
    const { max, maxLen } = CONFIG[type];
    if (digits.length > maxLen) return;
    if (digits !== '' && Number(digits) > max) return;
    setNumber(digits);
    setFeedback(null);
  }

  function switchType(t) {
    setType(t);
    setNumber('');
    setFeedback(null);
    inputRef.current?.focus();
  }

  async function submit() {
    inputRef.current?.focus();
    const value = Number(number);
    if (!number || !Number.isInteger(value) || value < 1) {
      setFeedback({ text: 'Número inválido', variant: 'error' });
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const sticker = await onAdd(value, type);
      setNumber('');
      setFeedback(
        sticker.quantity > 1
          ? { text: `#${sticker.displayCode} · Duplicada ×${sticker.quantity}`, variant: 'dupe' }
          : { text: `#${sticker.displayCode} agregada`, variant: 'ok' }
      );
    } catch {
      setFeedback({ text: 'La figurita no existe', variant: 'error' });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const { max } = CONFIG[type];

  return (
    <div className={`flex flex-wrap items-start gap-2 ${feedback?.variant === 'error' ? 'shake' : ''}`}>
      <div className="min-w-0 flex-1 sm:max-w-44">
        <label className="sr-only" htmlFor="quick-number">Número</label>
        <input
          ref={inputRef}
          id="quick-number"
          className="h-11 w-full rounded-md border border-slate-300 px-3 text-lg font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder={`1 – ${max}`}
          value={number}
          onChange={handleChange}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        />
        {feedback && (
          feedback.variant === 'dupe' ? (
            <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-sm font-bold text-amber-900">
              ⚠ {feedback.text}
            </p>
          ) : (
            <p className={`mt-1 text-sm font-semibold ${feedback.variant === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>
              {feedback.text}
            </p>
          )
        )}
      </div>

      <TypeToggle type={type} onChange={switchType} />

      <button
        className="h-11 min-w-32 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
        onClick={submit}
        type="button"
      >
        {loading ? 'Agregando...' : '+ Agregar'}
      </button>
    </div>
  );
}

// ── Modo lista ───────────────────────────────────────────────────
function ListMode({ onBulkAdd }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('normal');
  const [result, setResult] = useState(null); // { processed, dupes, notFound }
  const [loading, setLoading] = useState(false);

  async function submit() {
    const numbers = parseListInput(text);
    if (!numbers.length) return;

    const { max } = CONFIG[type];
    const valid   = numbers.filter((n) => n >= 1 && n <= max);
    const invalid = numbers.filter((n) => n < 1 || n > max);

    setLoading(true);
    setResult(null);
    try {
      const data = await onBulkAdd(valid.map((number) => ({ number, type })));
      const dupes = data.results.filter((s) => s.quantity > 1).length;
      setResult({
        processed: data.processed,
        dupes,
        notFound: data.notFound.length + invalid.length,
      });
      setText('');
    } finally {
      setLoading(false);
    }
  }

  const count = parseListInput(text).length;

  return (
    <div className="flex flex-wrap items-start gap-2">
      <div className="min-w-0 flex-1">
        <textarea
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 resize-none"
          rows={3}
          placeholder={'Números separados por coma o salto de línea\nEj: 1, 5, 23, 47'}
          value={text}
          onChange={(e) => { setText(e.target.value); setResult(null); }}
        />
        {result && (
          <p className="mt-1 text-sm font-semibold text-emerald-700">
            ✓ {result.processed} agregadas
            {result.dupes > 0 && <span className="ml-2 text-amber-700">· {result.dupes} duplicadas</span>}
            {result.notFound > 0 && <span className="ml-2 text-red-600">· {result.notFound} no encontradas</span>}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <TypeToggle type={type} onChange={setType} />
        <button
          className="h-11 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || !count}
          onClick={submit}
          type="button"
        >
          {loading ? 'Agregando...' : `+ Agregar ${count > 0 ? count : ''}`}
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export default function QuickAdd({ onAdd, onBulkAdd }) {
  const [mode, setMode] = useState('single');

  return (
    <section className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 pt-3 pb-2">
        <div className="mb-2 flex gap-3">
          {[{ label: 'Una a una', value: 'single' }, { label: 'Lista', value: 'list' }].map((m) => (
            <button
              key={m.value}
              className={`text-xs font-semibold pb-0.5 border-b-2 transition-colors ${mode === m.value ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              onClick={() => setMode(m.value)}
              type="button"
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'single'
          ? <SingleMode onAdd={onAdd} />
          : <ListMode onBulkAdd={onBulkAdd} />
        }
      </div>
    </section>
  );
}
