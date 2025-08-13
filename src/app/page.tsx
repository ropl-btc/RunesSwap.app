'use client';

import React, { Suspense, useState } from 'react';
import { AppInterface } from '@/components/AppInterface';
import { LoadingState } from '@/components/LoadingState';
import TabNavigation, { ActiveTab } from '@/components/TabNavigation';
import styles from './page.module.css';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('swap');

  return (
    <div className={styles.mainContainer}>
      <TabNavigation onTabChange={setActiveTab} />
      <Suspense fallback={<LoadingState message="Loading application..." />}>
        <AppInterface activeTab={activeTab} />
      </Suspense>
    </div>
  );
}
