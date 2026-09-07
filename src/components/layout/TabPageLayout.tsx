import { Suspense } from 'react';

import styles from '@/app/page.module.css';
import { AppInterface } from '@/components/layout/AppInterface';
import type { ActiveTab } from '@/components/layout/TabNavigation';
import TabNavigation from '@/components/layout/TabNavigation';
import { Loading } from '@/components/loading/Loading';

interface TabPageLayoutProps {
  activeTab: ActiveTab;
  preSelectedRune?: string | null;
}

const loadingMessages: Record<ActiveTab, string> = {
  swap: 'Loading swap interface...',
  borrow: 'Loading borrow tab...',
  runesInfo: 'Loading runes info...',
  yourTxs: 'Loading transactions...',
  portfolio: 'Loading portfolio...',
};

export default function TabPageLayout({ activeTab, preSelectedRune = null }: TabPageLayoutProps) {
  return (
    <div className={styles.mainContainer}>
      <TabNavigation />
      <Suspense fallback={<Loading variant="progress" message={loadingMessages[activeTab]} />}>
        <AppInterface activeTab={activeTab} preSelectedRune={preSelectedRune} />
      </Suspense>
    </div>
  );
}
