import { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, CheckCircle } from 'lucide-react';

export default function Settings() {
  const [form, setForm] = useState({
    name: '', rut: '', email: '', phone: '', address: '',
    website: '', currency: 'CLP', tax_percent: 0,
    quote_valid_days: 30, footer_text: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get('/api/settings').then(({ data }) => {
      setForm(prev => ({ ...prev, ...data }));
    });
  }, []);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const save = async () => {
    await axios.put('/api/settings', form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-400 text-xs mt-0.5">Datos de tu empresa para las cotizaciones</p>
        </div>
        <button
          onClick={save}
          className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          {saved ? <CheckCircle size={15} /> : <Save size={15} />}
          {saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Datos de la Empresa</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'name',    label: 'Nombre *',   ph: 'Mi Empresa SpA',          full: false },
              { key: 'rut',     label: 'RUT',        ph: '12.345.678-9',            full: false },
              { key: 'email',   label: 'Email',      ph: 'contacto@empresa.cl',     full: false, type: 'email' },
              { key: 'phone',   label: 'Teléfono',   ph: '+56 9 1234 5678',         full: false },
              { key: 'address', label: 'Dirección',  ph: 'Av. Principal 123, Santiago', full: true },
              { key: 'website', label: 'Sitio Web',  ph: 'www.miempresa.cl',        full: false },
            ].map(({ key, label, ph, full, type = 'text' }) => (
              <div key={key} className={full ? 'col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key] || ''}
                  onChange={set(key)}
                  placeholder={ph}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Valores por Defecto en Cotizaciones</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Moneda</label>
              <select value={form.currency} onChange={set('currency')}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {['CLP', 'USD', 'EUR', 'UF'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">IVA (%)</label>
              <input type="number" min="0" value={form.tax_percent || 0} onChange={set('tax_percent')}
                     className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Validez (días)</label>
              <input type="number" min="1" value={form.quote_valid_days || 30} onChange={set('quote_valid_days')}
                     className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Texto pie de página (PDF)</label>
            <textarea
              rows={2}
              value={form.footer_text || ''}
              onChange={set('footer_text')}
              placeholder="Gracias por su preferencia..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
