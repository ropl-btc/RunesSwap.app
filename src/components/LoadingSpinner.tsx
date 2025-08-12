import React from 'react';

interface LoadingSpinnerProps {
  /**
   * Loading message to display
   * @default "Loading..."
   */
  message?: string;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Whether to show animated dots
   * @default false
   */
  showDots?: boolean;
}

/**
 * Reusable loading component with consistent styling
 */
export function LoadingSpinner({
  message = 'Loading...',
  className,
  showDots = false,
}: LoadingSpinnerProps) {
  const [dots, setDots] = React.useState('');

  React.useEffect(() => {
    if (!showDots) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [showDots]);

  return (
    <span className={className}>
      {message}
      {showDots ? dots : ''}
    </span>
  );
}

/**
 * Loading component specifically for rune amount formatting
 */
export function LoadingRuneAmount({ rawAmount }: { rawAmount: string }) {
  return <span>{rawAmount} (Loading decimals...)</span>;
}

/**
 * Loading component for balance display
 */
export function LoadingBalance() {
  return <LoadingSpinner message="Loading" showDots className="loadingText" />;
}
