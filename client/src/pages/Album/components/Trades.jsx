import { useCallback, useEffect, useState } from 'react';
import api from '../../../api/client';

const TYPE_OPTIONS = [
  { label: 'Normal', short: 'N', value: 'normal', max: 584 },
  { label: 'Troquelada', short: 'T', value: 'troquelada', max: 48 },
  { label: 'Repechaje', short: 'E', value: 'repechaje', max: 67 }
];

const TYPE_STYLE = {
  normal: 'bg-slate-100 text-slate-600',
  troquelada: 'bg-amber-100 text-amber-700',
  repechaje: 'bg-blue-100 text-blue-700'
};

function typeLabel(type) {
  return TYPE_OPTIONS.find((option) => option.value === type)?.short || 'N';
}

function StickerMiniList({ stickers, quantityKey }) {
  if (!stickers.length) {
    return <p className="px-2 py-1 text-sm italic text-slate-400">Ninguna</p>;
  }
  return (
    <ul className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-slate-200 bg-white p-2">
      {stickers.map((s) => (
        <li key={s.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
          <span className="w-16 font-mono font-bold text-slate-800">#{s.displayCode}</span>
          <span className={`rounded px-1.5 text-xs font-semibold ${TYPE_STYLE[s.type]}`}>
            {typeLabel(s.type)}
          </span>
          {s[quantityKey] > 1 && (
            <span className="ml-auto rounded bg-amber-100 px-1.5 text-xs font-bold text-amber-800">
              ×{s[quantityKey]}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function TradeLineForm({ title, tone, onAdd }) {
  const [type, setType] = useState('normal');
  const [number, setNumber] = useState('');
  const [quantity, setQuantity] = useState('1');

  function submit(e) {
    e.preventDefault();
    const value = Number(number);
    const qty = Number(quantity);
    const config = TYPE_OPTIONS.find((option) => option.value === type);

    if (!Number.isInteger(value) || value < 1 || value > config.max) return;
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) return;

    onAdd({ number: value, type, quantity: qty });
    setNumber('');
    setQuantity('1');
  }

  return (
    <form className="grid gap-2 sm:grid-cols-[1fr_96px_82px_auto]" onSubmit={submit}>
      <label className="sr-only" htmlFor={`${tone}-type`}>{title}</label>
      <select
        id={`${tone}-type`}
        className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        {TYPE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        inputMode="numeric"
        placeholder="N.º"
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/\D/g, ''))}
      />
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        inputMode="numeric"
        placeholder="Cant."
        value={quantity}
        onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))}
      />
      <button
        className={`h-10 rounded-md px-3 text-sm font-bold text-white ${tone === 'give' ? 'bg-amber-700 hover:bg-amber-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}
        type="submit"
      >
        Agregar
      </button>
    </form>
  );
}

function mergeLine(items, next) {
  const index = items.findIndex((item) => item.number === next.number && item.type === next.type);
  if (index === -1) return [...items, next];

  return items.map((item, currentIndex) =>
    currentIndex === index ? { ...item, quantity: item.quantity + next.quantity } : item
  );
}

function formatCode(item) {
  if (item.type === 'normal') return String(item.number).padStart(3, '0');
  return `${typeLabel(item.type)}${String(item.number).padStart(2, '0')}`;
}

function PlannedList({ items, emptyText, onRemove }) {
  if (!items.length) {
    return <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-sm italic text-slate-400">{emptyText}</p>;
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li
          key={`${item.type}:${item.number}`}
          className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <span className="w-16 font-mono font-bold text-slate-800">#{formatCode(item)}</span>
          <span className={`rounded px-1.5 text-xs font-semibold ${TYPE_STYLE[item.type]}`}>
            {typeLabel(item.type)}
          </span>
          <span className="ml-auto font-bold text-slate-700">×{item.quantity}</span>
          <button
            className="rounded px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-red-700"
            onClick={() => onRemove(item)}
            type="button"
          >
            Quitar
          </button>
        </li>
      ))}
    </ul>
  );
}

function TradeBuilder({ onSettled }) {
  const [give, setGive] = useState([]);
  const [receive, setReceive] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  function removeFrom(listSetter, target) {
    listSetter((items) => items.filter((item) => item.number !== target.number || item.type !== target.type));
  }

  async function settle() {
    if (!give.length && !receive.length) return;

    setLoading(true);
    setMessage(null);

    try {
      const { data } = await api.post('/trades/settle', { give, receive });
      setGive([]);
      setReceive([]);
      const givenCount = data.give.reduce((total, item) => total + item.quantity, 0);
      const receivedCount = data.receive.reduce((total, item) => total + item.quantity, 0);
      setMessage({
        variant: 'ok',
        text: `Operación aplicada: entregaste ${givenCount} y recibiste ${receivedCount}.`
      });
      await onSettled?.();
    } catch (error) {
      setMessage({
        variant: 'error',
        text: error.response?.data?.message || 'No se pudo aplicar la operación'
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-subtle">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-slate-900">Armar intercambio</h2>
        <p className="text-sm text-slate-500">
          Para regalar, agrega solo lo que entregas. Para un 5 por 1, agrega varias en Entrego y una en Recibo.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold text-amber-700">Entrego</h3>
          <TradeLineForm title="Figuritas que entrego" tone="give" onAdd={(item) => setGive((items) => mergeLine(items, item))} />
          <div className="mt-2">
            <PlannedList
              items={give}
              emptyText="Aún no agregaste figuritas para entregar."
              onRemove={(item) => removeFrom(setGive, item)}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 font-semibold text-emerald-700">Recibo</h3>
          <TradeLineForm title="Figuritas que recibo" tone="receive" onAdd={(item) => setReceive((items) => mergeLine(items, item))} />
          <div className="mt-2">
            <PlannedList
              items={receive}
              emptyText="Puedes dejar esto vacío si estás regalando."
              onRemove={(item) => removeFrom(setReceive, item)}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="h-10 rounded-md bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading || (!give.length && !receive.length)}
          onClick={settle}
          type="button"
        >
          {loading ? 'Aplicando...' : 'Aplicar al álbum'}
        </button>
        <button
          className="h-10 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-100"
          disabled={loading}
          onClick={() => { setGive([]); setReceive([]); setMessage(null); }}
          type="button"
        >
          Limpiar
        </button>
        {message && (
          <p className={`text-sm font-semibold ${message.variant === 'error' ? 'text-red-700' : 'text-emerald-700'}`}>
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}

function TradeDetail({ userId, username, onBack }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    api.get(`/trades/${userId}`).then(({ data }) => setDetail(data));
  }, [userId]);

  if (!detail) {
    return <p className="mt-8 text-center text-slate-500">Cargando...</p>;
  }

  const { theyHaveINeed, iHaveTheyNeed } = detail;

  return (
    <section className="mt-4">
      <button
        className="mb-4 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        onClick={onBack}
        type="button"
      >
        ← Volver
      </button>

      <h2 className="mb-1 text-lg font-bold">Intercambio con {username}</h2>
      <p className="mb-3 text-sm text-slate-500">
        {username} te puede dar <strong className="text-emerald-700">{theyHaveINeed.length}</strong> figuritas ·
        Puedes dar <strong className="text-amber-700">{iHaveTheyNeed.length}</strong>
      </p>

      {(detail.user.phone || detail.user.email) && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-subtle">
          <p className="mb-1 font-semibold text-slate-700">Contacto de {username}</p>
          {detail.user.phone && (
            <p className="text-slate-600">
              Celular:{' '}
              <a className="font-medium text-emerald-700 hover:underline" href={`tel:${detail.user.phone}`}>
                {detail.user.phone}
              </a>
            </p>
          )}
          {detail.user.email && (
            <p className="text-slate-600">
              Correo:{' '}
              <a className="font-medium text-emerald-700 hover:underline" href={`mailto:${detail.user.email}`}>
                {detail.user.email}
              </a>
            </p>
          )}
        </div>
      )}

      {!detail.user.phone && !detail.user.email && (
        <p className="mb-4 text-sm italic text-slate-400">
          {username} no ha compartido datos de contacto.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold text-emerald-700">
            {username} te puede dar ({theyHaveINeed.length})
          </h3>
          <StickerMiniList stickers={theyHaveINeed} quantityKey="theirQuantity" />
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-amber-700">
            Puedes dar ({iHaveTheyNeed.length})
          </h3>
          <StickerMiniList stickers={iHaveTheyNeed} quantityKey="myQuantity" />
        </div>
      </div>
    </section>
  );
}

export default function Trades({ onCollectionChanged }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { id, username }

  const loadUsers = useCallback(async () => {
    const { data } = await api.get('/trades');
    setUsers(data);
  }, []);

  async function refreshTrades() {
    await Promise.all([loadUsers(), onCollectionChanged?.()]);
  }

  useEffect(() => {
    loadUsers().finally(() => setLoading(false));
  }, [loadUsers]);

  const content = (() => {
    if (loading) {
      return <p className="mt-8 text-center text-slate-500">Cargando intercambios...</p>;
    }

    if (!users.length) {
      return (
        <section className="mt-4 rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="font-semibold text-slate-700">Sin intercambios disponibles</p>
          <p className="mt-1 text-sm text-slate-500">
            Ningún otro usuario tiene figuritas que te falten, ni lo que tienes repetido.
          </p>
        </section>
      );
    }

    return (
      <section className="mt-4 space-y-2">
        <p className="text-sm text-slate-500">
          {users.length} {users.length === 1 ? 'usuario tiene' : 'usuarios tienen'} figuritas para intercambiar contigo.
        </p>
        {users.map((u) => (
          <button
            key={u.id}
            className="flex w-full flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-subtle hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
            onClick={() => setSelected(u)}
            type="button"
          >
            <span className="font-semibold text-slate-900">{u.username}</span>
            <span className="flex flex-wrap gap-4 text-sm">
              <span className="text-emerald-700">Te dan: {u.can_give_me}</span>
              <span className="text-amber-700">Das: {u.i_can_give}</span>
              <span className="text-slate-400">→</span>
            </span>
          </button>
        ))}
      </section>
    );
  })();

  if (selected) {
    return (
      <TradeDetail
        userId={selected.id}
        username={selected.username}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <>
      <TradeBuilder onSettled={refreshTrades} />
      {content}
    </>
  );
}
