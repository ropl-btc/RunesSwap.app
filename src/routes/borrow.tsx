import { createFileRoute } from '@tanstack/react-router';
import TabPageLayout from '@/components/layout/TabPageLayout';

export const Route = createFileRoute('/borrow')({
  component: () => <TabPageLayout activeTab="borrow" />,
});
