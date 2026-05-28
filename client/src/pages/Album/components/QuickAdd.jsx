import { useEffect, useRef, useState } from 'react';

export default function QuickAdd({ onAdd }) {
  const inputRef = useRef(null);
  const [number, setNumber] = useState('');
  const [type, setType] = useState('normal');
  const [feedback, setFeedback] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    const value = Number(number);

    if (!Number.isInteger(value) || value < 1) {
      setFeedback('Número inválido');
      setIsError(true);
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setFeedback('');
    setIsError(false);

    try {
      const sticker = await onAdd(value, type);
      setNumber('');
      setFeedback(sticker.quantity > 1 ? `Repetida x${sticker.quantity}` : `Agregada! #${sticker.displayCode}`);
    } catch {
      setFeedback('La figurita no existe');
      setIsError(true);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  return (
    <section className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <form
        className={`mx-auto flex max-w-6xl flex-wrap items-start gap-2 px-4 py-3 ${isError ? 'shake' : ''}`}
        onSubmit={handleSubmit}
      >
        <div className="min-w-0 flex-1 sm:max-w-44">
          <label className="sr-only" htmlFor="quick-number">Número</label>
          <input
            ref={inputRef}
            id="quick-number"
            className="h-11 w-full rounded-md border border-slate-300 px-3 text-lg font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            inputMode="numeric"
            min="1"
            placeholder="Número"
            type="number"
            value={number}
            onChange={(e) => { setNumber(e.target.value); setIsError(false); }}
          />
          {feedback && (
            <p className={`mt-1 text-sm font-semibold ${isError ? 'text-red-700' : 'text-emerald-700'}`}>
              {feedback}
            </p>
          )}
        </div>

        <div className="grid h-11 grid-cols-2 rounded-md border border-slate-300 bg-slate-100 p-1">
          <button
            className={`min-w-11 rounded px-3 text-sm font-bold ${type === 'normal' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'}`}
            onClick={() => setType('normal')}
            type="button"
          >
            N
          </button>
          <button
            className={`min-w-11 rounded px-3 text-sm font-bold ${type === 'troquelada' ? 'bg-white text-amber-800 shadow-sm' : 'text-slate-600'}`}
            onClick={() => setType('troquelada')}
            type="button"
          >
            T
          </button>
        </div>

        <button
          className="h-11 min-w-32 rounded-md bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Agregando...' : '+ Agregar'}
        </button>
      </form>
    </section>
  );
}
