import { type ThemePreference, useTheme } from '../theme/ThemeContext';

const ORDER: ThemePreference[] = ['light', 'dark', 'system'];
const LABEL: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};
const ICON: Record<ThemePreference, string> = {
  light: '☀',
  dark: '☾',
  system: '🖥',
};

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  function cycle() {
    const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length] ?? 'system';
    setPreference(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Theme: ${LABEL[preference]} (click to change)`}
      aria-label={`Theme: ${LABEL[preference]}`}
      className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1.5 font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      <span aria-hidden>{ICON[preference]}</span>
      <span>{LABEL[preference]}</span>
    </button>
  );
}
