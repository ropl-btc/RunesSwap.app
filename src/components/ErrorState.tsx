interface ErrorStateProps {
  message?: string;
  error?: Error | null;
  className?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'An error occurred',
  error,
  className = 'errorText',
  onRetry,
}: ErrorStateProps) {
  const displayMessage = error?.message || message;

  return (
    <div className={className}>
      <div>{displayMessage}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 8,
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid #666',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
