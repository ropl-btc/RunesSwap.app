'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useRef, useState } from 'react';

import FooterComponent from '@/components/layout/FooterComponent';
import styles from '@/components/layout/Layout.module.css';
import TitleText from '@/components/ui/TitleText';
import { useBackground } from '@/context/BackgroundContext';
import useBtcPrice from '@/hooks/useBtcPrice';

/**
 * Props for the Layout component.
 */
interface LayoutProps {
  /** Child components to render within the layout. */
  children: React.ReactNode;
}

/**
 * Main layout component for the application.
 * Wraps content in a window-like container and handles background image settings.
 * Includes the title bar and footer.
 *
 * @param props - Component props.
 */
export function Layout({ children }: LayoutProps) {
  const { backgroundImage, setBackgroundImage, clearBackgroundImage } =
    useBackground();
  const { btcPriceUsd, isBtcPriceLoading, btcPriceError } = useBtcPrice();

  // Background settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Image is too large. Please select an image under 2MB.');
      return;
    }

    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBackgroundImage(event.target.result as string);
        setIsSettingsOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={styles.container}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {}
      }
    >
      {/* Background settings */}
      <button
        className={styles.bgSettingsButton}
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        title="Change Background"
      >
        Choose Background
      </button>

      {isSettingsOpen && (
        <div className={styles.bgSettingsPanel}>
          <div className={styles.bgSettingsContent}>
            <button
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Image
            </button>

            {backgroundImage && (
              <button
                className={styles.clearButton}
                onClick={clearBackgroundImage}
              >
                Clear Background
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {uploadError && <p className={styles.errorText}>{uploadError}</p>}
          </div>
        </div>
      )}

      {/* Main window */}
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <span className={styles.titleBarRow}>
            <Link href="/?tab=swap" aria-label="Go to Swap tab">
              <Image
                src="/icons/runesswap_logo.png"
                alt="RunesSwap.app Logo"
                width={18}
                height={18}
                style={{
                  imageRendering: 'pixelated',
                  cursor: 'pointer',
                }}
                priority
              />
            </Link>
            <TitleText />
          </span>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
      <FooterComponent
        btcPriceUsd={btcPriceUsd}
        isBtcPriceLoading={isBtcPriceLoading}
        btcPriceError={btcPriceError}
      />
    </div>
  );
}

export default Layout;
