import React from 'react';
import { motion } from 'framer-motion';

export const DiaTextReveal = ({ text, children, className = "", once = false, gradient }) => {
  const defaultGradient = `linear-gradient(
    to right, 
    #1ad61a 0%, 
    #1ad61a 35%, 
    #ce1126 45%, 
    #003893 50%, 
    #fcd116 55%, 
    transparent 65%, 
    transparent 100%
  )`;

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.1 }}
      variants={{
        hidden: { backgroundPosition: "100% 50%" },
        visible: { 
          backgroundPosition: "0% 50%",
          transition: { duration: 1.5, ease: "easeOut", delay: 0.8 }
        }
      }}
      style={{
        background: gradient || defaultGradient,
        backgroundSize: "300% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        color: "transparent",
        display: "inline-block",
        paddingRight: "0.1em", // prevent clipping of last character
      }}
    >
      {text || children}
    </motion.span>
  );
};
