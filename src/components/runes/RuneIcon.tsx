interface RuneIconProps {
  src: string | null | undefined;
  alt: string;
  className: string | undefined;
  width: number | undefined;
  height: number | undefined;
}

export default function RuneIcon({ src, alt, className, width = 24, height = 24 }: RuneIconProps) {
  if (!src || typeof src !== 'string') return null;
  const isValid = src.startsWith('http') || src.startsWith('/') || src.startsWith('data:');
  if (!isValid) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  );
}
