import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Check, X, Trash2 } from 'lucide-react';

const CATEGORIES = ['NFC', 'Wallet', 'Web', 'Software', 'Otro'];
const UNITS = ['unidad', 'hora', 'proyecto', 'tarjeta', 'mes', 'año', 'licencia'];

const BILLING_TYPES = [
  { value: 'unico',   label: 'Único',   color: 'blue' },
  { value: 'mensual', label: 'Mensual', color: 'emerald' },
  { value: 'anual',   label: 'Anual',   color: 'amber' },
];

const BILLING_STYLE = {
  unico:   'bg-blue-100 text-blue-700 border-blue-300',
  mensual: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  anual:   'bg-amber-100 text-amber-700 border-amber-300',
};

const EMPTY_COMP = { name: '', unit_price: '', billing_type: 'unico', taxable: true };
const EMPTY = {
  name: '', description: '', unit_price: '', unit_label: 'proyecto',
  category: 'Web', billing_type: 'unico', active: true, components: [],
};

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await axios.get('/api/services/all');
    setServices(data);
  };

  const startNew  = () => { setForm(EMPTY); setEditing('new'); };
  const startEdit = (s) => {
    setForm({
      ...s,
      components: Array.isArray(s.components) ? s.components : [],
    });
    setEditing(s.id);
  };
  const cancel = () => { setEditing(null); setForm(EMPTY); };

  const addComp    = () => setForm(p => ({ ...p, components: [...p.components, { ...EMPTY_COMP }] }));
  const removeComp = (i) => setForm(p => ({ ...p, components: p.components.filter((_, idx) => idx !== i) }));
  const updateComp = (i, key, val) => setForm(p => ({
    ...p,
    components: p.components.map((c, idx) => idx === i ? { ...c, [key]: val } : c),
  }));

  const save = async () => {
    if (!form.name.trim()) return;
    if (form.components.length === 0 && !form.unit_price) return;
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
        <div className="bg-white border-2 border-orange-200 rounded-xl p-5 mb-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700">
            {editing === 'new' ? 'Nuevo Servicio' : 'Editar Servicio'}
          </p>

          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Software Menú Dinámico"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
              <textarea
                value={form.description || ''}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Descripción del servicio..."
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {CATEGORIES.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Unidad</label>
              <select
                value={form.unit_label}
                onChange={e => setForm(p => ({ ...p, unit_label: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {UNITS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {/* Components section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Componentes de precio
              </label>
              <button
                type="button"
                onClick={addComp}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 font-medium"
              >
                <Plus size={12} /> Agregar componente
              </button>
            </div>

            {form.components.length > 0 ? (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-12 text-xs font-medium text-gray-400 px-1">
                  <span className="col-span-4">Nombre</span>
                  <span className="col-span-3">Precio</span>
                  <span className="col-span-3">Tipo</span>
                  <span className="col-span-1 text-center">IVA</span>
                  <span className="col-span-1" />
                </div>
                {form.components.map((comp, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg px-2 py-2">
                    <div className="col-span-4">
                      <input
                        value={comp.name}
                        onChange={e => updateComp(i, 'name', e.target.value)}
                        placeholder="Ej: Dominio"
                        className="w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={comp.unit_price}
                        onChange={e => updateComp(i, 'unit_price', e.target.value)}
                        placeholder="0"
                        className="w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      />
                    </div>
                    <div className="col-span-3 flex gap-1">
                      {BILLING_TYPES.map(bt => (
                        <button
                          key={bt.value}
                          type="button"
                          onClick={() => updateComp(i, 'billing_type', bt.value)}
                          className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-colors ${
                            comp.billing_type === bt.value
                              ? BILLING_STYLE[bt.value]
                              : 'border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {bt.label}
                        </button>
                      ))}
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={comp.taxable !== false}
                        onChange={e => updateComp(i, 'taxable', e.target.checked)}
                        title="Afecto a IVA"
                        className="w-4 h-4 accent-orange-600 cursor-pointer"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeComp(i)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Legacy: single price when no components */
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="col-span-2 text-xs text-gray-400">
                  Sin componentes — ingresa un precio único para el servicio:
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Precio *</label>
                  <input
                    type="number"
                    value={form.unit_price}
                    onChange={e => setForm(p => ({ ...p, unit_price: e.target.value }))}
                    placeholder="0"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de cobro</label>
                  <select
                    value={form.billing_type}
                    onChange={e => setForm(p => ({ ...p, billing_type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    {BILLING_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
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
            {services.map(s => {
              const comps = Array.isArray(s.components) ? s.components : [];
              return (
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
                  <td className="px-5 py-3">
                    {comps.length > 0 ? (
                      <div className="space-y-0.5">
                        {comps.map((c, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <span className="text-gray-600">{c.name}:</span>
                            <span className="font-semibold text-gray-800">{fmt(c.unit_price)}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${BILLING_STYLE[c.billing_type] || BILLING_STYLE.unico}`}>
                              {c.billing_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-700">
                        {fmt(s.unit_price)}
                        <span className="text-gray-400 font-normal text-xs"> / {s.unit_label}</span>
                      </span>
                    )}
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
              );
            })}
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
