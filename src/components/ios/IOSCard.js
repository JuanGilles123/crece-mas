import React, { memo } from 'react';
import './IOSCard.css';

/**
 * Card estilo iOS con animaciones fluidas
 */
const IOSCard = memo(({ 
  children,
  variant = 'elevated', // elevated, flat, outlined, glass
  padding = 'medium', // none, small, medium, large
  hoverable = true,
  clickable = false,
  onClick,
  className = '',
  style = {},
  ...props
}) => {
  
  const classes = [
    'ios-card',
    `ios-card-${variant}`,
    `ios-card-padding-${padding}`,
    hoverable && 'ios-card-hoverable',
    clickable && 'ios-card-clickable',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!clickable) return;
    
    // Vibración háptica
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
    
    onClick?.(e);
  };

  return (
    <div
      className={classes}
      onClick={handleClick}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
});

IOSCard.displayName = 'IOSCard';

export default IOSCard;
