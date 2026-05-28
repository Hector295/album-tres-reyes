import { useEffect, useRef, useState } from 'react';

const CONFIG = {
  normal:     { max: 584, maxLen: 3 },
  troquelada: { max: 48,  maxLen: 2 },
};

export default function QuickAdd({ onAdd }) {
  const inputRef = useRef(null);
  const [number, setNumber] = useState('');
  const [type, setType] = useState('normal');
  const [feedback, setFeedback] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '');
    const { max, maxLen } = CONFIG[type];
    if (digits.length > maxLen) return;
    if (digits !== '' && Number(digits) > max) return;
    setNumber(digits);
    setIsError(false);
  }

  function switchType(t) {
    setType(t);
    setNumber('');
    setFeedback('');
    // foco sincrónico para que el teclado no se cierre en mobile
    inputRef.current?.focus();
  }

  async function submit() {
    // focus() sincrónico dentro del handler de interacción: el teclado permanece abierto en iOS
    inputRef.current?.focus();

    const value = Number(number);
    if (!number || !Number.isInteger(value) || value < 1) {
      setFeedback('Número inválido');
      setIsError(true);
      return;
    }

    setLoading(true);
    setFeedback('');
    setIsError(false);

    try {
      const sticker = await onAdd(value, type);
      setNumber('');
      setFeedback(sticker.quantity > 1 ? `Repetida ×${sticker.quantity}` : `Agregada #${sticker.displayCode}`);
    } catch {
      setFeedback('La figurita no existe');
      setIsError(true);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const { max } = CONFIG[type];
  const isDuplicateFeedback = !isError && feedback.startsWith('Repetida');

  return (
    <section className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className={`mx-auto flex max-w-6xl flex-wrap items-start gap-2 px-4 py-3 ${isError ? 'shake' : ''}`}>
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
            isDuplicateFeedback ? (
              <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-sm font-bold text-amber-900">
                ⚠ Duplicada · {feedback.replace('Repetida ', '')}
              </p>
            ) : (
              <p className={`mt-1 text-sm font-semibold ${isError ? 'text-red-700' : 'text-emerald-700'}`}>
                {feedback}
              </p>
            )
          )}
        </div>

        <div className="grid h-11 grid-cols-2 rounded-md border border-slate-300 bg-slate-100 p-1">
          <button
            className={`min-w-11 rounded px-3 text-sm font-bold ${type === 'normal' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
            onClick={() => switchType('normal')}
            type="button"
          >
            N
          </button>
          <button
            className={`min-w-11 rounded px-3 text-sm font-bold ${type === 'troquelada' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600'}`}
            onClick={() => switchType('troquelada')}
            type="button"
          >
            T
          </button>
        </div>

        <button
          className="h-11 min-w-32 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          onClick={submit}
          type="button"
        >
          {loading ? 'Agregando...' : '+ Agregar'}
        </button>
      </div>
    </section>
  );
}
