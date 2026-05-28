import { useEffect, useState } from 'react';
import api from '../../../api/client';

export default function Profile() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { text, error }

  useEffect(() => {
    api.get('/profile').then(({ data }) => {
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await api.put('/profile', { phone: phone || null, email: email || null });
      setMessage({ text: 'Datos guardados correctamente.' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'No se pudo guardar.', error: true });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="mt-8 text-center text-slate-500">Cargando perfil...</p>;

  return (
    <section className="mt-4 mx-auto max-w-md">
      <h2 className="mb-1 text-lg font-bold">Datos de contacto</h2>
      <p className="mb-4 text-sm text-slate-500">
        Opcional. Otros usuarios los verán cuando quieran intercambiar figuritas contigo.
      </p>

      <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-subtle space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Número de celular</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            type="tel"
            placeholder="+51987654321"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Correo electrónico</span>
          <input
            className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {message && (
          <p className={`text-sm font-medium ${message.error ? 'text-red-700' : 'text-emerald-700'}`}>
            {message.text}
          </p>
        )}

        <button
          className="h-11 w-full rounded-md bg-emerald-700 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </section>
  );
}
