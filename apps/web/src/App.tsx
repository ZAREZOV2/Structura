import { useQuery } from '@tanstack/react-query';
import { api } from './lib/api';

export function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data, error } = await api.health.get();
      if (error) throw error;
      return data;
    },
    refetchInterval: 10_000,
  });

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Structura</h1>
        <p className="mt-1 text-sm text-neutral-500">Bun + ElysiaJS + PostgreSQL</p>

        <div className="mt-6 rounded-lg bg-neutral-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">API status</p>
          {isLoading && <p className="mt-1 text-sm">Checking…</p>}
          {isError && <p className="mt-1 text-sm text-red-600">API unreachable</p>}
          {data && (
            <div className="mt-1 space-y-1 text-sm">
              <p>
                Status: <span className="font-medium text-green-600">{data.status}</span>
              </p>
              <p>
                Database: <span className="font-medium">{data.database}</span>
              </p>
              <p className="text-neutral-500">Uptime: {Math.round(data.uptime)}s</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
