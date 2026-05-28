import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import FilterBar from './Album/components/FilterBar.jsx';
import QuickAdd from './Album/components/QuickAdd.jsx';
import StatsBar from './Album/components/StatsBar.jsx';
import StickerList from './Album/components/StickerList.jsx';
import Trades from './Album/components/Trades.jsx';
import Profile from './Album/components/Profile.jsx';
import ExportPDF from './Album/components/ExportPDF.jsx';

const emptyStats = { total: 699, owned: 0, missing: 699, duplicates: 0 };

export default function Album() {
  const { logout, user } = useAuth();
  const [view, setView] = useState('album'); // 'album' | 'trades'
  const [stickers, setStickers] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const params = useMemo(() => ({ status, type, search }), [status, type, search]);

  const loadStickers = useCallback(async () => {
    const cleanParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value));
    const { data } = await api.get('/stickers', { params: cleanParams });
    setStickers(data);
  }, [params]);

  const loadStats = useCallback(async () => {
    const { data } = await api.get('/stickers/stats');
    setStats(data);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadStickers(), loadStats()]);
  }, [loadStats, loadStickers]);

  useEffect(() => {
    let active = true;
    setError('');
    setLoading(true);

    loadStickers()
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'No se pudo cargar el álbum');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [loadStickers]);

  useEffect(() => {
    loadStats().catch(() => setStats(emptyStats));
  }, [loadStats]);

  async function changeQuantity(stickerId, action) {
    const { data } = await api.post(`/stickers/${stickerId}/${action}`);
    setStickers((current) =>
      current.map((sticker) => (sticker.id === data.id ? { ...sticker, quantity: data.quantity } : sticker))
    );
    await loadStats();
    return data;
  }

  async function addByNumber(number, selectedType) {
    const normalized = Number(number);
    const target = stickers.find(
      (sticker) => sticker.number === normalized && sticker.type === selectedType
    );

    if (!target) {
      const { data } = await api.get('/stickers', {
        params: { type: selectedType, search: selectedType === 'normal' ? String(normalized).padStart(3, '0') : `T${String(normalized).padStart(2, '0')}` }
      });
      const exact = data.find((sticker) => sticker.number === normalized && sticker.type === selectedType);
      if (!exact) throw new Error('Figurita no encontrada');
      const updated = await changeQuantity(exact.id, 'add');
      await refresh();
      return updated;
    }

    return changeQuantity(target.id, 'add');
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-bold sm:text-2xl">3 Reyes del Mundial 2026</h1>
            <p className="text-xs font-medium text-slate-500 sm:text-sm">{user?.username}</p>
          </div>
          <button
            className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            onClick={logout}
            type="button"
          >
            Salir
          </button>
        </div>

        <div className="mx-auto flex max-w-6xl overflow-x-auto px-4 pb-0 scrollbar-none">
          {[{ label: 'Mi álbum', value: 'album' }, { label: 'Intercambios', value: 'trades' }, { label: 'Perfil', value: 'profile' }, { label: 'Exportar PDF', value: 'export' }].map((tab) => (
            <button
              key={tab.value}
              className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                view === tab.value
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setView(tab.value)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {view === 'album' ? (
        <>
          <QuickAdd onAdd={addByNumber} />
          <section className="mx-auto max-w-6xl px-4 py-4">
            <StatsBar stats={stats} />
            <FilterBar
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              type={type}
              setType={setType}
            />
            {error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
            <StickerList
              loading={loading}
              stickers={stickers}
              onAdd={(id) => changeQuantity(id, 'add')}
              onRemove={(id) => changeQuantity(id, 'remove')}
            />
          </section>
        </>
      ) : view === 'trades' ? (
        <section className="mx-auto max-w-6xl px-4 py-4">
          <Trades />
        </section>
      ) : view === 'profile' ? (
        <section className="mx-auto max-w-6xl px-4 py-4">
          <Profile />
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-4 py-4">
          <ExportPDF username={user?.username} />
        </section>
      )}
    </main>
  );
}
