'use client';

import { useState } from 'react';

type EcommerceCTAButtonProps = {
  ecommerceUrl?: string | null;
  label?: string;
  className?: string;
};

export function EcommerceCTAButton({
  ecommerceUrl,
  label = 'Comprar Ahora',
  className = 'btn-primary',
}: EcommerceCTAButtonProps) {
  const [error, setError] = useState<boolean>(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (!ecommerceUrl) {
      setError(true);
      return;
    }

    try {
      window.open(ecommerceUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Error opening e-commerce link:', err);
      setError(true);
    }
  };

  if (!ecommerceUrl) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
        <button
          disabled
          className={className}
          style={{
            opacity: 0.5,
            cursor: 'not-allowed',
            backgroundColor: 'var(--color-neutral-400)',
            textAlign: 'center',
          }}
        >
          {label}
        </button>
        {error && (
          <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-red-600)' }}>
            Este producto no está disponible en tienda en línea por el momento.
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
      <a
        href={ecommerceUrl}
        onClick={handleClick}
        className={className}
        style={{ textDecoration: 'none', display: 'block', textAlign: 'center', width: '100%' }}
      >
        {label}
      </a>
      {error && (
        <p style={{ fontSize: 'var(--font-size-small)', color: 'var(--color-red-600)' }}>
          No se pudo abrir el enlace. Por favor, intenta más tarde.
        </p>
      )}
    </div>
  );
}
