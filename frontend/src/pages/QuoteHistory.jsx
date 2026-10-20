import { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Eye, X } from 'lucide-react';

const STATUS_COLORS = {
  pendiente: 'bg-amber-100 text-amber-700',
  aceptada:  'bg-emerald-100 text-emerald-700',
  rechazada: 'bg-red-100 text-red-700',
};
const STATUSES = ['pendiente', 'aceptada', 'rechazada'];

export default function QuoteHistory() {
  const [quotes, setQuotes] = useState([]);
  const [detail, setDetail] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await axios.get('/api/quotes');
    setQuotes(data);
  };

  const openDetail = async (id) => {
    const { data } = await axios.get(`/api/quotes/${id}`);
    setDetail(data);
  };

  const changeStatus = async (id, status) => {
    await axios.put(`/api/quotes/${id}/status`, { status });
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    if (detail?.id === id) setDetail(p => ({ ...p, status }));
  };

  const downloadPDF = (id) => window.open(`/api/quotes/${id}/pdf`, '_blank');

  const fmt = (n, cur = 'CLP') =>
    `${cur} ${new Intl.NumberFormat('es-CL').format(Math.round(parseFloat(n) || 0))}`;

  const visible = quotes.filter(q => !filter || q.status === filter);

  return (
    <div className="flex h-full">
      {/* ── List ─────────────────────────────────────── */}
      <div className={`${detail ? 'hidden lg:flex' : 'flex'} flex-col flex-1 overflow-hidden`}>
        <div className="px-6 py-4 border-b bg-white flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Historial de Cotizaciones</h1>
            <p className="text-gray-400 text-xs mt-0.5">{visible.length} cotizaciones</p>
          </div>
          <div className="flex gap-1.5">
            {['', ...STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === s
                    ? 'bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s || 'Todas'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                {['N° Cotización','Cliente','Fecha','Total','Estado',''].map(h => (
                  <th key={h} className={`px-5 py-3 font-medium text-gray-400 text-xs ${h === 'Total' || h === '' ? 'text-right' : 'text-left'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y bg-white">
              {visible.map(q => (
                <tr key={q.id} className={`hover:bg-gray-50 cursor-pointer ${detail?.id === q.id ? 'bg-blue-50' : ''}`}
                    onClick={() => openDetail(q.id)}>
                  <td className="px-5 py-3 font-semibold text-blue-700 text-xs">{q.quote_number}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{q.client_name}</p>
                    {q.client_company && <p className="text-xs text-gray-400">{q.client_company}</p>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(q.created_at).toLocaleDateString('es-CL')}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-xs">
                    {fmt(q.total, q.currency)}
                  </td>
                  <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                    <select
                      value={q.status}
                      onChange={e => changeStatus(q.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full cursor-pointer border-0 ${STATUS_COLORS[q.status]}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => downloadPDF(q.id)}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-500 transition-colors"
                    >
                      <Download size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  Sin cotizaciones
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail panel ─────────────────────────────── */}
      {detail && (
        <div className="w-full lg:w-96 border-l bg-white flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900">{detail.quote_number}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(detail.created_at).toLocaleDateString('es-CL')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => downloadPDF(detail.id)}
                      className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                <Download size={12} /> PDF
              </button>
              <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Cliente</p>
              <p className="font-semibold text-gray-900">{detail.client_name}</p>
              {[detail.client_company, detail.client_email, detail.client_phone].filter(Boolean).map((v, i) => (
                <p key={i} className="text-sm text-gray-500 mt-0.5">{v}</p>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Servicios</p>
              <div className="border rounded-xl overflow-hidden">
                {detail.items?.map(item => (
                  <div key={item.id} className="px-4 py-2.5 border-b last:border-0 flex justify-between items-start gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.service_name}</p>
                      <p className="text-xs text-gray-400">{item.quantity}× {fmt(item.unit_price, detail.currency)}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 flex-shrink-0">
                      {fmt(item.subtotal, detail.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span><span>{fmt(detail.subtotal, detail.currency)}</span>
              </div>
              {parseFloat(detail.discount_percent) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Descuento ({detail.discount_percent}%)</span>
                  <span>− {fmt(detail.discount_amount, detail.currency)}</span>
                </div>
              )}
              {parseFloat(detail.tax_percent) > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>IVA ({detail.tax_percent}%)</span>
                  <span>{fmt(detail.tax_amount, detail.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-blue-800 border-t pt-2 mt-1">
                <span>TOTAL</span>
                <span>{fmt(detail.total, detail.currency)}</span>
              </div>
            </div>

            {detail.notes && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">Notas</p>
                <p className="text-sm text-amber-800">{detail.notes}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Estado</p>
              <select
                value={detail.status}
                onChange={e => changeStatus(detail.id, e.target.value)}
                className={`text-sm font-medium px-3 py-2 rounded-lg w-full border cursor-pointer ${STATUS_COLORS[detail.status]}`}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
