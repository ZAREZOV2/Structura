import { Link } from 'react-router-dom';
import { useSkladStats } from '../../features/sklad';
import { useActiveWorkspace } from '../../features/workspace';

export function SkladDashboard() {
  const { workspace } = useActiveWorkspace();
  const { data: stats, isLoading } = useSkladStats(workspace?.id ?? null);

  if (isLoading) {
    return <div className="text-neutral-500 dark:text-neutral-400">Загрузка...</div>;
  }

  if (!stats) {
    return <div className="text-neutral-500 dark:text-neutral-400">Нет данных</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Дашборд</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Товаров" value={stats.totalProducts} icon="📦" />
        <StatCard label="Общее кол-во" value={stats.totalQuantity} icon="🔢" />
        <StatCard label="Категорий" value={stats.totalCategories} icon="🏷️" />
        <StatCard
          label="Мало на складе"
          value={stats.lowStockCount}
          icon="⚠️"
          highlight={stats.lowStockCount > 0}
        />
      </div>

      {/* Low stock */}
      {stats.lowStockProducts.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            Заканчиваются
          </h3>
          <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-300">
                    Товар
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-neutral-600 dark:text-neutral-300">
                    Остаток
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-neutral-600 dark:text-neutral-300">
                    Мин.
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="px-4 py-2 text-neutral-900 dark:text-neutral-100">
                      <Link to={`/sklad/products/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-red-600 dark:text-red-400">
                      {p.quantity} {p.unit}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-neutral-500">
                      {p.minQuantity} {p.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent movements */}
      {stats.recentMovements.length > 0 && (
        <section>
          <h3 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            Последние операции
          </h3>
          <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-300">
                    Тип
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-neutral-600 dark:text-neutral-300">
                    Кол-во
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-300">
                    Заметка
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-neutral-600 dark:text-neutral-300">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentMovements.map((m) => (
                  <tr key={m.id} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="px-4 py-2">
                      <MovementBadge type={m.type} />
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-neutral-900 dark:text-neutral-100">
                      {m.quantity}
                    </td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                      {m.note || '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-neutral-500 dark:text-neutral-400">
                      {new Date(m.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
          : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span
          className={`text-2xl font-bold ${
            highlight ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'
          }`}
        >
          {value}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
    </div>
  );
}

function MovementBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    in: {
      label: 'Приход',
      cls: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    },
    out: { label: 'Расход', cls: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
    adjustment: {
      label: 'Коррекция',
      cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    },
  };
  const { label, cls } = map[type] ?? { label: type, cls: 'bg-neutral-100 text-neutral-700' };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}
