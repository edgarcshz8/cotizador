import { Outlet, NavLink } from 'react-router-dom';
import { FileText, ClipboardList, Package, Settings } from 'lucide-react';

const NAV = [
  { to: '/',              icon: FileText,      label: 'Nueva Cotización', exact: true },
  { to: '/cotizaciones',  icon: ClipboardList, label: 'Historial' },
  { to: '/servicios',     icon: Package,       label: 'Servicios' },
  { to: '/configuracion', icon: Settings,      label: 'Configuración' },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-60 bg-blue-900 flex flex-col shadow-xl flex-shrink-0">
        <div className="px-5 py-5 border-b border-blue-800">
          <p className="text-white font-bold text-lg leading-tight">Cotizador</p>
          <p className="text-blue-300 text-xs mt-0.5">Servicios Informáticos</p>
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
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-blue-800">
          <p className="text-blue-400 text-xs">v1.0.0</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
