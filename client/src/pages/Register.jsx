import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register({ onNavigate }) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar el usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-subtle">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            3 Reyes del Mundial 2026
          </p>
          <h1 className="mt-2 text-2xl font-bold">Crear cuenta</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Usuario</span>
            <input
              autoFocus
              className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contrasena</span>
            <input
              className="mt-1 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>

          {error && <p className="text-sm font-medium text-red-700">{error}</p>}

          <button
            className="h-11 w-full rounded-md bg-emerald-700 font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Ya tienes cuenta?{' '}
          <button
            className="font-semibold text-emerald-700 hover:text-emerald-800"
            onClick={() => onNavigate('login')}
            type="button"
          >
            Entra aqui
          </button>
        </p>
      </section>
    </main>
  );
}
