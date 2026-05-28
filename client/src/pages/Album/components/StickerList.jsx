function StickerRow({ sticker, onAdd, onRemove }) {
  const isMissing = sticker.quantity === 0;
  const isDuplicate = sticker.quantity > 1;

  return (
    <div
      className={`mb-2 grid min-h-[68px] grid-cols-[72px_1fr_auto] items-center gap-2 rounded-lg border px-3 py-2 sm:grid-cols-[88px_1fr_132px] ${
        isMissing ? 'border-slate-200 bg-white text-slate-400' : 'border-slate-200 bg-white text-slate-950 shadow-sm'
      }`}
    >
      <div>
        <p className="text-lg font-bold">#{sticker.displayCode}</p>
        <p className="text-xs font-semibold uppercase text-slate-500">
          {sticker.type === 'troquelada' ? 'Troquelada' : 'Normal'}
        </p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold sm:text-base">
          {sticker.name || (sticker.type === 'troquelada' ? 'Troquelada' : '----------')}
        </p>
        {isDuplicate && (
          <span className="mt-1 inline-flex rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
            x{sticker.quantity}
          </span>
        )}
      </div>

      <div className="flex h-11 items-center justify-end gap-1">
        <button
          aria-label={`Quitar ${sticker.displayCode}`}
          className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          disabled={sticker.quantity === 0}
          onClick={() => onRemove(sticker.id)}
          type="button"
        >
          −
        </button>
        <span className="grid h-10 min-w-10 place-items-center rounded-md bg-slate-100 px-2 text-sm font-bold text-slate-800">
          {sticker.quantity}
        </span>
        <button
          aria-label={`Agregar ${sticker.displayCode}`}
          className="grid h-10 w-10 place-items-center rounded-md bg-emerald-700 text-white hover:bg-emerald-800"
          onClick={() => onAdd(sticker.id)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function StickerList({ loading, stickers, onAdd, onRemove }) {
  if (loading) {
    return (
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-center font-semibold text-slate-500">
        Cargando album...
      </section>
    );
  }

  if (!stickers.length) {
    return (
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-6 text-center font-semibold text-slate-500">
        No hay figuritas para esos filtros.
      </section>
    );
  }

  return (
    <section className="mt-4 max-h-[calc(100vh-340px)] min-h-[360px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 shadow-subtle">
      {stickers.map((sticker) => (
        <StickerRow key={sticker.id} sticker={sticker} onAdd={onAdd} onRemove={onRemove} />
      ))}
    </section>
  );
}
