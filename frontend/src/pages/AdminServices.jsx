import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Check, X } from 'lucide-react';

const CATEGORIES = ['NFC', 'Wallet', 'Web', 'Software', 'Otro'];
const UNITS = ['unidad', 'hora', 'proyecto', 'tarjeta', 'mes', 'año', 'licencia'];

const EMPTY = { name: '', description: '', unit_price: '', unit_label: 'proyecto', category: 'Web', active: true };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await axios.get('/api/services/all');
    setServices(data);
  };

  const startNew = () => { setForm(EMPTY); setEditing('new'); };
  const startEdit = (s) => { setForm({ ...s }); setEditing(s.id); };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const save = async () => {
    if (!form.name.trim() || !form.unit_price) return;
    if (editing === 'new') {
      await axios.post('/api/services', form);
    } else {
      await axios.put(`/api/services/${editing}`, form);
    }
    cancel();
    load();
  };

  const toggleActive = async (s) => {
    await axios.put(`/api/services/${s.id}`, { ...s, active: !s.active });
    load();
  };

  const fmt = (n) => new Intl.NumberFormat('es-CL').format(Math.round(parseFloat(n) || 0));

  const field = (key, label, opts = {}) => (
    <div className={opts.full ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {opts.textarea ? (
        <textarea
          value={form[key] || ''}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          placeholder={opts.ph}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
      ) : opts.select ? (
        <select
          value={form[key] || ''}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {opts.options.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={opts.type || 'text'}
          value={form[key] || ''}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          placeholder={opts.ph}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      )}
    </div>
  );

  const catColor = {
    NFC:      'bg-violet-100 text-violet-700',
    Wallet:   'bg-sky-100 text-sky-700',
    Web:      'bg-orange-100 text-orange-700',
    Software: 'bg-gray-100 text-gray-700',
    Otro:     'bg-gray-100 text-gray-600',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Gestión de Servicios</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            {services.filter(s => s.active).length} activos · {services.filter(s => !s.active).length} inactivos
          </p>
        </div>
        {editing !== 'new' && (
          <button
            onClick={startNew}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Nuevo Servicio
          </button>
        )}
      </div>

      {/* Form */}
      {editing && (
        <div className="bg-white border-2 border-orange-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            {editing === 'new' ? 'Nuevo Servicio' : 'Editar Servicio'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {field('name',        'Nombre *',    { full: true, ph: 'Ej: Página Web Corporativa' })}
            {field('description', 'Descripción', { full: true, textarea: true, ph: 'Descripción del servicio...' })}
            {field('unit_price',  'Precio *',    { type: 'number', ph: '0' })}
            {field('unit_label',  'Unidad',      { select: true, options: UNITS })}
            {field('category',    'Categoría',   { select: true, options: CATEGORIES })}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save}
                    className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <Check size={14} /> Guardar
            </button>
            <button onClick={cancel}
                    className="flex items-center gap-1.5 border px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              <X size={14} /> Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Servicio', 'Categoría', 'Precio', 'Estado', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {services.map(s => (
              <tr key={s.id} className={`hover:bg-gray-50 ${!s.active ? 'opacity-50' : ''}`}>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-800">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{s.description}</p>
                  )}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor[s.category] || catColor['Otro']}`}>
                    {s.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm font-medium text-gray-700">
                  {fmt(s.unit_price)} <span className="text-gray-400 font-normal text-xs">/ {s.unit_label}</span>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActive(s)}
                    className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                      s.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {s.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => startEdit(s)}
                    className="p-1.5 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-500 transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                Sin servicios registrados
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
