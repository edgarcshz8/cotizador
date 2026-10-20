import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import QuoteBuilder from './pages/QuoteBuilder.jsx';
import QuoteHistory from './pages/QuoteHistory.jsx';
import AdminServices from './pages/AdminServices.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<QuoteBuilder />} />
          <Route path="cotizaciones" element={<QuoteHistory />} />
          <Route path="servicios" element={<AdminServices />} />
          <Route path="configuracion" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
