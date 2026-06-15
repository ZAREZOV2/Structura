import { useState } from 'react';
import { useSkladCategories, useSkladCategoryMutations } from '../../features/sklad';
import { useActiveWorkspace } from '../../features/workspace';

export function SkladCategories() {
  const { workspace } = useActiveWorkspace();
  const workspaceId = workspace?.id ?? null;

  const { data: categories, isLoading } = useSkladCategories(workspaceId);
  const mutations = useSkladCategoryMutations(workspaceId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', color: '#6366f1' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', color: '' });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    mutations.create.mutate(
      { name: form.name, color: form.color },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ name: '', color: '#6366f1' });
        },
      },
    );
  }

  function startEdit(cat: { id: string; name: string; color: string }) {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, color: cat.color });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    mutations.update.mutate(
      { id: editingId, name: editForm.name, color: editForm.color },
      { onSuccess: () => setEditingId(null) },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Категории</h2>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Новая категория
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="flex items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <input
            placeholder="Название"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="h-9 w-9 cursor-pointer rounded-lg border border-neutral-300 dark:border-neutral-700"
          />
          <button
            type="submit"
            disabled={mutations.create.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Создать
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700 dark:text-neutral-300"
          >
            Отмена
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-neutral-500">Загрузка...</p>
      ) : !categories?.length ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          Категорий пока нет. Создайте первую!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) =>
            editingId === cat.id ? (
              <form
                key={cat.id}
                onSubmit={handleUpdate}
                className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-white p-3 dark:border-indigo-700 dark:bg-neutral-900"
              >
                <input
                  type="color"
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border border-neutral-300 dark:border-neutral-700"
                />
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="flex-1 rounded-lg border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                />
                <button
                  type="submit"
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-neutral-500 hover:underline"
                >
                  Отмена
                </button>
              </form>
            ) : (
              <div
                key={cat.id}
                className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {cat.name}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(cat)}
                  className="hidden text-xs text-neutral-500 hover:text-neutral-700 group-hover:inline dark:hover:text-neutral-300"
                >
                  ✎
                </button>
                <button
                  type="button"
                  onClick={() => mutations.remove.mutate(cat.id)}
                  className="hidden text-xs text-red-500 hover:text-red-700 group-hover:inline dark:text-red-400"
                >
                  ×
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
