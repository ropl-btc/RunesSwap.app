import { createFileRoute } from '@tanstack/react-router';
import TabPageLayout from '@/components/layout/TabPageLayout';

export const Route = createFileRoute('/swap')({
  validateSearch: (search: Record<string, unknown>): { rune?: string } => {
    const rune = Array.isArray(search.rune) ? search.rune[0] : search.rune;
    return typeof rune === 'string' ? { rune } : {};
  },
  component: SwapPage,
});

function SwapPage() {
  const { rune } = Route.useSearch();
  return <TabPageLayout activeTab="swap" preSelectedRune={rune ?? null} />;
}
