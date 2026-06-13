import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data, error } = await api.health.get();
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
        <span className="font-semibold">Structura</span>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-500">{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-100"
          >
            Log out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-semibold">Welcome, {user?.displayName}</h1>
        <p className="mt-1 text-sm text-neutral-500">
          You are signed in. Workspaces and pages are coming next.
        </p>

        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">API status</p>
          <p className="mt-1">
            Status: <span className="font-medium text-green-600">{health?.status ?? '…'}</span>
            {health && (
              <>
                {' '}
                · Database: <span className="font-medium">{health.database}</span>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  );
}
