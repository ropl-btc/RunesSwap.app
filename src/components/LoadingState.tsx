interface LoadingStateProps {
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingState({
  message = 'Loading...',
  progress,
  className = '',
}: LoadingStateProps) {
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
}
