import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Check, X, Search } from 'lucide-react';

const EMPTY = { rut: '', name: '', company: '', email: '', phone: '', address: '' };

export default function AdminClients() {
  const [clients, setClients]   = useState([]);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [search, setSearch]     = useState('');
  const [error, setError]       = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await axios.get('/api/clients');
    setClients(data);
  };

  const startNew  = () => { setForm(EMPTY); setError(''); setEditing('new'); };
  const startEdit = (c) => { setForm({ ...c }); setError(''); setEditing(c.id); };
  const cancel    = () => { setEditing(null); setForm(EMPTY); setError(''); };

  const save = async () => {
    setError('');
    try {
      if (editing === 'new') {
        await axios.post('/api/clients', form);
      } else {
        await axios.put(`/api/clients/${editing}`, form);
      }
      cancel();
      load();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al guardar');
    }
  };

  const remove = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    await axios.delete(`/api/clients/${id}`);
    load();
  };

  const visible = clients.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.rut.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase())
  );

  const field = (key, label, opts = {}) => (
    <div className={opts.full ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={opts.type || 'text'}
        value={form[key] || ''}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={opts.ph}
        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-400 text-xs mt-0.5">{clients.length} clientes registrados</p>
        </div>
        {editing !== 'new' && (
          <button
            onClick={startNew}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Nuevo Cliente
          </button>
        )}
      </div>

      {/* Formulario */}
      {editing && (
        <div className="bg-white border-2 border-orange-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">
            {editing === 'new' ? 'Nuevo Cliente' : 'Editar Cliente'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {field('rut',     'RUT *',      { ph: '12.345.678-9' })}
            {field('name',    'Nombre *',   { ph: 'Juan Pérez' })}
            {field('company', 'Empresa',    { ph: 'Empresa SpA' })}
            {field('email',   'Email',      { ph: 'juan@empresa.cl', type: 'email' })}
            {field('phone',   'Teléfono',   { ph: '+56 9 1234 5678' })}
            {field('address', 'Dirección',  { ph: 'Av. Principal 123, Santiago', full: true })}
          </div>
          {error && (
            <p className="mt-3 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
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

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, RUT o empresa..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['RUT', 'Nombre', 'Empresa', 'Email', 'Teléfono', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {visible.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-mono text-xs font-semibold text-orange-600">{c.rut}</td>
                <td className="px-5 py-3 font-medium text-gray-800">{c.name}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{c.company || '—'}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{c.email || '—'}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{c.phone || '—'}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    <button onClick={() => startEdit(c)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-700 text-gray-500 transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => remove(c.id)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                {search ? 'Sin resultados para esa búsqueda' : 'Sin clientes registrados'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
