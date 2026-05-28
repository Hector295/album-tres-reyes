const statusOptions = [
  { label: 'Todas', value: '' },
  { label: 'Tengo', value: 'owned' },
  { label: 'Me faltan', value: 'missing' },
  { label: 'Repetidas', value: 'duplicate' }
];

const typeOptions = [
  { label: 'Todas', value: '' },
  { label: 'Normales', value: 'normal' },
  { label: 'Troqueladas', value: 'troquelada' },
  { label: 'Repechaje', value: 'repechaje' }
];

export default function FilterBar({ search, setSearch, status, setStatus, type, setType }) {
  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-subtle">
      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <button
            className={`h-10 rounded-md px-3 text-sm font-semibold ${
              status === option.value
                ? 'bg-slate-950 text-white'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
            key={option.value}
            onClick={() => setStatus(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <button
              className={`h-10 rounded-md px-3 text-sm font-semibold ${
                type === option.value
                  ? 'bg-emerald-700 text-white'
                  : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              key={option.value}
              onClick={() => setType(option.value)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        <input
          className="h-10 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:w-72"
          placeholder="N.º de figurita (ej: 023, T05, E12)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </section>
  );
}
