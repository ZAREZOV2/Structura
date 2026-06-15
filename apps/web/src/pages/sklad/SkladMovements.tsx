import { useSkladMovements, useSkladProducts } from '../../features/sklad';
import { useActiveWorkspace } from '../../features/workspace';

export function SkladMovements() {
  const { workspace } = useActiveWorkspace();
  const workspaceId = workspace?.id ?? null;

  const { data: movements, isLoading } = useSkladMovements(workspaceId);
  const { data: products } = useSkladProducts(workspaceId);

  if (isLoading) {
    return <div className="text-neutral-500">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        История операций
      </h2>

      {!movements?.length ? (
        <p className="text-neutral-500 dark:text-neutral-400">Операций пока нет.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-300">
                  Тип
                </th>
                <th className="px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-300">
                  Товар
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
              {movements.map((m) => {
                const product = products?.find((p) => p.id === m.productId);
                return (
                  <tr key={m.id} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="px-4 py-2">
                      <MovementBadge type={m.type} />
                    </td>
                    <td className="px-4 py-2 text-neutral-900 dark:text-neutral-100">
                      {product?.name || m.productId}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-neutral-900 dark:text-neutral-100">
                      {m.quantity}
                    </td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                      {m.note || '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-neutral-500 dark:text-neutral-400">
                      {new Date(m.createdAt).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
