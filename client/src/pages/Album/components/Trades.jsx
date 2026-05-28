import { useEffect, useState } from 'react';
import api from '../../../api/client';

function StickerMiniList({ stickers, quantityKey }) {
  if (!stickers.length) {
    return <p className="px-2 py-1 text-sm italic text-slate-400">Ninguna</p>;
  }
  return (
    <ul className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-slate-200 bg-white p-2">
      {stickers.map((s) => (
        <li key={s.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
          <span className="w-16 font-mono font-bold text-slate-800">#{s.displayCode}</span>
          <span className={`rounded px-1.5 text-xs font-semibold ${s.type === 'troquelada' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            {s.type === 'troquelada' ? 'T' : 'N'}
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

export default function Trades() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { id, username }

  useEffect(() => {
    api.get('/trades')
      .then(({ data }) => setUsers(data))
      .finally(() => setLoading(false));
  }, []);

  if (selected) {
    return (
      <TradeDetail
        userId={selected.id}
        username={selected.username}
        onBack={() => setSelected(null)}
      />
    );
  }

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
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-subtle hover:bg-slate-50"
          onClick={() => setSelected(u)}
          type="button"
        >
          <span className="font-semibold text-slate-900">{u.username}</span>
          <span className="flex gap-4 text-sm">
            <span className="text-emerald-700">Te dan: {u.can_give_me}</span>
            <span className="text-amber-700">Das: {u.i_can_give}</span>
            <span className="text-slate-400">→</span>
          </span>
        </button>
      ))}
    </section>
  );
}
