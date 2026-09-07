import { createFileRoute } from '@tanstack/react-router';
import TabPageLayout from '@/components/layout/TabPageLayout';

export const Route = createFileRoute('/your-txs')({
  component: () => <TabPageLayout activeTab="yourTxs" />,
});
