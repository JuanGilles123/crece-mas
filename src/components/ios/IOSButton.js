import React, { memo, forwardRef } from 'react';
import './IOSButton.css';

/**
 * Botón estilo iOS con animaciones nativas
 */
const IOSButton = memo(forwardRef(({ 
  children,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'medium', // small, medium, large
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  className = '',
  ...props
}, ref) => {
  
  const classes = [
    'ios-btn',
    `ios-btn-${variant}`,
    `ios-btn-${size}`,
    fullWidth && 'ios-btn-full',
    disabled && 'ios-btn-disabled',
    loading && 'ios-btn-loading',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Vibración háptica (solo en dispositivos compatibles)
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="ios-btn-spinner">
          <div className="spinner-circle"></div>
        </div>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className="ios-btn-icon ios-btn-icon-left">{icon}</span>
          )}
          <span className="ios-btn-text">{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="ios-btn-icon ios-btn-icon-right">{icon}</span>
          )}
        </>
      )}
      <span className="ios-btn-ripple"></span>
    </button>
  );
}));

IOSButton.displayName = 'IOSButton';

export default IOSButton;
