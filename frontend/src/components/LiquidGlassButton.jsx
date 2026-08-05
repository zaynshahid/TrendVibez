import React, { useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable premium Liquid Glass Button with cursor-tracking reflection glows
 * and fluid iPhone/iOS active-state spring compression.
 */
export default function LiquidGlassButton({
  children,
  onClick,
  className = '',
  variant = 'primary', // 'primary', 'secondary', 'dark', 'success', 'danger'
  to,
  href,
  type = 'button',
  disabled = false,
  ...props
}) {
  const buttonRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!buttonRef.current || disabled) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    buttonRef.current.style.setProperty('--mx', `${x}px`);
    buttonRef.current.style.setProperty('--my', `${y}px`);
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-liquid-glass-primary';
      case 'success':
        return 'btn-liquid-glass-success';
      case 'danger':
        return 'btn-liquid-glass-danger';
      case 'dark':
        return 'btn-liquid-glass-dark';
      case 'secondary':
      default:
        return ''; // Defaults to base btn-liquid-glass style
    }
  };

  const baseClasses = `btn-liquid-glass ${getVariantClass()} select-none relative z-10 transition-all font-semibold rounded-xl text-center px-5 py-2.5 text-sm ${
    disabled ? 'opacity-45 cursor-not-allowed pointer-events-none' : ''
  } ${className}`;

  // Interactive highlight shine overlay & optional shifting liquid background blobs
  const innerElements = (
    <>
      <span className="glass-glow-overlay" />
      {(variant === 'primary' || variant === 'success' || variant === 'danger') && (
        <span className="liquid-bg-blobs">
          <span className="liquid-bg-blob liquid-bg-blob-1" />
          <span className="liquid-bg-blob liquid-bg-blob-2" />
        </span>
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </>
  );

  if (to && !disabled) {
    return (
      <Link
        ref={buttonRef}
        to={to}
        onMouseMove={handleMouseMove}
        className={baseClasses}
        {...props}
      >
        {innerElements}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a
        ref={buttonRef}
        href={href}
        onMouseMove={handleMouseMove}
        className={baseClasses}
        {...props}
      >
        {innerElements}
      </a>
    );
  }

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={baseClasses}
      {...props}
    >
      {innerElements}
    </button>
  );
}
