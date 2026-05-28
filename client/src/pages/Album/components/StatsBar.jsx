export default function StatsBar({ stats }) {
  const items = [
    { label: 'Tengo', value: `${stats.owned} / ${stats.total}` },
    { label: 'Me faltan', value: stats.missing },
    { label: 'Repetidas', value: stats.duplicates }
  ];

  return (
    <section className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-subtle sm:grid-cols-3">
      {items.map((item) => (
        <div className="border-b border-r border-slate-200 p-4 last:border-r-0 sm:border-b-0" key={item.label}>
          <p className="text-sm font-semibold text-slate-500">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{item.value}</p>
        </div>
      ))}
    </section>
  );
}
