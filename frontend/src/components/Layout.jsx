import { Outlet, NavLink } from 'react-router-dom';
import { FileText, ClipboardList, Package, Settings, LogOut, Users } from 'lucide-react';

const NAV = [
  { to: '/',              icon: FileText,      label: 'Nueva Cotización', exact: true },
  { to: '/cotizaciones',  icon: ClipboardList, label: 'Historial' },
  { to: '/clientes',      icon: Users,         label: 'Clientes' },
  { to: '/servicios',     icon: Package,       label: 'Servicios' },
  { to: '/configuracion', icon: Settings,      label: 'Configuración' },
];

export default function Layout({ onLogout }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-gray-950 flex flex-col shadow-xl flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-800">
          <p className="text-white font-bold text-lg leading-tight">Cotizador</p>
          <p className="text-orange-400 text-xs mt-0.5">Servicios Informáticos</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-800 space-y-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
          <p className="text-gray-600 text-xs px-3">v1.0.0</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
