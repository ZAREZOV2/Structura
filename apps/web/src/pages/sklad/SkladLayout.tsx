import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';

const navItems = [
  { to: '/sklad', label: 'Дашборд', icon: '📊' },
  { to: '/sklad/products', label: 'Товары', icon: '📦' },
  { to: '/sklad/categories', label: 'Категории', icon: '🏷️' },
  { to: '/sklad/movements', label: 'История', icon: '📋' },
];

export function SkladLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
          <span className="text-xl">🏭</span>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Sklad</h1>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/sklad'}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
              {user?.email}
            </span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
