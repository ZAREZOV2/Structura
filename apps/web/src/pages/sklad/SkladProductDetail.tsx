import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useSkladCategories,
  useSkladMovementMutations,
  useSkladMovements,
  useSkladProduct,
  useSkladProductMutations,
} from '../../features/sklad';
import { useActiveWorkspace } from '../../features/workspace';

export function SkladProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { workspace } = useActiveWorkspace();
  const workspaceId = workspace?.id ?? null;

  const { data: product, isLoading } = useSkladProduct(id ?? null);
  const { data: movements } = useSkladMovements(workspaceId, { productId: id });
  const { data: categories } = useSkladCategories(workspaceId);
  const productMutations = useSkladProductMutations(workspaceId);
  const movementMutations = useSkladMovementMutations(workspaceId);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit: '',
    minQuantity: 0,
    categoryId: '',
    description: '',
  });

  const [movForm, setMovForm] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    note: '',
  });

  function startEditing() {
    if (!product) return;
    setForm({
      name: product.name,
      sku: product.sku || '',
      unit: product.unit,
      minQuantity: product.minQuantity,
      categoryId: product.categoryId || '',
      description: product.description || '',
    });
    setEditing(true);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    productMutations.update.mutate(
      {
        id,
        name: form.name,
        sku: form.sku || null,
        unit: form.unit,
        minQuantity: form.minQuantity,
        categoryId: form.categoryId || null,
        description: form.description || null,
      },
      { onSuccess: () => setEditing(false) },
    );
  }

  function handleMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    movementMutations.create.mutate(
      {
        productId: id,
        type: movForm.type,
        quantity: movForm.quantity,
        note: movForm.note || null,
      },
      { onSuccess: () => setMovForm({ type: 'in', quantity: 0, note: '' }) },
    );
  }

  if (isLoading) {
    return <div className="text-neutral-500">Загрузка...</div>;
  }

  if (!product) {
    return <div className="text-neutral-500">Товар не найден</div>;
  }

  const cat = categories?.find((c) => c.id === product.categoryId);
  const isLow = product.quantity <= product.minQuantity;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/sklad/products"
          className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Товары
        </Link>
      </div>

      {/* Product info */}
      {editing ? (
        <form
          onSubmit={handleSave}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              placeholder="Название"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              placeholder="Артикул"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              placeholder="Единица"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              type="number"
              placeholder="Мин. количество"
              value={form.minQuantity}
              onChange={(e) => setForm({ ...form, minQuantity: Number(e.target.value) })}
              min={0}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="">Без категории</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Описание"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="col-span-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              rows={2}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700 dark:text-neutral-300"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {product.name}
              </h2>
              {product.sku && <p className="text-sm text-neutral-500">SKU: {product.sku}</p>}
            </div>
            <button
              type="button"
              onClick={startEditing}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Редактировать
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Остаток</p>
              <p
                className={`text-lg font-bold ${isLow ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}
              >
                {product.quantity} {product.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Мин. остаток</p>
              <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {product.minQuantity} {product.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Категория</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{cat?.name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Единица</p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{product.unit}</p>
            </div>
          </div>
          {product.description && (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              {product.description}
            </p>
          )}
        </div>
      )}

      {/* Movement form */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Новая операция
        </h3>
        <form onSubmit={handleMovement} className="flex flex-wrap items-end gap-3">
          <select
            value={movForm.type}
            onChange={(e) =>
              setMovForm({ ...movForm, type: e.target.value as 'in' | 'out' | 'adjustment' })
            }
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          >
            <option value="in">Приход</option>
            <option value="out">Расход</option>
            <option value="adjustment">Коррекция</option>
          </select>
          <input
            type="number"
            placeholder="Кол-во"
            value={movForm.quantity || ''}
            onChange={(e) => setMovForm({ ...movForm, quantity: Number(e.target.value) })}
            min={0}
            required
            className="w-24 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <input
            placeholder="Заметка"
            value={movForm.note}
            onChange={(e) => setMovForm({ ...movForm, note: e.target.value })}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <button
            type="submit"
            disabled={movementMutations.create.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Провести
          </button>
        </form>
      </div>

      {/* Movement history */}
      {movements && movements.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            История операций
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
                {movements.map((m) => (
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
                      {new Date(m.createdAt).toLocaleString('ru-RU')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
