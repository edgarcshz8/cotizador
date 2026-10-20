import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Minus, Trash2, FileDown, Search, ChevronDown,
  ChevronRight, X, Package, UserCheck, UserX,
} from 'lucide-react';

export default function QuoteBuilder() {
  const [services, setServices] = useState([]);
  const [cart, setCart] = useState([]);
  const [client, setClient] = useState({ name: '', email: '', company: '', phone: '' });
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('CLP');
  const [validDays, setValidDays] = useState(30);
  const [search, setSearch] = useState('');
  const [openCats, setOpenCats] = useState({});
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(null);
  const [rutSearch, setRutSearch]   = useState('');
  const [rutStatus, setRutStatus]   = useState(null); // 'found' | 'notfound' | null

  useEffect(() => {
    axios.get('/api/services').then(({ data }) => {
      setServices(data);
      const cats = {};
      data.forEach(s => { cats[s.category || 'Otro'] = true; });
      setOpenCats(cats);
    });
    axios.get('/api/settings').then(({ data }) => {
      if (data.currency) setCurrency(data.currency);
      if (data.tax_percent) setTax(parseFloat(data.tax_percent));
      if (data.quote_valid_days) setValidDays(data.quote_valid_days);
    });
  }, []);

  const grouped = services
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .reduce((acc, s) => {
      const cat = s.category || 'Otro';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    }, {});

  const addToCart = (service) => {
    setCart(prev => {
      const existing = prev.find(i => i.service_id === service.id);
      if (existing) {
        return prev.map(i =>
          i.service_id === service.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        service_id: service.id,
        service_name: service.name,
        description: service.description,
        unit_price: parseFloat(service.unit_price),
        quantity: 1,
        unit_label: service.unit_label,
      }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev
        .map(i => i.service_id === id ? { ...i, quantity: i.quantity + delta } : i)
        .filter(i => i.quantity > 0)
    );
  };

  const updatePrice = (id, val) => {
    setCart(prev =>
      prev.map(i => i.service_id === id ? { ...i, unit_price: parseFloat(val) || 0 } : i)
    );
  };

  const removeItem = (id) => setCart(prev => prev.filter(i => i.service_id !== id));

  const searchByRut = async () => {
    if (!rutSearch.trim()) return;
    try {
      const { data } = await axios.get(`/api/clients/rut/${encodeURIComponent(rutSearch.trim())}`);
      setClient({
        name:    data.name    || '',
        email:   data.email   || '',
        company: data.company || '',
        phone:   data.phone   || '',
      });
      setRutStatus('found');
    } catch {
      setRutStatus('notfound');
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const discountAmt = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmt;
  const taxAmt = afterDiscount * (tax / 100);
  const total = afterDiscount + taxAmt;

  const fmt = (n) => new Intl.NumberFormat('es-CL').format(Math.round(n));

  const handleSubmit = async () => {
    if (!client.name.trim()) { alert('Ingresa el nombre del cliente.'); return; }
    if (cart.length === 0) { alert('Agrega al menos un servicio.'); return; }
    setLoading(true);
    try {
      const { data } = await axios.post('/api/quotes', {
        client_name: client.name,
        client_email: client.email,
        client_company: client.company,
        client_phone: client.phone,
        items: cart,
        discount_percent: discount,
        tax_percent: tax,
        notes,
        currency,
        valid_days: validDays,
      });
      setSuccess(data);
      const pdf = await axios.get(`/api/quotes/${data.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(pdf.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setCart([]);
      setClient({ name: '', email: '', company: '', phone: '' });
      setNotes('');
    } catch {
      alert('Error al generar la cotización.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* ── Catalog panel ──────────────────────────────────────── */}
      <div className="w-72 bg-white border-r flex flex-col flex-shrink-0 overflow-hidden">
        <div className="p-4 border-b">
          <p className="text-sm font-semibold text-gray-700 mb-2">Catálogo de Servicios</p>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide"
              >
                {cat}
                {openCats[cat] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>

              {openCats[cat] && items.map(s => {
                const inCart = cart.find(i => i.service_id === s.id);
                return (
                  <div key={s.id} className="px-3 py-2.5 border-t hover:bg-orange-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 leading-tight">{s.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-tight">{s.description}</p>
                        <p className="text-xs font-bold text-orange-600 mt-1">
                          {currency} {fmt(s.unit_price)}<span className="font-normal text-gray-500"> / {s.unit_label}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(s)}
                        className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                          inCart
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 hover:bg-orange-600 hover:text-white text-gray-600'
                        }`}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    {inCart && (
                      <p className="text-xs text-orange-600 font-medium mt-1">
                        En cotización: {inCart.quantity}×
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Sin resultados</p>
          )}
        </div>
      </div>

      {/* ── Builder panel ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-5">

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
              <p className="text-green-700 text-sm">
                Cotización <strong>{success.quote_number}</strong> generada. PDF descargando...
              </p>
              <button onClick={() => setSuccess(null)}>
                <X size={15} className="text-green-500 hover:text-green-700" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
              <p className="text-gray-400 text-sm mt-0.5">Selecciona servicios del panel izquierdo</p>
            </div>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {['CLP', 'USD', 'EUR', 'UF'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Client */}
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm font-semibold text-gray-700 mb-4">Datos del Cliente</p>

            {/* Búsqueda por RUT */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por RUT..."
                  value={rutSearch}
                  onChange={e => { setRutSearch(e.target.value); setRutStatus(null); }}
                  onKeyDown={e => e.key === 'Enter' && searchByRut()}
                  className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                onClick={searchByRut}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Buscar
              </button>
            </div>

            {rutStatus === 'found' && (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4 text-sm">
                <UserCheck size={15} /> Cliente encontrado — datos cargados automáticamente
              </div>
            )}
            {rutStatus === 'notfound' && (
              <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 text-sm">
                <UserX size={15} /> RUT no registrado — ingresa los datos manualmente
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name',    label: 'Nombre *',  ph: 'Juan Pérez' },
                { key: 'company', label: 'Empresa',   ph: 'Empresa SpA' },
                { key: 'email',   label: 'Email',     ph: 'juan@empresa.cl', type: 'email' },
                { key: 'phone',   label: 'Teléfono',  ph: '+56 9 1234 5678' },
              ].map(({ key, label, ph, type = 'text' }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                  <input
                    type={type}
                    value={client[key]}
                    onChange={e => setClient(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={ph}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border">
            <div className="px-5 py-3.5 border-b">
              <p className="text-sm font-semibold text-gray-700">
                Servicios {cart.length > 0 && <span className="text-orange-600">({cart.length})</span>}
              </p>
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Agrega servicios desde el catálogo</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-12 px-5 py-2 text-xs font-medium text-gray-400 bg-gray-50 border-b">
                  <span className="col-span-4">Servicio</span>
                  <span className="col-span-2 text-center">Cant.</span>
                  <span className="col-span-3 text-right">Precio unitario</span>
                  <span className="col-span-2 text-right">Subtotal</span>
                  <span className="col-span-1" />
                </div>
                {cart.map(item => (
                  <div key={item.service_id}
                       className="grid grid-cols-12 items-center px-5 py-3 border-b last:border-0 hover:bg-gray-50">
                    <div className="col-span-4">
                      <p className="text-sm font-medium text-gray-800">{item.service_name}</p>
                      <p className="text-xs text-gray-400">{item.unit_label}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-center gap-1">
                      <button onClick={() => updateQty(item.service_id, -1)}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600">
                        <Minus size={11} />
                      </button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.service_id, 1)}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600">
                        <Plus size={11} />
                      </button>
                    </div>
                    <div className="col-span-3 flex justify-end">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={e => updatePrice(item.service_id, e.target.value)}
                        className="w-28 text-right border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-sm font-semibold text-gray-800">
                        {currency} {fmt(item.quantity * item.unit_price)}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => removeItem(item.service_id)}
                              className="p-1 rounded text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Options & totals */}
          {cart.length > 0 && (
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descuento (%)</label>
                  <input type="number" min="0" max="100" value={discount}
                    onChange={e => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IVA (%)</label>
                  <input type="number" min="0" value={tax}
                    onChange={e => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Validez (días)</label>
                  <input type="number" min="1" value={validDays}
                    onChange={e => setValidDays(parseInt(e.target.value) || 30)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Condiciones de pago, plazos de entrega, aclaraciones..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              <div className="border-t pt-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Subtotal</span>
                  <span>{currency} {fmt(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Descuento ({discount}%)</span>
                    <span>− {currency} {fmt(discountAmt)}</span>
                  </div>
                )}
                {tax > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>IVA ({tax}%)</span>
                    <span>{currency} {fmt(taxAmt)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-1">
                  <span>TOTAL</span>
                  <span>{currency} {fmt(total)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !client.name.trim()}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <FileDown size={17} />
                {loading ? 'Generando...' : 'Generar Cotización y Descargar PDF'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
