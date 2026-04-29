'use client';

import { useState, useCallback } from 'react';

type ProductGalleryProps = {
  heroImage: string;
  galleryImages: string[];
  productName: string;
  isMobile?: boolean;
};

export function ProductGallery({
  heroImage,
  galleryImages,
  productName,
  isMobile = false,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const allImages = [heroImage, ...galleryImages];
  const currentImage = allImages[activeIndex] || heroImage;

  const handleThumbnailClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const handleImageTap = useCallback(() => {
    setShowLightbox(true);
    document.body.style.overflow = 'hidden';
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

  // Mobile swipe support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    (e.currentTarget as HTMLDivElement).dataset.touchStart = String(touch.clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const container = e.currentTarget as HTMLDivElement;
    const touchStart = Number(container.dataset.touchStart);
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe left = next, Swipe right = prev
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNextImage();
      else handlePrevImage();
    }
  }, [handleNextImage, handlePrevImage]);

  return (
    <>
      {/* Desktop: Main image + Thumbnails below */}
      <div className="product-gallery-container">
        {/* Main image */}
        <div
          className="product-gallery-main"
          onClick={handleImageTap}
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

        {/* Thumbnails Grid (Desktop) or Carousel (Mobile) */}
        {allImages.length > 1 && (
          <div
            className="product-gallery-thumbnails"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              display: 'flex',
              gap: 'var(--space-2)',
              overflowX: isMobile ? 'auto' : 'visible',
              flexWrap: isMobile ? 'nowrap' : 'wrap',
              scrollSnapType: isMobile ? 'x mandatory' : 'none',
              paddingBottom: isMobile ? 'var(--space-2)' : 0,
            }}
          >
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => handleThumbnailClick(idx)}
                className={`gallery-thumbnail ${activeIndex === idx ? 'active' : ''}`}
                style={{
                  flex: isMobile ? '0 0 80px' : '1 1 23%',
                  minWidth: isMobile ? 80 : 'auto',
                  height: 100,
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
                  scrollSnapAlign: 'start',
                }}
              >
                <img
                  src={`/${img}`}
                  alt={`${productName} ${idx}`}
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

        {/* Mobile Dots Indicator */}
        {isMobile && allImages.length > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              marginTop: 'var(--space-3)',
            }}
          >
            {allImages.map((_, idx) => (
              <div
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
                }}
                onClick={() => handleThumbnailClick(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleThumbnailClick(idx);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal (Lazy loaded) */}
      {showLightbox && (
        <Lightbox
          image={currentImage}
          productName={productName}
          onClose={handleLightboxClose}
        />
      )}
    </>
  );
}

type LightboxProps = {
  image: string;
  productName: string;
  onClose: () => void;
};

function Lightbox({ image, productName, onClose }: LightboxProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 'var(--space-4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={`/${image}`}
          alt={productName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            borderRadius: 8,
          }}
        />
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--color-white)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'rgba(255, 255, 255, 0.1)';
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
