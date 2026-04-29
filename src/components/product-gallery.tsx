'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useMemo, useEffect } from 'react';

type ProductGalleryProps = {
  heroImage: string;
  galleryImages: string[];
  productName: string;
};

const ProductLightbox = dynamic(
  () => import('@/components/product-lightbox').then((mod) => mod.ProductLightbox),
  { ssr: false }
);

export function ProductGallery({
  heroImage,
  galleryImages,
  productName,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const allImages = useMemo(() => {
    const input = [heroImage, ...galleryImages].filter(Boolean);
    return Array.from(new Set(input));
  }, [heroImage, galleryImages]);

  const currentImage = allImages[activeIndex] || heroImage;

  const handleThumbnailClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleImageTap = useCallback(() => {
    setShowLightbox(true);
    document.body.style.overflow = 'hidden';
  }, []);

  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleLightboxClose = useCallback(() => {
    setShowLightbox(false);
    document.body.style.overflow = 'auto';
  }, []);

  const handlePrevImage = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);

  const handleNextImage = useCallback(() => {
    setActiveIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) {
      return;
    }

    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }

    setTouchStartX(null);
  }, [touchStartX, handleNextImage, handlePrevImage]);

  return (
    <>
      <div className="product-gallery-container">
        <div
          className="product-gallery-main"
          onClick={handleImageTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleImageTap();
          }}
          style={{
            cursor: 'pointer',
            overflow: 'hidden',
            borderRadius: 12,
            marginBottom: 'var(--space-4)',
            touchAction: 'pan-y',
          }}
        >
          <img
            src={`/${currentImage}`}
            alt={productName}
            style={{
              width: '100%',
              maxWidth: '100%',
              borderRadius: 12,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>

        {allImages.length > 1 && (
          <div className="product-gallery-thumbnails">
            {allImages.map((img, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                className="gallery-thumbnail"
                style={{
                  flex: '0 0 104px',
                  width: 104,
                  height: 84,
                  padding: 0,
                  border:
                    activeIndex === idx
                      ? '3px solid var(--color-primary-700)'
                      : '1px solid var(--color-neutral-300)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-white)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <img
                  src={`/${img}`}
                  alt={`${productName} ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </button>
            ))}
          </div>
        )}

        {allImages.length > 1 && (
          <div className="product-gallery-dots">
            {allImages.map((_, idx) => (
              <button
                type="button"
                key={idx}
                style={{
                  width: activeIndex === idx ? 12 : 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor:
                    activeIndex === idx
                      ? 'var(--color-primary-700)'
                      : 'var(--color-neutral-300)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  border: 'none',
                  padding: 0,
                }}
                onClick={() => handleThumbnailClick(idx)}
                aria-label={`Ver imagen ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {showLightbox && (
        <ProductLightbox
          image={currentImage}
          productName={productName}
          onClose={handleLightboxClose}
        />
      )}
    </>
  );
}
