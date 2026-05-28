import { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import Album from './pages/Album.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState('login');

  if (isAuthenticated) return <Album />;
  if (page === 'register') return <Register onNavigate={setPage} />;
  return <Login onNavigate={setPage} />;
}
