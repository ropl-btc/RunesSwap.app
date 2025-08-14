'use client';

import React, { Suspense, useState } from 'react';
import { AppInterface } from '@/components/AppInterface';
import { Loading } from '@/components/loading';
import TabNavigation, { ActiveTab } from '@/components/TabNavigation';
import styles from './page.module.css';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('swap');

  return (
    <div className={styles.mainContainer}>
      <TabNavigation onTabChange={setActiveTab} />
      <Suspense
        fallback={
          <Loading variant="progress" message="Loading application..." />
        }
      >
        <AppInterface activeTab={activeTab} />
      </Suspense>
    </div>
  );
}
