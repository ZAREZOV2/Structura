import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useSkladCategories,
  useSkladProductMutations,
  useSkladProducts,
} from '../../features/sklad';
import { useActiveWorkspace } from '../../features/workspace';

export function SkladProducts() {
  const { workspace } = useActiveWorkspace();
  const workspaceId = workspace?.id ?? null;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: products, isLoading } = useSkladProducts(workspaceId, {
    categoryId: categoryFilter || undefined,
    search: search || undefined,
  });
  const { data: categories } = useSkladCategories(workspaceId);
  const mutations = useSkladProductMutations(workspaceId);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    unit: 'шт',
    quantity: 0,
    minQuantity: 0,
    categoryId: '',
    description: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutations.create.mutate(
      {
        name: form.name,
        sku: form.sku || null,
        unit: form.unit,
        quantity: form.quantity,
        minQuantity: form.minQuantity,
        categoryId: form.categoryId || null,
        description: form.description || null,
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({
            name: '',
            sku: '',
            unit: 'шт',
            quantity: 0,
            minQuantity: 0,
            categoryId: '',
            description: '',
          });
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Товары</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Добавить товар
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              placeholder="Название *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              placeholder="Артикул (SKU)"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              placeholder="Единица (шт, кг...)"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <input
              type="number"
              placeholder="Количество"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              min={0}
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
              disabled={mutations.create.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutations.create.isPending ? 'Сохранение...' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700 dark:text-neutral-300"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Поиск по названию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        >
          <option value="">Все категории</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-neutral-500">Загрузка...</p>
      ) : !products?.length ? (
        <p className="text-neutral-500 dark:text-neutral-400">Товаров пока нет. Добавьте первый!</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-300">
                  Название
                </th>
                <th className="px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-300">
                  Артикул
                </th>
                <th className="px-4 py-2 text-right font-medium text-neutral-600 dark:text-neutral-300">
                  Остаток
                </th>
                <th className="px-4 py-2 text-left font-medium text-neutral-600 dark:text-neutral-300">
                  Категория
                </th>
                <th className="px-4 py-2 text-right font-medium text-neutral-600 dark:text-neutral-300">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const cat = categories?.find((c) => c.id === p.categoryId);
                const isLow = p.quantity <= p.minQuantity;
                return (
                  <tr
                    key={p.id}
                    className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <td className="px-4 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                      <Link to={`/sklad/products/${p.id}`} className="hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-neutral-500 dark:text-neutral-400">
                      {p.sku || '—'}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-mono ${isLow ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}
                    >
                      {p.quantity} {p.unit}
                    </td>
                    <td className="px-4 py-2">
                      {cat ? (
                        <span
                          className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.name}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => mutations.remove.mutate(p.id)}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Удалить
                      </button>
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
