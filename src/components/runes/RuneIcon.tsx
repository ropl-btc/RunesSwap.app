import Image from 'next/image';
import React from 'react';

interface RuneIconProps {
  src: string | null | undefined;
  alt: string;
  className: string | undefined;
  width: number | undefined;
  height: number | undefined;
}

export const RuneIcon: React.FC<RuneIconProps> = ({
  src,
  alt,
  className,
  width = 24,
  height = 24,
}) => {
  if (!src || typeof src !== 'string') return null;
  const isValid =
    src.startsWith('http') || src.startsWith('/') || src.startsWith('data:');
  if (!isValid) return null;

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target) target.style.display = 'none';
      }}
    />
  );
};

export default RuneIcon;
