'use client';

import React from 'react';

export type LoadingVariant =
  | 'spinner'
  | 'dots'
  | 'progress'
  | 'rune-amount'
  | 'balance';

export interface LoadingProps {
  /**
   * Variant of the loading component to render
   */
  variant?: LoadingVariant;
  /**
   * Loading message to display
   * @default "Loading..."
   */
  message?: string;
  /**
   * Additional CSS class name
   */
  className?: string | undefined;
  /**
   * Progress value (0-1) for progress variant
   */
  progress?: number | undefined;
  /**
   * Raw amount for rune-amount variant
   */
  rawAmount?: string;
  /**
   * Whether to show animated dots (for dots variant or spinner with showDots)
   * @default false for spinner, true for dots variant
   */
  showDots?: boolean;
}

/**
 * Loading component that handles all loading states
 */
export function Loading({
  variant = 'spinner',
  message = 'Loading...',
  className,
  progress,
  rawAmount,
  showDots,
}: LoadingProps) {
  const [dots, setDots] = React.useState('');

  // Determine if we should show dots based on variant and showDots prop
  const shouldShowDots =
    variant === 'dots' ||
    ((variant === 'spinner' || variant === 'balance') && !!showDots);

  React.useEffect(() => {
    if (!shouldShowDots) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [shouldShowDots]);

  switch (variant) {
    case 'progress':
      return (
        <div className={className}>
          {progress !== undefined ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                role="progressbar"
                style={{
                  width: '100%',
                  height: 20,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    height: '100%',
                    backgroundColor: '#007acc',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div>{message}</div>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>{message}</div>
          )}
        </div>
      );

    case 'rune-amount':
      return (
        <span className={className}>
          {rawAmount || ''} (Loading decimals...)
        </span>
      );

    case 'balance':
      return (
        <span className={className || 'loadingText'}>
          {message || 'Loading'}
          {shouldShowDots ? dots : ''}
        </span>
      );

    case 'dots':
    case 'spinner':
    default:
      return (
        <span className={className}>
          {message}
          {shouldShowDots ? dots : ''}
        </span>
      );
  }
}
