import React from 'react';
import { motion } from 'framer-motion';

const animations = {
  blurInUp: {
    hidden: { filter: 'blur(10px)', opacity: 0, y: 20 },
    visible: { filter: 'blur(0px)', opacity: 1, y: 0 },
  },
  blurIn: {
    hidden: { filter: 'blur(10px)', opacity: 0 },
    visible: { filter: 'blur(0px)', opacity: 1 },
  },
  slideUp: {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }
};

export const TextAnimate = ({ 
  content, 
  animation = 'blurInUp', 
  by = 'character', 
  once = true,
  className = '',
  delay = 0,
  as: Component = 'span'
}) => {
  let items = [];
  if (by === 'character') {
    items = content.split('');
  } else if (by === 'word') {
    items = content.split(' ');
  } else {
    items = [content];
  }

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: by === 'character' ? 0.02 : 0.05,
        delayChildren: delay
      }
    }
  };

  const itemAnim = animations[animation] || animations.blurInUp;
  const MotionComponent = motion(Component);

  return (
    <MotionComponent
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.1 }}
      style={{ display: Component === 'span' ? 'inline-block' : 'block' }}
    >
      {items.map((item, index) => (
        <motion.span
          key={index}
          variants={itemAnim}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ display: 'inline-block', whiteSpace: item === ' ' ? 'pre' : 'normal' }}
        >
          {item}
          {by === 'word' && index < items.length - 1 && '\u00A0'}
        </motion.span>
      ))}
    </MotionComponent>
  );
};
