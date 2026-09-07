import { createFileRoute } from '@tanstack/react-router';
import TabPageLayout from '@/components/layout/TabPageLayout';

export const Route = createFileRoute('/portfolio')({
  component: () => <TabPageLayout activeTab="portfolio" />,
});
