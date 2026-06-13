import type { ReactNode } from 'react';

export function AuthCard({
  title,
  subtitle,
  children,
}: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

export function TextField({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  required = true,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        type={type}
        value={value}
        autoComplete={autoComplete}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
