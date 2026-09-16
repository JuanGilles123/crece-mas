import React from 'react';
import styles from './Marquee.module.css';

export const Marquee = ({ children, reverse = false, pauseOnHover = false, className = '' }) => {
  return (
    <div className={`${styles.marquee} ${className} ${pauseOnHover ? styles.pauseOnHover : ''}`}>
      <div className={`${styles.marqueeContent} ${reverse ? styles.reverse : ''}`}>
        {children}
        {children}
      </div>
    </div>
  );
};
