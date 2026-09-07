import type { ErrorComponentProps } from '@tanstack/react-router';

import { useEffect } from 'react';

import styles from '@/app/page.module.css';
import Button from '@/components/ui/Button';
import { logger } from '@/lib/logger';

export default function RouteError({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    logger.error(
      'Unhandled route error',
      error instanceof Error ? { message: error.message, stack: error.stack } : { error },
      'APP',
    );
  }, [error]);

  return (
    <div className={styles.container}>
      <h1 className="heading">Something went wrong</h1>
      <p>Please try again. If the problem persists, reload the page.</p>
      <Button onClick={reset}>Try Again</Button>
    </div>
  );
}
