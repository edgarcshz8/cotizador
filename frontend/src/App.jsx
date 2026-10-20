import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Layout from './components/Layout.jsx'; 
import Login from './pages/Login.jsx';
import QuoteBuilder from './pages/QuoteBuilder.jsx';
import QuoteHistory from './pages/QuoteHistory.jsx';
import AdminServices from './pages/AdminServices.jsx';
import Settings from './pages/Settings.jsx';
import { getToken, removeToken, isLoggedIn } from './utils/auth.js';

// Adjunta el token en cada petición y redirige al login si expira
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default function App() {
  const [logged, setLogged] = useState(isLoggedIn());

  const handleLogin  = () => setLogged(true);
  const handleLogout = () => { removeToken(); setLogged(false); };

  if (!logged) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout onLogout={handleLogout} />}>
          <Route index element={<QuoteBuilder />} />
          <Route path="cotizaciones" element={<QuoteHistory />} />
          <Route path="servicios" element={<AdminServices />} />
          <Route path="configuracion" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
