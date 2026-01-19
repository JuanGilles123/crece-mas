import React, { memo, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import './IOSModal.css';

/**
 * Modal estilo iOS con animaciones nativas y bottom sheet
 */
const IOSModal = memo(({ 
  isOpen,
  onClose,
  children,
  title,
  variant = 'center', // center, bottom, fullscreen
  size = 'medium', // small, medium, large, full
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  ...props
}) => {
  
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimating(true);
      document.body.style.overflow = 'hidden';
      
      setTimeout(() => setIsAnimating(false), 300);
    } else if (isVisible) {
      setIsAnimating(true);
      
      setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        document.body.style.overflow = '';
      }, 300);
    }
  }, [isOpen, isVisible]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, closeOnEscape, onClose]);

  // Swipe to close para bottom sheet
  const handleTouchStart = (e) => {
    if (variant !== 'bottom') return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (variant !== 'bottom') return;
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (variant !== 'bottom') return;
    const diff = currentY.current - startY.current;
    
    if (modalRef.current) {
      if (diff > 100) {
        onClose();
      } else {
        modalRef.current.style.transform = '';
      }
    }
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const modalClasses = [
    'ios-modal-content',
    `ios-modal-${variant}`,
    `ios-modal-${size}`,
    isOpen && !isAnimating ? 'ios-modal-enter' : 'ios-modal-exit',
    className
  ].filter(Boolean).join(' ');

  const modalContent = (
    <div className="ios-modal-overlay" onClick={handleBackdropClick}>
      <div 
        ref={modalRef}
        className={modalClasses}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {variant === 'bottom' && (
          <div className="ios-modal-handle">
            <div className="ios-modal-handle-bar"></div>
          </div>
        )}
        
        {(title || showCloseButton) && (
          <div className="ios-modal-header">
            {title && <h2 className="ios-modal-title">{title}</h2>}
            {showCloseButton && (
              <button 
                className="ios-modal-close"
                onClick={onClose}
                aria-label="Close"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="ios-modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

IOSModal.displayName = 'IOSModal';

export default IOSModal;
