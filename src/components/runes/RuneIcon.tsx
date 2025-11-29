import Image from 'next/image';
import React from 'react';

/**
 * Props for the RuneIcon component.
 */
interface RuneIconProps {
  /** The source URL of the icon. */
  src: string | null | undefined;
  /** Alt text for the image. */
  alt: string;
  /** Additional CSS class name. */
  className: string | undefined;
  /** Width of the icon. */
  width: number | undefined;
  /** Height of the icon. */
  height: number | undefined;
}

/**
 * Component to display a Rune's icon.
 * Handles invalid URLs and loading errors gracefully.
 *
 * @param props - Component props.
 */
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
