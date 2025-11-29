/**
 * Props for the ErrorState component.
 */
interface ErrorStateProps {
  /** The error message to display. */
  message?: string;
  /** The error object, if available. */
  error?: Error | null;
  /** Additional CSS class name. */
  className?: string;
  /** Callback function to retry the operation. */
  onRetry?: () => void;
}

/**
 * Component to display an error message with an optional retry button.
 *
 * @param props - Component props.
 */
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
