'use client';

import React, { Suspense, useState } from 'react';

import styles from '@/app/page.module.css';
import { AppInterface } from '@/components/layout/AppInterface';
import type { ActiveTab } from '@/components/layout/TabNavigation';
import TabNavigation from '@/components/layout/TabNavigation';
import { Loading } from '@/components/loading';

/**
 * Renders the main application layout and manages the currently active tab.
 *
 * @returns The page's JSX element containing tab navigation and the application interface, with a Suspense fallback that displays a loading indicator.
 */
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